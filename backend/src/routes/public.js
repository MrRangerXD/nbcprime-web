import { Router } from 'express';
import { many, one } from '../db.js';
import { botGet } from '../services/bot.js';

const router = Router();

// chhota in-process cache, taaki homepage refresh bot VPS ko hammer na kare
const cache = new Map();

const cached = async (key, ttlMs, fn) => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;

  const value = await fn();
  cache.set(key, { at: Date.now(), value });

  if (cache.size > 64) {
    for (const [k, v] of cache) {
      if (Date.now() - v.at > ttlMs) cache.delete(k);
    }
  }
  return value;
};

router.get('/stats', async (_req, res) => {
  const payload = await cached('stats', 30_000, async () => {
    let live = null;
    try { live = (await botGet('/api/stats')).data; } catch { /* offline */ }

    const counts = await one(
      `select (select count(*) from guilds where bot_present)::int as guild_count,
              (select count(*) from users)::int as user_count`
    );

    return {
      botOnline: !!live,
      stats: {
        guilds: live?.guild_count ?? counts.guildCount,
        members: live?.member_reach ?? 0,
        users: live?.user_count ?? counts.userCount,
        commands: live?.command_count ?? 0,
        latency: live?.latency_ms ?? null,
        uptime: live?.uptime_seconds ?? 0,
      },
    };
  });

  res.json({ ok: true, ...payload });
});

const limitOf = (val, max = 50) => Math.min(Math.max(Number(val) || 10, 1), max);

router.get('/leaderboard/users', async (req, res) => {
  const limit = limitOf(req.query.limit);

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
  const limit = limitOf(req.query.limit);

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
  const limit = limitOf(req.query.limit, 50);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const rows = req.query.type
    ? await many(
        `select id, title, slug, excerpt, cover_image, tags, author_name, published_at, type, views
           from posts where published and type = $1
          order by published_at desc limit $2 offset $3`,
        [req.query.type, limit, offset]
      )
    : await many(
        `select id, title, slug, excerpt, cover_image, tags, author_name, published_at, type, views
           from posts where published order by published_at desc limit $1 offset $2`,
        [limit, offset]
      );

  res.json({ ok: true, data: rows, limit, offset });
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
