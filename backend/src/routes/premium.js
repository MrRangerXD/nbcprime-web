import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { pool, one, many, q, mapRow } from '../db.js';
import { ADDRESSES, quote, paymentUri, findPayment } from '../services/crypto.js';
import { grantPremium } from '../services/premium.js';
import { env } from '../config/env.js';

const router = Router();

export const PLANS = {
  '10d':  { id: '10d',  label: '10 Days',  inr: 30,  usd: 0.32, days: 10 },
  '30d':  { id: '30d',  label: '30 Days',  inr: 80,  usd: 0.84, days: 30 },
  'life': { id: 'life', label: 'Lifetime', inr: 435, usd: 4.57, days: null },
};

const CURRENCIES = ['LTC', 'SOL'];
const ABS_TOLERANCE = { LTC: 0.0002, SOL: 0.00002 };
const REL_TOLERANCE = 0.0025;
const INTENT_MINUTES = 30;
const SETTLE_WINDOW_HOURS = 24;

const toleranceFor = (cur, amt) => Math.max(amt * REL_TOLERANCE, ABS_TOLERANCE[cur] ?? 1e-8);

const buildIntent = (row) => ({
  id: row.id,
  plan: row.plan,
  label: PLANS[row.plan]?.label ?? row.plan,
  currency: row.currency,
  amount: Number(row.amountCrypto),
  address: row.payAddress,
  uri: paymentUri(row.currency, row.payAddress, Number(row.amountCrypto)),
  expiresAt: row.expiresAt,
  usd: PLANS[row.plan]?.usd ?? null,
  inr: PLANS[row.plan]?.inr ?? null,
});

const ingestKey = (req) =>
  req.get('x-ingest-key') || req.get('x-api-key') ||
  (req.get('authorization') || '').replace(/^Bearer\s+/i, '');

const isActive = (u) =>
  Boolean(u?.isPremium) &&
  (!u.premiumUntil || new Date(u.premiumUntil).getTime() > Date.now());

const isExpired = (row) => {
  if (!row?.expiresAt) return true;
  const t = new Date(row.expiresAt).getTime();
  return !Number.isNaN(t) && t < Date.now();
};

router.get('/plans', (_req, res) => {
  res.json({ ok: true, plans: Object.values(PLANS), currencies: CURRENCIES });
});

router.get('/check/:discordId', async (req, res) => {
  if (ingestKey(req) !== env.INGEST_KEY) return res.status(401).json({ ok: false, error: 'bad_key' });

  const u = await one(
    'select is_premium, premium_until, premium_source from users where discord_id = $1',
    [req.params.discordId]
  );
  if (!u) return res.json({ ok: true, premium: false });
  res.json({ ok: true, premium: isActive(u), until: u.premiumUntil || null, source: u.premiumSource || null });
});

router.post('/check-bulk', async (req, res) => {
  if (ingestKey(req) !== env.INGEST_KEY) return res.status(401).json({ ok: false, error: 'bad_key' });

  const ids = (req.body?.ids || []).map(String);
  if (!ids.length) return res.json({ ok: true, premium: {} });

  const rows = await many(
    'select discord_id, is_premium, premium_until from users where discord_id = any($1)',
    [ids]
  );
  const premium = Object.fromEntries(ids.map((id) => [id, false]));
  for (const r of rows) premium[r.discordId] = isActive(r);
  res.json({ ok: true, premium });
});

router.get('/status', requireAuth, async (req, res) => {
  const uid = req.user.discordId;

  const [last, open] = await Promise.all([
    one('select * from premium_requests where discord_id = $1 order by created_at desc limit 1', [uid]),
    // FIX: expire hone ke baad bhi intent dikhe, taaki Verify dabaya ja sake
    one(
      `select * from premium_requests
        where discord_id = $1 and status <> 'approved' and txid is null
          and created_at > now() - make_interval(hours => $2::int)
        order by created_at desc limit 1`,
      [uid, SETTLE_WINDOW_HOURS]
    ),
  ]);

  res.json({
    ok: true,
    premium: isActive(req.user),
    until: req.user.premiumUntil || null,
    source: req.user.premiumSource || null,
    pending: open ? buildIntent(open) : null,
    expired: open ? isExpired(open) : false,
    last: last ? { id: last.id, plan: last.plan, status: last.status, currency: last.currency } : null,
  });
});

// FIX: status='pending' se relaxed — expired/cancelled row bhi approve ho sake
async function settle(client, row, txid, reviewedBy) {
  const upd = await client.query(
    `update premium_requests
        set status='approved', txid=$2, paid_at=now(), reviewed_at=now(), reviewed_by=$3
      where id=$1 and status <> 'approved'`,
    [row.id, txid, reviewedBy]
  );
  if (!upd.rowCount) return false;

  await grantPremium(row.discordId, row.durationDays, 'crypto:' + row.currency, client);
  return true;
}

const chainLookup = async (row) => {
  try {
    return await findPayment(
      row.currency, row.payAddress, Number(row.amountCrypto),
      toleranceFor(row.currency, Number(row.amountCrypto)),
      new Date(row.createdAt).getTime()
    );
  } catch {
    return null;
  }
};

