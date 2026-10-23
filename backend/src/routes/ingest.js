import { Router } from 'express';
import { env } from '../config/env.js';
import { q } from '../db.js';

const router = Router();

router.post('/event', async (req, res) => {
  if (req.headers['x-ingest-key'] !== env.INGEST_KEY) {
    return res.status(401).json({ ok: false });
  }
  const { kind, payload } = req.body || {};
  if (!kind) return res.status(400).json({ ok: false, error: 'kind required' });

  try {
    switch (kind) {
      case 'heartbeat':
        await q(
          `insert into cache (key, value, expires_at) values ('bot_heartbeat', $1, now() + interval '5 minutes')
           on conflict (key) do update set value = excluded.value, expires_at = excluded.expires_at`,
          [JSON.stringify({ ...payload, at: new Date() })]
        );
        break;

      case 'guild_sync':
        for (const g of payload.guilds || []) {
          await q(
            `insert into guilds
              (guild_id, name, icon, owner_id, member_count, channel_count, role_count,
               boost_level, boost_count, bot_present, is_whitelisted, discord_created_at, joined_at, updated_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10,$11, now(), now())
             on conflict (guild_id) do update set
               name = excluded.name,
               icon = excluded.icon,
               owner_id = excluded.owner_id,
               member_count = excluded.member_count,
               channel_count = excluded.channel_count,
               role_count = excluded.role_count,
               boost_level = excluded.boost_level,
               boost_count = excluded.boost_count,
               bot_present = true,
               is_whitelisted = excluded.is_whitelisted,
               updated_at = now()`,
            [g.id, g.name, g.icon, g.owner_id, g.member_count, g.channel_count,
             g.role_count, g.boost_level, g.boost_count, g.whitelisted,
             g.created_at ? new Date(g.created_at) : null]
          );
        }
        break;

      case 'guild_join':
        await q(
          `insert into guilds (guild_id, name, icon, owner_id, member_count, bot_present, joined_at, updated_at)
           values ($1,$2,$3,$4,$5,true, now(), now())
           on conflict (guild_id) do update set
             name = excluded.name, icon = excluded.icon, owner_id = excluded.owner_id,
             member_count = excluded.member_count, bot_present = true, left_at = null, updated_at = now()`,
          [payload.id, payload.name, payload.icon, payload.owner_id, payload.member_count]
        );
        break;

      case 'guild_leave':
        await q(
          `update guilds set bot_present = false, left_at = now(), updated_at = now() where guild_id = $1`,
          [payload.id]
        );
        break;

      case 'command_used':
        await q(
          `insert into command_logs (user_id, username, guild_id, guild_name, command)
           values ($1,$2,$3,$4,$5)`,
          [payload.user_id, payload.username, payload.guild_id, payload.guild_name, payload.command]
        );
        if (payload.user_id) {
          await q('update users set total_commands = total_commands + 1 where discord_id = $1', [payload.user_id]);
        }
        if (payload.guild_id) {
          await q('update guilds set command_count = command_count + 1 where guild_id = $1', [payload.guild_id]);
        }
        break;

      case 'action_result':
        await q(
          `update action_logs
           set status = $2, result = $3, error = $4, finished_at = now()
           where job_id = $1`,
          [payload.job_id, payload.status, JSON.stringify(payload.result ?? null), payload.error ?? null]
        );
        break;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[ingest]', kind, err.message);
    res.status(500).json({ ok: false });
  }
});

export default router;
