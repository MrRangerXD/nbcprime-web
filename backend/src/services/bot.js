import { env } from '../config/env.js';

const BASE = (env.BOT_API_URL || '').replace(/\/+$/, '');
const TIMEOUT_MS = 20000;

// Vercel pe 127.0.0.1 = lambda khud, bot VPS nahi
if (/127\.0\.0\.1|localhost/.test(BASE)) {
  console.warn('[bot] BOT_API_URL localhost pe hai — Vercel pe VPS IP:PORT set karo');
}

export const BotDown = (e) =>
  e?.name === 'AbortError' ||
  [
    'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED',
    'ENOTFOUND', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_SOCKET',
  ].includes(e?.code) ||
  (typeof e?.message === 'string' && /^bot_5\d\d$|fetch failed|socket hang up/i.test(e.message));

// NOTE: ye PARSED BODY return karta hai, axios-jaisa { data } wrapper NAHI.
// Bot already {"ok":true,"data":...} bhejta hai, isliye caller .data karta hai.
async function call(method, path, { body, params } = {}) {
  if (!BASE) throw new Error('bot_api_not_configured');

  const url = new URL(BASE + (path.startsWith('/') ? path : '/' + path));
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(url, {
      method,
      signal: ctrl.signal,
      headers: {
        'X-API-Key': env.BOT_API_KEY,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e.name === 'AbortError') {
      const t = new Error('bot_timeout');
      t.code = 'ETIMEDOUT';
      throw t;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

  if (!res.ok) {
    const err = new Error('bot_' + res.status);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const botGet = (path, params) => call('GET', path, { params });
export const botPost = (path, body) => call('POST', path, { body });
export const botDelete = (path, body) => call('DELETE', path, { body });
