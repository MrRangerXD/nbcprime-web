import axios from 'axios';
import { one, q } from '../db.js';

export const ADDRESSES = {
  LTC: process.env.LTC_ADDRESS || 'ltc1qutvfdfkyypw5689vahyw8eu9ap2u37zphg8jss',
  SOL: process.env.SOL_ADDRESS || 'ALv2HUKLvYfp2FY5EwTsG8TynavHk64KCx5fKuGgh1XB',
};

const DECIMALS = { LTC: 8, SOL: 6 };
const SOL_RPC = process.env.SOL_RPC_URL || 'https://api.mainnet-beta.solana.com';
const SOL_TX_SCAN_LIMIT = 10;

// FIX: CoinGecko 429/500 -> rate_unavailable -> premium band. Ab 3 layer fallback hai.
const HARD_FALLBACK = { LTC: 90, SOL: 150 };
const RATE_TTL = 5 * 60_000;
const RATE_CACHE_KEY = 'crypto_rates';

const round = (n, d) => Number(n.toFixed(d));

let priceCache = { at: 0, data: null };

async function saveRates(r) {
  try {
    await q(
      `insert into cache (key, value, expires_at)
       values ($1, $2, now() + interval '7 days')
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

  try {
    const { data } = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=litecoin,solana&vs_currencies=usd',
      { timeout: 8000 }
    );
    const fresh = { LTC: Number(data?.litecoin?.usd), SOL: Number(data?.solana?.usd) };
    if (fresh.LTC > 0 && fresh.SOL > 0) {
      priceCache = { at: Date.now(), data: fresh };
      saveRates(fresh).catch(() => {});
      return fresh;
    }
  } catch { /* neeche fallback */ }

  const persisted = await loadRates();
  const fallback = persisted || priceCache.data || HARD_FALLBACK;

  // 1 min baad dobara try karo, 5 min tak stale na rakho
  priceCache = { at: Date.now() - RATE_TTL + 60_000, data: fallback };
  console.warn('[crypto] using fallback rates', fallback);
  return fallback;
}

export async function quote(currency, usd) {
  const r = await rates();
  const rate = r[currency];
  if (!rate) throw new Error('no_rate');

  const base = usd / rate;
  const amount = round(base * (1 + 0.005 + Math.random() * 0.025), DECIMALS[currency]);
  const tolerance = Math.max(amount * 0.0025, 10 ** -DECIMALS[currency]);
  return { rate, amount, tolerance };
}

export function paymentUri(currency, address, amount) {
  return currency === 'LTC'
    ? `litecoin:${address}?amount=${amount}`
    : `solana:${address}?amount=${amount}`;
}

async function solRpc(method, params) {
  const { data } = await axios.post(
    SOL_RPC,
    { jsonrpc: '2.0', id: 1, method, params },
    { timeout: 12000 }
  );
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

async function findLtc(address, amount, tolerance, sinceMs) {
  const { data } = await axios.get(
    `https://api.blockcypher.com/v1/ltc/main/addrs/${address}/full?limit=25`,
    { timeout: 12000, validateStatus: (s) => s < 500 }
  );
  if (!data || data.error) return null;

  for (const tx of data.txs || []) {
    const at = new Date(tx.received).getTime();
    if (at < sinceMs - 60_000) continue;
    for (const out of tx.outputs || []) {
      if (!(out.addresses || []).includes(address)) continue;
      const value = out.value / 1e8;
      if (Math.abs(value - amount) <= tolerance) return { txid: tx.hash, value, at };
    }
  }
  return null;
}

async function findSol(address, amount, tolerance, sinceMs) {
  const sigs = await solRpc('getSignaturesForAddress', [address, { limit: SOL_TX_SCAN_LIMIT }]);

  for (const s of sigs || []) {
    const at = (s.blockTime || 0) * 1000;
    if (at && at < sinceMs - 60_000) continue;

    let tx;
    try {
      tx = await solRpc('getTransaction', [
        s.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 },
      ]);
    } catch { continue; }

    if (!tx?.meta) continue;

    const keys = tx.transaction.message.accountKeys.map((k) =>
      typeof k === 'string' ? k : k.pubkey
    );
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
