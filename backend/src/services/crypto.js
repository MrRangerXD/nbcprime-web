import axios from 'axios';

export const ADDRESSES = {
  LTC: process.env.LTC_ADDRESS || 'ltc1qutvfdfkyypw5689vahyw8eu9ap2u37zphg8jss',
  SOL: process.env.SOL_ADDRESS || 'ALv2HUKLvYfp2FY5EwTsG8TynavHk64KCx5fKuGgh1XB',
};

const DECIMALS = { LTC: 8, SOL: 6 };
const SOL_RPC = process.env.SOL_RPC_URL || 'https://api.mainnet-beta.solana.com';

const round = (n, d) => Number(n.toFixed(d));

let priceCache = { at: 0, data: null };

export async function rates() {
  if (priceCache.data && Date.now() - priceCache.at < 60_000) return priceCache.data;
  const { data } = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price?ids=litecoin,solana&vs_currencies=usd',
    { timeout: 8000 }
  );
  priceCache = {
    at: Date.now(),
    data: { LTC: Number(data.litecoin.usd), SOL: Number(data.solana.usd) },
  };
  return priceCache.data;
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
    { timeout: 12000 }
  );
  for (const tx of data.txs || []) {
    const at = new Date(tx.received).getTime();
    if (at < sinceMs - 60_000) continue;
    for (const out of tx.outputs || []) {
      if (!(out.addresses || []).includes(address)) continue;
      const value = out.value / 1e8;
      if (Math.abs(value - amount) <= tolerance) {
        return { txid: tx.hash, value, at };
      }
    }
  }
  return null;
}

async function findSol(address, amount, tolerance, sinceMs) {
  const sigs = await solRpc('getSignaturesForAddress', [address, { limit: 25 }]);
  for (const s of sigs || []) {
    const at = (s.blockTime || 0) * 1000;
    if (at && at < sinceMs - 60_000) continue;
    const tx = await solRpc('getTransaction', [
      s.signature,
      { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 },
    ]);
    if (!tx?.meta) continue;
    const keys = tx.transaction.message.accountKeys.map((k) =>
      typeof k === 'string' ? k : k.pubkey
    );
    const idx = keys.indexOf(address);
    if (idx < 0) continue;
    const value = (tx.meta.postBalances[idx] - tx.meta.preBalances[idx]) / 1e9;
    if (Math.abs(value - amount) <= tolerance) {
      return { txid: s.signature, value, at };
    }
  }
  return null;
}

export async function findPayment(currency, address, amount, tolerance, sinceMs) {
  if (currency === 'LTC') return findLtc(address, amount, tolerance, sinceMs);
  if (currency === 'SOL') return findSol(address, amount, tolerance, sinceMs);
  return null;
}
