import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { many, scalar, one, q } from '../db.js';
import { BOT_DEFAULTS, sanitizeOverrides, pickOverrides } from '../lib/nukeDefaults.js';

const router = Router();
router.use(requireAuth);

// FIX: async handler ka rejection Express 4 me error middleware tak nahi pahunchta,
// request hang ho jaati thi (DB down hone par). Har handler wrap me chalao.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// nuke_configs ke columns snake_case hain, par API contract camelCase hai.
const COLUMN_TO_KEY = {
  server_name: 'serverName',
  custom_channel_name: 'customChannelName',
  channel_count: 'channelCount',
  spam_message: 'spamMessage',
  server_description: 'serverDescription',
  server_icon_url: 'serverIconUrl',
};

// FIX: pickOverrides() camelCase keys padhta hai, lekin `select *` snake_case deta hai.
// Pehle ye har baar {} return karta tha -> saved config kabhi UI me nahi dikhta tha,
// aur isDefault false hone ki wajah se form "Custom" badge ke saath khaali dikhta tha.
const toConfig = (row) => {
  if (!row) return {};
  const camel = {};
  for (const [col, key] of Object.entries(COLUMN_TO_KEY)) {
    const v = row[col];
    if (v !== null && v !== undefined) camel[key] = v;
  }
  const cfg = pickOverrides(camel);

  // Alias: Overview.jsx aur DiscordPreview.jsx `channelName` padhte hain.
  // Khaali ho to bot ka default dikhao, warna blank channel render hota hai.
  cfg.channelName = cfg.customChannelName || BOT_DEFAULTS.customChannelName;
  return cfg;
};

// FIX: poora row (encrypted access_token/refresh_token) leak ho raha tha
router.get('/', (req, res) => {
  const { accessToken, refreshToken, ...user } = req.user;
  res.json({ ok: true, user });
});

router.get('/stats', wrap(async (req, res) => {
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
}));

router.get('/guilds', wrap(async (req, res) => {
  const ids = req.user.adminGuilds || [];
  if (!ids.length) return res.json({ ok: true, data: [] });
  const rows = await many(
    'select * from guilds where guild_id = any($1) order by member_count desc',
    [ids]
  );
  res.json({ ok: true, data: rows });
}));

router.get('/nuke-config', wrap(async (req, res) => {
  const saved = await one('select * from nuke_configs where discord_id = $1', [req.user.discordId]);
  res.json({
    ok: true,
    data: { config: toConfig(saved), defaults: BOT_DEFAULTS, isDefault: !saved },
  });
}));

router.patch('/nuke-config', wrap(async (req, res) => {
  const o = sanitizeOverrides(req.body);

  const row = await one(
    `insert into nuke_configs
       (discord_id, server_name, custom_channel_name, channel_count,
        spam_message, server_description, server_icon_url, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7, now())
     on conflict (discord_id) do update set
       server_name         = excluded.server_name,
       custom_channel_name = excluded.custom_channel_name,
       channel_count       = excluded.channel_count,
       spam_message        = excluded.spam_message,
       server_description  = excluded.server_description,
       server_icon_url     = excluded.server_icon_url,
       updated_at          = now()
     returning *`,
    [req.user.discordId, o.serverName, o.customChannelName, o.channelCount,
     o.spamMessage, o.serverDescription, o.serverIconUrl]
  );

  res.json({ ok: true, data: { config: toConfig(row), defaults: BOT_DEFAULTS, isDefault: false } });
}));

router.delete('/nuke-config', wrap(async (req, res) => {
  await q('delete from nuke_configs where discord_id = $1', [req.user.discordId]);
  res.json({ ok: true, data: { config: {}, defaults: BOT_DEFAULTS, isDefault: true } });
}));

export default router;
