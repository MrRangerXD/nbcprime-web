import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { botGet } from '../services/bot.js';
import { many } from '../db.js';

const router = Router();
router.use(requireAuth);

router.get('/users', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  try {
    return res.json({ ok: true, source: 'live', data: (await botGet('/api/leaderboard/users', { limit })).data });
  } catch {
    const rows = await many(
      `select discord_id as id, username as name, avatar, total_commands as count
       from users order by total_commands desc limit $1`,
      [limit]
    );
    res.json({ ok: true, source: 'db', data: rows });
  }
});

router.get('/servers', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  try {
    return res.json({ ok: true, source: 'live', data: (await botGet('/api/leaderboard/servers', { limit })).data });
  } catch {
    const rows = await many(
      `select guild_id as id, name, icon, command_count as count, member_count
       from guilds where bot_present order by command_count desc limit $1`,
      [limit]
    );
    res.json({ ok: true, source: 'db', data: rows });
  }
});

router.get('/commands', async (_req, res) => {
  try {
    return res.json({ ok: true, source: 'live', data: (await botGet('/api/leaderboard/commands')).data });
  } catch {
    const rows = await many(
      `select command as name, count(*)::int as count
       from command_logs group by command order by count desc limit 50`
    );
    res.json({ ok: true, source: 'db', data: rows });
  }
});

router.get('/activity', async (req, res) => {
  const days = Math.min(Number(req.query.days) || 14, 60);
  const rows = await many(
    `select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as date, count(*)::int as count
     from command_logs
     where created_at >= now() - make_interval(days => $1::int)
     group by 1 order by 1`,
    [days]
  );
  res.json({ ok: true, data: rows });
});

export default router;
