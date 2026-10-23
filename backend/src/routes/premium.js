import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { one, q } from '../db.js';
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

router.get('/plans', (_req, res) => {
  res.json({ ok: true, plans: Object.values(PLANS), currencies: CURRENCIES });
});

router.get('/status', requireAuth, async (req, res) => {
  const u = req.user;
  const last = await one(
    `select * from premium_requests where discord_id = $1
      order by created_at desc limit 1`,
    [u.discordId]
  );
  res.json({
    ok: true,
    premium: Boolean(u.isPremium),
    until: u.premiumUntil || null,
    source: u.premiumSource || null,
    last: last
      ? { id: last.id, plan: last.plan, status: last.status, currency: last.currency }
      : null,
  });
});

router.post('/intent', requireAuth, async (req, res) => {
  const plan = PLANS[req.body?.plan];
  const currency = String(req.body?.currency || 'LTC').toUpperCase();
  if (!plan) return res.status(400).json({ ok: false, error: 'bad_plan' });
  if (!CURRENCIES.includes(currency)) return res.status(400).json({ ok: false, error: 'bad_currency' });

  await q(
    `update premium_requests set status = 'expired'
      where discord_id = $1 and status = 'pending' and expires_at < now()`,
    [req.user.discordId]
  );
  await q(
    `update premium_requests set status = 'cancelled'
      where discord_id = $1 and status = 'pending'`,
    [req.user.discordId]
  );

  let q2;
  try {
    q2 = await quote(currency, plan.usd);
  } catch {
    return res.status(503).json({ ok: false, error: 'rate_unavailable' });
  }

  const address = ADDRESSES[currency];
  const row = await one(
    `insert into premium_requests
       (discord_id, username, plan, amount_inr, amount_usd, duration_days,
        currency, amount_crypto, pay_address)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
    [req.user.discordId, req.user.username, plan.id, plan.inr, plan.usd,
     plan.days, currency, q2.amount, address]
  );

  res.json({
    ok: true,
    intent: {
      id: row.id,
      plan: plan.id,
      label: plan.label,
      currency,
      amount: Number(row.amountCrypto),
      address: row.payAddress,
      uri: paymentUri(currency, address, Number(row.amountCrypto)),
      expiresAt: row.expiresAt,
      usd: plan.usd,
      inr: plan.inr,
    },
  });
});

router.post('/verify/:id', requireAuth, async (req, res) => {
  const r = await one('select * from premium_requests where id = $1', [req.params.id]);
  if (!r || r.discordId !== req.user.discordId) {
    return res.status(404).json({ ok: false, error: 'not_found' });
  }
  if (r.status === 'approved') {
    return res.json({ ok: true, status: 'approved', premium: true });
  }
  if (r.status !== 'pending') {
    return res.json({ ok: true, status: r.status });
  }
  if (new Date(r.expiresAt).getTime() < Date.now()) {
    await q(`update premium_requests set status='expired' where id=$1`, [r.id]);
    return res.json({ ok: true, status: 'expired' });
  }

  let hit;
  try {
    hit = await findPayment(
      r.currency,
      r.payAddress,
      Number(r.amountCrypto),
      Math.max(Number(r.amountCrypto) * 0.0025, 1e-8),
      new Date(r.createdAt).getTime()
    );
  } catch (e) {
    return res.json({ ok: true, status: 'pending', error: 'chain_unreachable' });
  }

  if (!hit) return res.json({ ok: true, status: 'pending' });

  const clash = await one(
    `select id from premium_requests where txid = $1 and id <> $2`,
    [hit.txid, r.id]
  );
  if (clash) return res.json({ ok: true, status: 'pending', error: 'tx_already_used' });

  await q(
    `update premium_requests
        set status='approved', txid=$2, paid_at=now(), reviewed_at=now(), reviewed_by='chain'
      where id=$1`,
    [r.id, hit.txid]
  );
  await grantPremium(r.discordId, r.durationDays, 'crypto:' + r.currency);

  res.json({ ok: true, status: 'approved', premium: true, txid: hit.txid });
});

router.post('/cancel/:id', requireAuth, async (req, res) => {
  await q(
    `update premium_requests set status='cancelled'
      where id=$1 and discord_id=$2 and status='pending'`,
    [req.params.id, req.user.discordId]
  );
  res.json({ ok: true });
});

export default router;
