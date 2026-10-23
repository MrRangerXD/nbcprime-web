import { Router } from 'express';
import { many, one } from '../db.js';
import { botGet } from '../services/bot.js';

const router = Router();

router.get('/stats', async (_req, res) => {
  let live = null;
  try { live = (await botGet('/api/stats')).data; } catch { /* offline */ }

  const counts = await one(
    `select
       (select count(*) from guilds where bot_present)::int as guild_count,
       (select count(*) from users)::int as user_count`
  );

  res.json({
    ok: true,
    botOnline: !!live,
    stats: {
      guilds: live?.guild_count ?? counts.guildCount,
      members: live?.member_reach ?? 0,
      users: live?.user_count ?? counts.userCount,
      commands: live?.command_count ?? 0,
      latency: live?.latency_ms ?? null,
      uptime: live?.uptime_seconds ?? 0,
    },
  });
});

router.get('/leaderboard/users', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
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

router.get('/leaderboard/servers', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
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

router.get('/posts', async (req, res) => {
  const rows = req.query.type
    ? await many(
        `select id, title, slug, excerpt, cover_image, tags, author_name, published_at, type, views
         from posts where published and type = $1 order by published_at desc limit 50`,
        [req.query.type]
      )
    : await many(
        `select id, title, slug, excerpt, cover_image, tags, author_name, published_at, type, views
         from posts where published order by published_at desc limit 50`
      );
  res.json({ ok: true, data: rows });
});

router.get('/posts/:slug', async (req, res) => {
  const post = await one(
    `update posts set views = views + 1 where slug = $1 and published returning *`,
    [req.params.slug]
  );
  if (!post) return res.status(404).json({ ok: false, error: 'not_found' });
  res.json({ ok: true, data: post });
});

router.get('/giveaways', async (_req, res) => {
  const rows = await many(
    `select * from giveaways where status = 'active' order by ends_at asc limit 20`
  );
  res.json({ ok: true, data: rows });
});

export default router;
