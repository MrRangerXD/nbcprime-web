import { Router } from 'express';
import { many, one, q } from '../db.js';
import { requireAuth, requireAdmin, requireOwner } from '../middleware/auth.js';
import { botGet, botPost, botDelete } from '../services/bot.js';
import { audit } from '../services/audit.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const qstr = String(req.query.q || '').trim();
  const page = Math.max(Math.floor(Number(req.query.page) || 1), 1);
  const limit = Math.min(Math.max(Math.floor(Number(req.query.limit) || 24), 1), 100);
  const offset = (page - 1) * limit;

  // FIX: pehle sirf pura ID match hota tha, aur limit fractional ho to LIMIT 24.5 crash karta tha
  const where = qstr
    ? 'where bot_present and (name ilike $1 or guild_id ilike $1)'
    : 'where bot_present';
  const params = qstr ? ['%' + qstr + '%'] : [];

  const rows = await many(
    `select * from guilds ${where} order by member_count desc limit ${limit} offset ${offset}`,
    params
  );
  const total = await one(`select count(*)::int as n from guilds ${where}`, params);

  res.json({ ok: true, data: rows, total: total.n, page });
});

router.get('/:guildId', async (req, res) => {
  const local = await one('select * from guilds where guild_id = $1', [req.params.guildId]);
  let live = null;
  try { live = (await botGet('/api/guild/' + req.params.guildId)).data; } catch { /* offline */ }
  if (!local && !live) return res.status(404).json({ ok: false, error: 'not_found' });

  const actions = await many(
    'select * from action_logs where guild_id = $1 order by created_at desc limit 15',
    [req.params.guildId]
  );

  res.json({ ok: true, data: { ...(local || {}), live, actions } });
});

router.post('/:guildId/execute', requireAdmin, async (req, res) => {
  const { action, args } = req.body || {};
  if (!action) return res.status(400).json({ ok: false, error: 'action_required' });

  const result = await botPost('/api/execute', { guild_id: req.params.guildId, action, args });

  await q(
    `insert into action_logs (job_id, action, guild_id, requested_by, requested_by_name, status, started_at)
     values ($1,$2,$3,$4,$5,'queued', now())`,
    [result.job_id, action, req.params.guildId, req.user.discordId, req.user.username]
  );

  await audit(req, 'execute:' + action, req.params.guildId, args);
  res.json({ ok: true, jobId: result.job_id });
});

router.get('/:guildId/actions', async (req, res) => {
  const rows = await many(
    'select * from action_logs where guild_id = $1 order by created_at desc limit 30',
    [req.params.guildId]
  );
  res.json({ ok: true, data: rows });
});

router.post('/:guildId/whitelist', requireAdmin, async (req, res) => {
  await botPost('/api/whitelist', { guild_id: req.params.guildId });
  await q('update guilds set is_whitelisted = true, updated_at = now() where guild_id = $1', [req.params.guildId]);
  await audit(req, 'whitelist:add', req.params.guildId);
  res.json({ ok: true });
});

router.delete('/:guildId/whitelist', requireAdmin, async (req, res) => {
  await botDelete('/api/whitelist/' + req.params.guildId);
  await q('update guilds set is_whitelisted = false, updated_at = now() where guild_id = $1', [req.params.guildId]);
  await audit(req, 'whitelist:remove', req.params.guildId);
  res.json({ ok: true });
});

router.post('/:guildId/leave', requireOwner, async (req, res) => {
  const r = await botPost('/api/execute', { guild_id: req.params.guildId, action: 'leave' });
  await audit(req, 'guild:leave', req.params.guildId);
  res.json({ ok: true, jobId: r.job_id });
});

export default router;
