import axios from 'axios';
import { one, q } from '../db.js';
import { env } from '../config/env.js';

export const ADDRESSES = { LTC: env.LTC_ADDRESS, SOL: env.SOL_ADDRESS };

const DECIMALS = { LTC: 8, SOL: 6 };
const SOL_RPC = env.SOL_RPC_URL;

const HARD_FALLBACK = { LTC: 90, SOL: 150 };
const RATE_TTL = 5 * 60_000;
const RATE_CACHE_KEY = 'crypto_rates';

const round = (n, d) => Number(n.toFixed(d));
let priceCache = { at: 0, data: null };

async function saveRates(r) {
  try {
    await q(
      `insert into cache (key, value, expires_at) values ($1,$2, now() + interval '7 days')
       on conflict (key) do update set value = excluded.value, expires_at = excluded.expires_at`,
      [RATE_CACHE_KEY, JSON.stringify(r)]
    );
  } catch { /* ignore */ }
}

async function loadRates() {
  try {
    const row = await one('select value from cache where key = $1 and expires_at > now()', [RATE_CACHE_KEY]);
    if (!row) return null;
    const v = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
    if (v?.LTC > 0 && v?.SOL > 0) return v;
  } catch { /* ignore */ }
  return null;
}

export async function rates() {
  if (priceCache.data && Date.now() - priceCache.at < RATE_TTL) return priceCache.data;

  const sources = [
    ['https://api.binance.com/api/v3/ticker/price?symbol=LTCUSDT', (d) => ({ LTC: Number(d.price) })],
    ['https://api.coingecko.com/api/v3/simple/price?ids=litecoin,solana&vs_currencies=usd',
      (d) => ({ LTC: Number(d?.litecoin?.usd), SOL: Number(d?.solana?.usd) })],
  ];

  for (const [url, parse] of sources) {
    try {
      const { data } = await axios.get(url, { timeout: 8000 });
      const fresh = parse(data);
      if (fresh.LTC > 0) {
        if (!fresh.SOL || fresh.SOL <= 0) {
          const persisted = await loadRates();
          fresh.SOL = persisted?.SOL || HARD_FALLBACK.SOL;
        }
        priceCache = { at: Date.now(), data: fresh };
        saveRates(fresh).catch(() => {});
        return fresh;
      }
    } catch { /* next source */ }
  }

  const fallback = (await loadRates()) || priceCache.data || HARD_FALLBACK;
  priceCache = { at: Date.now() - RATE_TTL + 60_000, data: fallback };
  console.warn('[crypto] using fallback rates', fallback);
  return fallback;
}

export async function quote(currency, usd) {
  const r = await rates();
  const rate = r[currency];
  if (!rate) throw new Error('no_rate');
  const amount = round(usd / rate, DECIMALS[currency]);
  const tolerance = Math.max(amount * 0.01, 10 ** -DECIMALS[currency]);
  return { rate, amount, tolerance };
}

export function paymentUri(currency, address, amount) {
  return currency === 'LTC'
    ? `litecoin:${address}?amount=${amount}`
    : `solana:${address}?amount=${amount}`;
}

// ---------- LTC ----------
async function ltcViaBlockcypher(address) {
  const { data } = await axios.get(
    `https://api.blockcypher.com/v1/ltc/main/addrs/${address}/full?limit=50`,
    { timeout: 12000, validateStatus: (s) => s < 500 }
  );
  if (!data || data.error) return [];
  const out = [];
  for (const tx of data.txs || []) {
    for (const o of tx.outputs || []) {
      if (!(o.addresses || []).includes(address)) continue;
      out.push({ txid: tx.hash, value: o.value / 1e8, at: new Date(tx.received).getTime(), conf: tx.confirmations || 0 });
    }
  }
  return out;
}

// FIX: BlockCypher down/rate-limited ho to Esplora fallback
async function ltcViaEsplora(address) {
  const base = 'https://litecoinspace.org/api';
  const { data: txs } = await axios.get(`${base}/address/${address}/txs`, { timeout: 12000 });
  const { data: tipRaw } = await axios.get(`${base}/blocks/tip/height`, { timeout: 8000 });
  const tip = Number(tipRaw);
  const out = [];
  for (const tx of txs || []) {
    let sats = 0;
    for (const v of tx.vout || []) if (v.scriptpubkey_address === address) sats += v.value;
    if (!sats) continue;
    const st = tx.status || {};
    const conf = st.confirmed && st.block_height ? Math.max(0, tip - st.block_height + 1) : 0;
    out.push({ txid: tx.txid, value: sats / 1e8, at: (st.block_time || 0) * 1000 || Date.now(), conf });
  }
  return out;
}

async function findLtc(address, amount, tolerance, sinceMs) {
  let hits = [];
  try { hits = await ltcViaBlockcypher(address); } catch { /* fallback */ }
  if (!hits.length) { try { hits = await ltcViaEsplora(address); } catch { /* give up */ } }

  const match = hits
    .filter((h) => Math.abs(h.value - amount) <= tolerance && h.at >= sinceMs - 120_000)
    .sort((a, b) => b.at - a.at)[0];

  return match ? { txid: match.txid, value: match.value, at: match.at } : null;
}

// ---------- SOL ----------
async function solRpc(method, params) {
  const { data } = await axios.post(SOL_RPC, { jsonrpc: '2.0', id: 1, method, params }, { timeout: 12000 });
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

async function findSol(address, amount, tolerance, sinceMs) {
  const sigs = await solRpc('getSignaturesForAddress', [address, { limit: 25 }]);

  for (const s of sigs || []) {
    const at = (s.blockTime || 0) * 1000;
    if (at && at < sinceMs - 120_000) continue;

    let tx;
    try {
      tx = await solRpc('getTransaction', [s.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]);
    } catch { continue; }
    if (!tx?.meta) continue;

    const keys = tx.transaction.message.accountKeys.map((k) => (typeof k === 'string' ? k : k.pubkey));
    const idx = keys.indexOf(address);
    if (idx < 0) continue;

    const value = (tx.meta.postBalances[idx] - tx.meta.preBalances[idx]) / 1e9;
    if (Math.abs(value - amount) <= tolerance) return { txid: s.signature, value, at };
  }
  return null;
}

export async function findPayment(currency, address, amount, tolerance, sinceMs) {
  if (currency === 'LTC') return findLtc(address, amount, tolerance, sinceMs);
  if (currency === 'SOL') return findSol(address, amount, tolerance, sinceMs);
  return null;
}
