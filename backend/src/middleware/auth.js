import jwt from 'jsonwebtoken';
import { env, adminIds, isOwner } from '../config/env.js';
import { one, q } from '../db.js';

export const cookieName = 'nbc_token';

export const signToken = (user) =>
  jwt.sign({ sub: String(user.discordId), v: 1 }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES });

export const cookieOptions = () => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  // cross-site (vercel.app -> railway.app) pe 'lax' login todta hai
  sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
  domain: !env.COOKIE_DOMAIN || env.COOKIE_DOMAIN === 'localhost' ? undefined : env.COOKIE_DOMAIN,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});

export async function attachUser(req, _res, next) {
  const token = req.cookies?.[cookieName];
  if (!token) return next();

  try {
    const { sub } = jwt.verify(token, env.JWT_SECRET);
    req.user = await one('select * from users where discord_id = $1', [sub]);
  } catch { /* expired or tampered */ }

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

  const gid = req.params.guildId || req.body?.guildId; // req.body can be undefined
  if (!gid) return res.status(400).json({ ok: false, error: 'guild_id_required' });

  if (isGlobalAdmin(req.user) || (req.user.adminGuilds || []).map(String).includes(String(gid))) return next();
  return res.status(403).json({ ok: false, error: 'not_guild_admin' });
}
