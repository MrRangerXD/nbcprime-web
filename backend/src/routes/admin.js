import { Router } from 'express';
import slugify from 'slugify';
import { many, one, q } from '../db.js';
import { requireAdmin, requireOwner } from '../middleware/auth.js';
import { botGet, botPost, BotDown } from '../services/bot.js';
import { audit } from '../services/audit.js';
import { grantPremium } from '../services/premium.js';

const router = Router();
router.use(requireAdmin);

router.get('/overview', async (_req, res) => {
  const counts = await one(
    `select
       (select count(*) from users)::int as users,
       (select count(*) from guilds where bot_present)::int as guilds,
       (select count(*) from giveaways where status = 'active')::int as giveaways,
       (select count(*) from command_logs where created_at > now() - interval '24 hours')::int as commands_today`
  );
  const recentAudit = await many('select * from audit_logs order by created_at desc limit 20');

  let bot = { online: false };
  try { bot = { online: true, ...(await botGet('/api/stats')).data }; } catch { /* offline */ }

  res.json({
    ok: true,
    data: {
      users: counts.users,
      guilds: counts.guilds,
      activeGuilds: counts.guilds,
      giveaways: counts.giveaways,
      commandsToday: counts.commandsToday,
      recentAudit,
      bot,
    },
  });
});

router.get('/users', async (req, res) => {
  const qstr = String(req.query.q || '').trim();
  const page = Math.max(Math.floor(Number(req.query.page) || 1), 1);
  const limit = Math.min(Math.max(Math.floor(Number(req.query.limit) || 30), 1), 100);
  const offset = (page - 1) * limit;

  // FIX: discord_id = $2 se ID ka prefix match nahi hota tha, aur LIMIT 24.5 crash karta tha
  const where = qstr ? 'where username ilike $1 or discord_id ilike $1' : '';
  const params = qstr ? ['%' + qstr + '%'] : [];

  const rows = await many(
    `select * from users ${where} order by last_login_at desc nulls last limit ${limit} offset ${offset}`,
    params
  );
  const total = await one(`select count(*)::int as n from users ${where}`, params);

  res.json({ ok: true, data: rows, total: total.n });
});

router.post('/users/:id/premium', async (req, res) => {
  const value = !!req.body.value;
  // FIX: lifetime ko 'web:<id>' nahi, 'lifetime' likho warna detect nahi hota
  const user = await one(
    `update users
        set is_premium = $2,
            premium_source = case when $2 then 'lifetime' else null end,
            premium_until = case when $2 then null else premium_until end,
            updated_at = now()
      where discord_id = $1 returning *`,
    [req.params.id, value]
  );
  await audit(req, value ? 'premium:add' : 'premium:remove', req.params.id);
  res.json({ ok: true, data: user });
});

router.post('/premium/:id/approve', requireOwner, async (req, res) => {
  const r = await one('select * from premium_requests where id = $1', [req.params.id]);
  if (!r) return res.status(404).json({ ok: false, error: 'not_found' });
  await q(`update premium_requests set status='approved', reviewed_at=now(), reviewed_by=$2 where id=$1`,
    [r.id, req.user.discordId]);
  await grantPremium(r.discordId, r.durationDays, 'manual');
  res.json({ ok: true });
});

router.post('/users/:id/admin', requireOwner, async (req, res) => {
  const user = await one(
    `update users set is_admin = $2, updated_at = now() where discord_id = $1 returning *`,
    [req.params.id, !!req.body.value]
  );
  await audit(req, 'admin:toggle', req.params.id, { value: !!req.body.value });
  res.json({ ok: true, data: user });
});

router.post('/users/:id/ban', async (req, res) => {
  const value = !!req.body.value;
  const user = await one(
    `update users set is_banned = $2, blacklist_reason = $3, updated_at = now()
     where discord_id = $1 returning *`,
    [req.params.id, value, req.body.reason || null]
  );
  await audit(req, value ? 'user:ban' : 'user:unban', req.params.id, { reason: req.body.reason });
  res.json({ ok: true, data: user });
});

router.get('/posts', async (_req, res) => {
  const rows = await many('select * from posts order by created_at desc limit 100');
  res.json({ ok: true, data: rows });
});

router.post('/posts', async (req, res) => {
  const { type, title, excerpt, content, coverImage, tags, published } = req.body;
  if (!type || !title) return res.status(400).json({ ok: false, error: 'type and title required' });

  let slug = slugify(title, { lower: true, strict: true }) || 'post';
  const clash = await one('select 1 as x from posts where slug = $1', [slug]);
  if (clash) slug = slug + '-' + Date.now().toString(36);

  const post = await one(
    `insert into posts
      (type, title, slug, excerpt, content, cover_image, tags, published, published_at, author_id, author_name)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     returning *`,
    [type, title, slug, excerpt || null, content || null, coverImage || null,
     tags || [], !!published, published ? new Date() : null,
     req.user.discordId, req.user.username]
  );

  await audit(req, 'post:create', slug, { type });
  res.json({ ok: true, data: post });
});

// FIX: coalesce se koi field NULL nahi ho sakta tha
router.patch('/posts/:id', async (req, res) => {
  const b = req.body || {};
  const fields = [];
  const params = [req.params.id];

  const push = (col, val) => { params.push(val); fields.push(`${col} = $${params.length}`); };

  if (b.title !== undefined) push('title', b.title);
  if (b.excerpt !== undefined) push('excerpt', b.excerpt);
  if (b.content !== undefined) push('content', b.content);
  if (b.coverImage !== undefined) push('cover_image', b.coverImage);
  if (b.type !== undefined) push('type', b.type);
  if (b.tags !== undefined) push('tags', b.tags);
  if (typeof b.published === 'boolean') {
    push('published', b.published);
    fields.push(`published_at = case when $${params.length} and published_at is null then now() else published_at end`);
  }

  if (!fields.length) return res.status(400).json({ ok: false, error: 'nothing_to_update' });

  const post = await one(
    `update posts set ${fields.join(', ')}, updated_at = now() where id = $1 returning *`,
    params
  );
  if (!post) return res.status(404).json({ ok: false, error: 'not_found' });

  await audit(req, 'post:update', req.params.id);
  res.json({ ok: true, data: post });
});

router.delete('/posts/:id', async (req, res) => {
  await q('delete from posts where id = $1', [req.params.id]);
  await audit(req, 'post:delete', req.params.id);
  res.json({ ok: true });
});

router.post('/broadcast', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ ok: false, error: 'message required' });
  const r = await botPost('/api/broadcast', { message });
  await audit(req, 'broadcast', 'all', { message });
  res.json({ ok: true, jobId: r.job_id });
});

router.get('/actions', async (_req, res) => {
  const rows = await many('select * from action_logs order by created_at desc limit 100');
  res.json({ ok: true, data: rows });
});

router.get('/logs', async (_req, res) => {
  const rows = await many('select * from audit_logs order by created_at desc limit 200');
  res.json({ ok: true, data: rows });
});

router.get('/health', async (_req, res) => {
  try {
    res.json({ ok: true, bot: await botGet('/api/health') });
  } catch (e) {
    res.status(BotDown(e) ? 503 : 500).json({ ok: false, error: e.message });
  }
});

export default router;
