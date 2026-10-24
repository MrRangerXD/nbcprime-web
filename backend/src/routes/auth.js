import { Router } from 'express';
import axios from 'axios';
import crypto from 'node:crypto';
import { env, adminIds, isOwner } from '../config/env.js';
import { one } from '../db.js';
import { signToken, cookieName, cookieOptions, requireAuth } from '../middleware/auth.js';
import { encrypt } from '../lib/crypto.js';
import { audit } from '../services/audit.js';

const router = Router();
const DISCORD_API = 'https://discord.com/api/v10';

const STATE_COOKIE = 'nbc_state';
const stateCookieOpts = () => ({ httpOnly: true, secure: env.COOKIE_SECURE, maxAge: 600000, sameSite: 'lax', path: '/' });
const stateClearOpts  = () => ({ httpOnly: true, secure: env.COOKIE_SECURE, sameSite: 'lax', path: '/' });

const timingSafeEqualStr = (a, b) => {
  if (!a || !b) return false;
  const ba = Buffer.from(String(a)), bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

router.get('/discord', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie(STATE_COOKIE, state, stateCookieOpts());

  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify email guilds',
    state,
    prompt: 'consent',
  });
  res.redirect('https://discord.com/oauth2/authorize?' + params);
});

const isGuildAdmin = (g) => {
  if (g.owner) return true;
  try { return (BigInt(g.permissions ?? '0') & 0x20n) === 0x20n; } catch { return false; }
};

router.get('/discord/callback', async (req, res) => {
  const { code, state } = req.query;
  const expected = req.cookies?.[STATE_COOKIE];
  const fail = (reason) => res.redirect(env.FRONTEND_URL + '/login?error=' + reason);

  if (!code) return fail('no_code');
  if (!timingSafeEqualStr(state, expected)) return fail('bad_state');

  try {
    const tokenRes = await axios.post(
      DISCORD_API + '/oauth2/token',
      new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: env.DISCORD_REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    const meRes = await axios.get(DISCORD_API + '/users/@me', {
      headers: { Authorization: 'Bearer ' + access_token }, timeout: 10000,
    });
    const guildsRes = await axios.get(DISCORD_API + '/users/@me/guilds', {
      headers: { Authorization: 'Bearer ' + access_token }, timeout: 10000,
    });

    const me = meRes.data;
    const adminGuilds = (guildsRes.data || []).filter(isGuildAdmin).map((g) => g.id);

    const user = await one(
      `insert into users
        (discord_id, username, global_name, avatar, banner, email,
         access_token, refresh_token, token_expires_at, admin_guilds, last_login_at, login_count, is_admin)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now(), 1, $11)
       on conflict (discord_id) do update set
         username = excluded.username,
         global_name = excluded.global_name,
         avatar = excluded.avatar,
         banner = excluded.banner,
         email = excluded.email,
         access_token = excluded.access_token,
         refresh_token = excluded.refresh_token,
         token_expires_at = excluded.token_expires_at,
         admin_guilds = excluded.admin_guilds,
         last_login_at = now(),
         login_count = users.login_count + 1,
         updated_at = now()
       returning *`,
      [me.id, me.username, me.global_name, me.avatar, me.banner, me.email,
       encrypt(access_token), encrypt(refresh_token),
       new Date(Date.now() + expires_in * 1000), adminGuilds, adminIds.includes(me.id)]
    );

    res.cookie(cookieName, signToken(user), cookieOptions());
    res.clearCookie(STATE_COOKIE, stateClearOpts());
    await audit({ user, ip: req.ip }, 'login', user.discordId);
    res.redirect(env.FRONTEND_URL + '/dashboard');
  } catch (err) {
    console.error('[auth]', err.response?.data || err.message);
    fail('oauth_failed');
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(cookieName, { ...cookieOptions(), maxAge: undefined });
  res.clearCookie(STATE_COOKIE, stateClearOpts());
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  const u = req.user;
  res.json({
    ok: true,
    user: {
      id: u.discordId,
      username: u.username,
      globalName: u.globalName,
      avatar: u.avatar,
      isAdmin: u.isAdmin || isOwner(u.discordId) || adminIds.includes(u.discordId),
      isOwner: isOwner(u.discordId),
      isPremium: u.isPremium,
      premiumUntil: u.premiumUntil,
      isBanned: u.isBanned,
      banReason: u.blacklistReason,
      adminGuilds: u.adminGuilds || [],
    },
  });
});

export default router;
