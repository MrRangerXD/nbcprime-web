import jwt from 'jsonwebtoken';
import axios from 'axios';
import { env, adminIds, isOwner } from '../config/env.js';
import { one, q } from '../db.js';
import { encrypt, decrypt } from '../lib/crypto.js';

export const cookieName = 'nbc_token';

export const signToken = (user) =>
  jwt.sign({ sub: String(user.discordId), v: 1 }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES });

// FIX: cookie ka maxAge JWT_EXPIRES se match kare, warna token zinda aur cookie dead
const parseDuration = (str) => {
  const m = /^(\d+)\s*([smhd])$/i.exec(String(str || '').trim());
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  return Number(m[1]) * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2].toLowerCase()];
};

export const cookieOptions = () => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  // cross-site (vercel.app -> railway.app) pe 'lax' login todta hai
  sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
  domain: !env.COOKIE_DOMAIN || env.COOKIE_DOMAIN === 'localhost' ? undefined : env.COOKIE_DOMAIN,
  maxAge: parseDuration(env.JWT_EXPIRES),
  path: '/',
});

// FIX: pehle access_token/refresh_token sirf likhe jaate the, padhe kabhi nahi.
async function refreshIfExpired(user) {
  if (!user?.tokenExpiresAt || !user.refreshToken) return user;

  const expires = new Date(user.tokenExpiresAt).getTime();
  if (Number.isNaN(expires) || expires - Date.now() > 60_000) return user;

  const refresh = decrypt(user.refreshToken);
  if (!refresh) return user;

  try {
    const { data } = await axios.post(
      'https://discord.com/api/v10/oauth2/token',
      new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refresh,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 8000 }
    );

    const fresh = await one(
      `update users
          set access_token = $2, refresh_token = $3, token_expires_at = $4, updated_at = now()
        where discord_id = $1 returning *`,
      [user.discordId, encrypt(data.access_token), encrypt(data.refresh_token),
       new Date(Date.now() + data.expires_in * 1000)]
    );
    return fresh || user;
  } catch {
    return user;
  }
}

export async function attachUser(req, _res, next) {
  const token = req.cookies?.[cookieName];
  if (!token) return next();

  try {
    const { sub } = jwt.verify(token, env.JWT_SECRET);
    req.user = await one('select * from users where discord_id = $1', [sub]);
  } catch (e) {
    // FIX: DB error ko silently logout na samjho
    if (e?.name !== 'JsonWebTokenError' && e?.name !== 'TokenExpiredError') {
      console.error('[auth] attachUser:', e.message);
    }
  }

  if (req.user) req.user = await refreshIfExpired(req.user);

  // expired premium: flag it AND persist it
  if (req.user?.isPremium && req.user.premiumUntil && new Date(req.user.premiumUntil).getTime() < Date.now()) {
    req.user.isPremium = false;
    q('update users set is_premium = false, updated_at = now() where discord_id = $1', [req.user.discordId])
      .catch(() => {});
  }

  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ ok: false, error: 'not_authenticated' });
  if (req.user.isBanned) return res.status(403).json({ ok: false, error: 'banned' });
  next();
}

const isGlobalAdmin = (u) => Boolean(u) && (u.isAdmin || isOwner(u.discordId) || adminIds.includes(String(u.discordId)));

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ ok: false, error: 'not_authenticated' });
  if (!isGlobalAdmin(req.user)) return res.status(403).json({ ok: false, error: 'forbidden' });
  next();
}

export function requireOwner(req, res, next) {
  if (!req.user || !isOwner(req.user.discordId)) return res.status(403).json({ ok: false, error: 'owner_only' });
  next();
}

export function requireGuildAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ ok: false, error: 'not_authenticated' });

  const gid = req.params.guildId || req.body?.guildId;
  if (!gid) return res.status(400).json({ ok: false, error: 'guild_id_required' });

  if (isGlobalAdmin(req.user) || (req.user.adminGuilds || []).map(String).includes(String(gid))) return next();
  return res.status(403).json({ ok: false, error: 'not_guild_admin' });
}
