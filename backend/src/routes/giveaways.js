import { Router } from 'express';
import { many, one, q } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { botPost } from '../services/bot.js';
import { audit } from '../services/audit.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const filters = [];
  const params = [];
  if (req.query.guildId) { params.push(req.query.guildId); filters.push(`guild_id = $${params.length}`); }
  if (req.query.status) { params.push(req.query.status); filters.push(`status = $${params.length}`); }
  const where = filters.length ? 'where ' + filters.join(' and ') : '';

  const rows = await many(`select * from giveaways ${where} order by created_at desc limit 100`, params);
  res.json({ ok: true, data: rows });
});

router.post('/', requireAdmin, async (req, res) => {
  const { guildId, channelId, prize, minutes = 60, winners = 1 } = req.body;
  if (!guildId || !prize) return res.status(400).json({ ok: false, error: 'guildId and prize required' });

  const guild = await one('select name from guilds where guild_id = $1', [guildId]);

  const result = await botPost('/api/execute', {
    guild_id: guildId,
    action: 'giveaway_create',
    args: {
      prize,
      minutes: Number(minutes),
      winners: Number(winners),
      channel_id: channelId ? Number(channelId) : undefined,
    },
  });

  const doc = await one(
    `insert into giveaways
      (guild_id, guild_name, channel_id, prize, winners_count, host_id, host_name, ends_at, status)
     values ($1,$2,$3,$4,$5,$6,$7, now() + make_interval(mins => $8), 'active')
     returning *`,
    [guildId, guild ? guild.name : null, channelId || null, prize, Number(winners),
     req.user.discordId, req.user.username, Number(minutes)]
  );

  await audit(req, 'giveaway:create', guildId, { prize, minutes, winners });
  res.json({ ok: true, data: doc, jobId: result.job_id });
});

router.post('/:id/end', requireAdmin, async (req, res) => {
  const g = await one('select * from giveaways where id = $1', [req.params.id]);
  if (!g) return res.status(404).json({ ok: false, error: 'not_found' });

  const r = await botPost('/api/execute', {
    guild_id: g.guildId,
    action: 'giveaway_end',
    args: { message_id: g.messageId || req.body.messageId },
  });

  await q(`update giveaways set status = 'ended', ended_at = now() where id = $1`, [req.params.id]);
  await audit(req, 'giveaway:end', g.guildId);
  res.json({ ok: true, jobId: r.job_id });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await q(`update giveaways set status = 'cancelled' where id = $1`, [req.params.id]);
  await audit(req, 'giveaway:cancel', req.params.id);
  res.json({ ok: true });
});

export default router;
