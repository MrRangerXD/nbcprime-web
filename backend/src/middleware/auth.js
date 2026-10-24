import jwt from 'jsonwebtoken';
import axios from 'axios';
import { env, adminIds, isOwner } from '../config/env.js';
import { one, q } from '../db.js';
import { encrypt, decrypt } from '../lib/crypto.js';

export const cookieName = 'nbc_token';

export const signToken = (user) =>
  jwt.sign({ sub: String(user.discordId), v: 1 }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES });

const parseDuration = (str) => {
  const m = /^(\d+)\s*([smhd])$/i.exec(String(str || '').trim());
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  return Number(m[1]) * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2].toLowerCase()];
};

// vercel.app / netlify.app etc PUBLIC SUFFIX hain -> unpe cookie scope karna galat hai.
// Host-only cookie bhi XHR pe API host tak pahunchti hai, isliye host-only hi rakho.
const PUBLIC_SUFFIXES = new Set([
  'vercel.app', 'now.sh', 'netlify.app', 'pages.dev', 'onrender.com',
  'fly.dev', 'herokuapp.com', 'web.app', 'firebaseapp.com', 'up.railway.app',
]);

export const cookieDomainFor = (req) => {
  const host = String(req?.hostname || req?.headers?.host || '').split(':')[0].toLowerCase();
  const configured = String(env.COOKIE_DOMAIN || '').trim().replace(/^\./, '');

  if (!configured || configured === 'localhost') return undefined;
  if (PUBLIC_SUFFIXES.has(configured)) return undefined;      // <-- .vercel.app yahin rukta hai
  if (host === configured || host.endsWith('.' + configured)) return '.' + configured;
  return undefined;
};

// SameSite=None ke liye Secure MUST hai. Prod me frontend aur api alag hosts hain,
// to browser ke liye request CROSS-SITE hai -> 'lax' cookie XHR pe drop ho jaati hai.
const secureCookies = () => env.NODE_ENV === 'production' || env.COOKIE_SECURE;

export const cookieOptions = (req) => ({
  httpOnly: true,
  secure: secureCookies(),
  sameSite: secureCookies() ? 'none' : 'lax',
  domain: cookieDomainFor(req),
  maxAge: parseDuration(env.JWT_EXPIRES),
  path: '/',
});

const refreshing = new Set();

async function refreshInBackground(user) {
  if (refreshing.has(user.discordId)) return;
  refreshing.add(user.discordId);
  try {
    const refresh = decrypt(user.refreshToken);
    if (!refresh) return;

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

    await q(
      `update users set access_token=$2, refresh_token=$3, token_expires_at=$4, updated_at=now()
        where discord_id=$1`,
      [user.discordId, encrypt(data.access_token), encrypt(data.refresh_token),
       new Date(Date.now() + data.expires_in * 1000)]
    );
  } catch { /* token rotate ho gaya */ }
  finally { refreshing.delete(user.discordId); }
}

export async function attachUser(req, _res, next) {
  const token = req.cookies?.[cookieName];
  if (!token) return next();

  try {
    const { sub } = jwt.verify(token, env.JWT_SECRET);
    req.user = await one('select * from users where discord_id = $1', [sub]);
  } catch (e) {
    if (e?.name !== 'JsonWebTokenError' && e?.name !== 'TokenExpiredError') {
      console.error('[auth] attachUser:', e.message);
    }
  }

  if (req.user) {
    const exp = req.user.tokenExpiresAt ? new Date(req.user.tokenExpiresAt).getTime() : 0;
    if (exp && exp - Date.now() < 60_000) refreshInBackground(req.user).catch(() => {});
  }

  if (req.user?.isPremium && req.user.premiumUntil && new Date(req.user.premiumUntil).getTime() < Date.now()) {
    req.user.isPremium = false;
    q('update users set is_premium=false, updated_at=now() where discord_id=$1', [req.user.discordId]).catch(() => {});
  }

  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ ok: false, error: 'not_authenticated' });
  next();
}

export function requireNotBanned(req, res, next) {
  if (!req.user) return res.status(401).json({ ok: false, error: 'not_authenticated' });
  if (req.user.isBanned) return res.status(403).json({ ok: false, error: 'banned', reason: req.user.blacklistReason || null });
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
