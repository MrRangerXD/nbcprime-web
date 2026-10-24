import { q } from '../db.js';

export async function audit(req, action, target, meta = {}) {
  try {
    await q(
      `insert into audit_logs (actor_id, actor_name, action, target, meta, ip)
       values ($1,$2,$3,$4,$5,$6)`,
      [req.user?.discordId || null, req.user?.username || null, action, target, JSON.stringify(meta), req.ip]
    );
  } catch (e) {
    console.error('[audit]', action, e.message);
  }
}
