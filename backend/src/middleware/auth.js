import jwt from 'jsonwebtoken';
import { env, adminIds, isOwner } from '../config/env.js';
import { one } from '../db.js';

export const cookieName = 'nbc_token';

export const signToken = (user) =>
  jwt.sign({ sub: user.discordId, v: 1 }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES });

export const cookieOptions = () => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  domain: env.COOKIE_DOMAIN === 'localhost' ? undefined : env.COOKIE_DOMAIN,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});

export async function attachUser(req, _res, next) {
  const token = req.cookies?.[cookieName];
  if (!token) return next();
  try {
    const { sub } = jwt.verify(token, env.JWT_SECRET);
    req.user = await one('select * from users where discord_id = $1', [sub]);
  } catch { /* expired */ }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ ok: false, error: 'not_authenticated' });
  if (req.user.isBanned) return res.status(403).json({ ok: false, error: 'banned' });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ ok: false, error: 'not_authenticated' });
  const allowed = req.user.isAdmin || isOwner(req.user.discordId) || adminIds.includes(req.user.discordId);
  if (!allowed) return res.status(403).json({ ok: false, error: 'forbidden' });
  next();
}

export function requireOwner(req, res, next) {
  if (!req.user || !isOwner(req.user.discordId)) {
    return res.status(403).json({ ok: false, error: 'owner_only' });
  }
  next();
}

export function requireGuildAdmin(req, res, next) {
  const gid = req.params.guildId || req.body.guildId;
  if (!req.user) return res.status(401).json({ ok: false, error: 'not_authenticated' });
  const globalOk = req.user.isAdmin || isOwner(req.user.discordId) || adminIds.includes(req.user.discordId);
  if (globalOk || (req.user.adminGuilds || []).includes(String(gid))) return next();
  return res.status(403).json({ ok: false, error: 'not_guild_admin' });
}
