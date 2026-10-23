import { env } from '../config/env.js';

export async function botGet(path, params = {}) {
  if (!env.BOT_API_URL) throw new Error('bot_api_not_configured');

  const url = new URL(env.BOT_API_URL.replace(/\/$/, '') + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);

  try {
    const r = await fetch(url, { headers: { 'X-API-Key': env.BOT_API_KEY }, signal: ctrl.signal });
    if (!r.ok) throw new Error(`bot_${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

export const botPost = async (path, body = {}) => { /* same shape, POST */ };
