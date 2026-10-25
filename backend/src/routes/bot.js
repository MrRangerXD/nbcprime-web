import { Router } from 'express';
import { env } from '../config/env.js';
import { one } from '../db.js';
import { DEFAULT_NUKE_CONFIG, pickNukeConfig } from '../lib/nukeDefaults.js';
import { pickOverrides } from '../lib/nukeDefaults.js';

const router = Router();

router.use((req, res, next) => {
  const key = req.get('x-api-key') || req.query.key;
  if (!env.BOT_API_KEY || key !== env.BOT_API_KEY) {
    return res.status(401).json({ ok: false, error: 'bad_key' });
  }
  next();
});

// GET /api/bot/nuke-config/:discordId
// Always 200 with a usable config, so the bot never has to branch on errors.
router.get('/nuke-config/:discordId', async (req, res) => {
  const id = String(req.params.discordId || '').trim();
  if (!/^\d{5,25}$/.test(id)) {
    return res.json({ ok: true, data: DEFAULT_NUKE_CONFIG, isDefault: true });
  }

  try {
    const saved = await one('select * from nuke_configs where discord_id = $1', [id]);
    // `data` = only overridden fields. {} means "use the bot's Config".
    res.json({ ok: true, data: saved ? pickOverrides(saved) : {}, isDefault: !saved });
  } catch (e) {
    console.error('[bot] nuke-config:', e.message);
    res.json({ ok: true, data: {}, isDefault: true });
  }
});

export default router;
