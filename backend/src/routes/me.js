import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { many, scalar } from '../db.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => res.json({ ok: true, user: req.user }));

router.get('/stats', async (req, res) => {
  const uid = req.user.discordId;

  const total = await scalar('select count(*)::int from command_logs where user_id = $1', [uid]);
  const recent = await many(
    'select * from command_logs where user_id = $1 order by created_at desc limit 20',
    [uid]
  );
  const topCommands = await many(
    `select command as name, count(*)::int as count
     from command_logs where user_id = $1
     group by command order by count desc limit 8`,
    [uid]
  );
  const hosted = await scalar('select count(*)::int from giveaways where host_id = $1', [uid]);

  res.json({
    ok: true,
    data: {
      totalCommands: Math.max(total || 0, req.user.totalCommands || 0),
      giveawaysHosted: hosted || 0,
      recent,
      topCommands,
      adminGuildCount: (req.user.adminGuilds || []).length,
    },
  });
});

router.get('/guilds', async (req, res) => {
  const ids = req.user.adminGuilds || [];
  if (!ids.length) return res.json({ ok: true, data: [] });
  const rows = await many(
    'select * from guilds where guild_id = any($1) order by member_count desc',
    [ids]
  );
  res.json({ ok: true, data: rows });
});

export default router;
