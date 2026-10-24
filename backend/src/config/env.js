import 'dotenv/config';
import { z } from 'zod';

const boolFromEnv = (def = false) =>
  z.string().optional()
    .transform((v) => (v == null ? def : ['true', '1', 'yes', 'on'].includes(v.trim().toLowerCase())))
    .catch(def);

const intFromEnv = (def) =>
  z.string().optional().transform((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
  }).catch(def);

const strOr = (fallback) =>
  z.string().optional().transform((v) => (v && v.trim() ? v.trim() : fallback)).catch(fallback);

const urlOr = (fallback) =>
  z.string().optional()
    .transform((v) => (v && v.trim() ? v.trim().replace(/\/+$/, '') : fallback))
    .catch(fallback);

const DEFAULT_JWT = 'change-me-in-vercel-32-chars';

const schema = z.object({
  NODE_ENV: strOr('production'),
  PORT: z.coerce.number().catch(4000),

  DATABASE_URL: strOr(''),
  DB_SSL: boolFromEnv(true),
  DB_POOL_MAX: intFromEnv(5),
  DB_STATEMENT_TIMEOUT: intFromEnv(0),
  DB_QUERY_TIMEOUT: intFromEnv(20000),

  JWT_SECRET: strOr(DEFAULT_JWT),
  JWT_EXPIRES: strOr('7d'),

  COOKIE_DOMAIN: strOr(''),
  COOKIE_SECURE: boolFromEnv(true),

  FRONTEND_URL: urlOr('https://nbcprime.vercel.app'),
  DISCORD_CLIENT_ID: strOr(''),
  DISCORD_CLIENT_SECRET: strOr(''),
  DISCORD_REDIRECT_URI: urlOr('https://api-nbcprime.vercel.app/api/auth/discord/callback'),

  BOT_API_URL: urlOr('http://127.0.0.1:8080'),
  BOT_API_KEY: strOr(''),
  INGEST_KEY: strOr(''),
  CRON_SECRET: strOr(''),

  OWNER_DISCORD_ID: strOr('1213850390202810458'),
  ADMIN_DISCORD_IDS: strOr(''),

  LTC_ADDRESS: strOr('ltc1qutvfdfkyypw5689vahyw8eu9ap2u37zphg8jss'),
  SOL_ADDRESS: strOr('ALv2HUKLvYfp2FY5EwTsG8TynavHk64KCx5fKuGgh1XB'),
  SOL_RPC_URL: strOr('https://api.mainnet-beta.solana.com'),
});

const parsed = schema.safeParse(process.env);

// FIX: pehle yahan top-level throw tha -> poora lambda import pe mar jata tha
// FIX 2: parse fail hone par {} nahi, defaults ke saath safe object
const safe = parsed.success ? parsed.data : {};
export const env = {
  ...safe,
  JWT_SECRET: safe.JWT_SECRET || DEFAULT_JWT,
  NODE_ENV: safe.NODE_ENV || 'production',
};

if (!parsed.success) {
  console.error('[env] parse issue ->', JSON.stringify(parsed.error.flatten().fieldErrors));
}

// FIX: COOKIE_DOMAIN agar callback host se match na kare to browser cookie drop kar deta hai
// (api-nbcprime.vercel.app aur nbcprime.vercel.app siblings hain, parent-child nahi)
const cookieDomainProblem = (() => {
  const d = String(env.COOKIE_DOMAIN || '').trim().replace(/^\./, '');
  if (!d || d === 'localhost') return null;
  try {
    const host = new URL(env.DISCORD_REDIRECT_URI).hostname;
    if (host === d || host.endsWith('.' + d)) return null;
    return `COOKIE_DOMAIN="${env.COOKIE_DOMAIN}" callback host "${host}" se match nahi karta -> cookie reject hogi (khali rakho)`;
  } catch { return null; }
})();

const jwtIsDefault = env.JWT_SECRET === DEFAULT_JWT;

// kaunsa var missing hai, diag ke liye (secret leak nahi hota)
const REQUIRED = [
  'DATABASE_URL', 'JWT_SECRET', 'FRONTEND_URL',
  'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_REDIRECT_URI',
  'BOT_API_URL', 'BOT_API_KEY', 'INGEST_KEY', 'OWNER_DISCORD_ID',
];

export const envReport = {
  ...Object.fromEntries(REQUIRED.map((k) => [k, Boolean(env[k])])),
  JWT_SECRET_len: String(env.JWT_SECRET || '').length,
  jwtIsDefault,
  cookieDomainProblem,
  hasCronSecret: Boolean(env.CRON_SECRET),
  NODE_ENV: env.NODE_ENV,
  node: process.version,
  missing: REQUIRED.filter((k) => !env[k]),
  warnings: [
    env.DATABASE_URL ? null : 'DATABASE_URL missing',
    jwtIsDefault ? 'JWT_SECRET default pe hai (public string)' : null,
    env.BOT_API_KEY ? null : 'BOT_API_KEY missing',
    env.INGEST_KEY ? null : 'INGEST_KEY missing',
    cookieDomainProblem,
    /127\.0\.0\.1|localhost/.test(env.BOT_API_URL || '') ? 'BOT_API_URL localhost pe hai (Vercel pe VPS IP chahiye)' : null,
  ].filter(Boolean),
};

// prod me warnings loud karo
if (env.NODE_ENV === 'production' && envReport.warnings.length) {
  console.error('[env] WARN ->', envReport.warnings.join(' | '));
}

// FIX: JWT_SECRET default = tokens forgeable
if (env.NODE_ENV === 'production' && jwtIsDefault) {
  console.error('[env] JWT_SECRET is the PUBLIC default — tokens are forgeable. Set JWT_SECRET.');
}

export const adminIds = String(env.ADMIN_DISCORD_IDS || '')
  .split(',').map((s) => s.trim()).filter(Boolean);

export const isOwner = (id) => String(id) === String(env.OWNER_DISCORD_ID || '');