router.post('/intent', requireAuth, async (req, res) => {
  const plan = PLANS[req.body?.plan];
  const currency = String(req.body?.currency || 'LTC').toUpperCase();
  if (!plan) return res.status(400).json({ ok: false, error: 'bad_plan' });
  if (!CURRENCIES.includes(currency)) return res.status(400).json({ ok: false, error: 'bad_currency' });

  const uid = req.user.discordId;

  // FIX: sirf 'pending' nahi — 24 ghante ke saare unpaid intents pe payment dhoondo,
  // chahe wo cancel/expire ho chuke ho. Warna paisa hamesha ke liye kho jata tha.
  const settled = [];
  const open = await many(
    `select * from premium_requests
      where discord_id = $1 and status <> 'approved' and txid is null
        and created_at > now() - make_interval(hours => $2::int)`,
    [uid, SETTLE_WINDOW_HOURS]
  );

  for (const r of open) {
    const hit = await chainLookup(r);
    if (!hit) continue;

    const client = await pool.connect();
    try {
      await client.query('begin');
      const clash = await client.query(
        'select id from premium_requests where txid=$1 and id<>$2', [hit.txid, r.id]
      );
      if (!clash.rowCount && await settle(client, r, hit.txid, 'chain:auto')) {
        settled.push({ plan: r.plan, txid: hit.txid });
      }
      await client.query('commit');
    } catch {
      await client.query('rollback').catch(() => {});
    } finally {
      client.release();
    }
  }

  await q(
    `update premium_requests set status='cancelled'
      where discord_id=$1 and status='pending' and txid is null`,
    [uid]
  );

  let price;
  try {
    price = await quote(currency, plan.usd);
  } catch {
    return res.status(503).json({ ok: false, error: 'rate_unavailable' });
  }

  const row = await one(
    `insert into premium_requests
       (discord_id, username, plan, amount_inr, amount_usd, duration_days,
        currency, amount_crypto, pay_address, expires_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9, now() + make_interval(mins => $10::int))
     returning *`,
    [uid, req.user.username, plan.id, plan.inr, plan.usd, plan.days,
     currency, price.amount, ADDRESSES[currency], INTENT_MINUTES]
  );

  res.json({ ok: true, intent: buildIntent(row), settled });
});

router.post('/verify/:id', requireAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const locked = await client.query('select * from premium_requests where id=$1 for update', [req.params.id]);
    const r = locked.rows[0] ? mapRow(locked.rows[0]) : null;

    if (!r || String(r.discordId) !== String(req.user.discordId)) {
      await client.query('rollback');
      return res.status(404).json({ ok: false, error: 'not_found' });
    }
    if (r.status === 'approved') {
      await client.query('rollback');
      return res.json({ ok: true, status: 'approved', premium: true, txid: r.txid });
    }

    const expired = isExpired(r);

    // FIX: expiry pe turant bail na karo — pehle chain dekho.
    // Time pe pay kiya aur 31 min baad verify kiya => premium milna CHAHIYE.
    let hit = null;
    try {
      hit = await findPayment(
        r.currency, r.payAddress, Number(r.amountCrypto),
        toleranceFor(r.currency, Number(r.amountCrypto)),
        new Date(r.createdAt).getTime()
      );
    } catch {
      await client.query('rollback');
      return res.json({ ok: true, status: expired ? 'expired' : 'pending', error: 'chain_unreachable' });
    }

    if (!hit) {
      if (expired) {
        await client.query(
          `update premium_requests set status='expired' where id=$1 and status <> 'approved'`, [r.id]
        );
        await client.query('commit');
        return res.json({ ok: true, status: 'expired' });
      }
      await client.query('rollback');
      return res.json({ ok: true, status: 'pending' });
    }

    const clash = await client.query(
      'select id from premium_requests where txid=$1 and id<>$2', [hit.txid, r.id]
    );
    if (clash.rowCount) {
      await client.query('rollback');
      return res.json({ ok: true, status: 'pending', error: 'tx_already_used' });
    }

    if (!await settle(client, r, hit.txid, 'chain')) {
      await client.query('rollback');
      return res.json({ ok: true, status: 'approved', premium: true, txid: hit.txid });
    }

    await client.query('commit');
    res.json({ ok: true, status: 'approved', premium: true, txid: hit.txid });
  } catch (e) {
    await client.query('rollback').catch(() => {});
    console.error('[premium/verify]', e);
    if (!res.headersSent) res.status(500).json({ ok: false, error: 'verify_failed' });
  } finally {
    client.release();
  }
});

router.post('/cancel/:id', requireAuth, async (req, res) => {
  await q(
    `update premium_requests set status='cancelled'
      where id=$1 and discord_id=$2 and status='pending' and txid is null`,
    [req.params.id, req.user.discordId]
  );
  res.json({ ok: true });
});

router.get('/history', requireAuth, async (req, res) => {
  const rows = await many(
    `select id, plan, status, currency, amount_crypto, amount_inr, txid, created_at, paid_at
       from premium_requests where discord_id=$1 order by created_at desc limit 25`,
    [req.user.discordId]
  );
  res.json({ ok: true, data: rows });
});

export default router;
