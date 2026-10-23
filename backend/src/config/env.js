import 'dotenv/config';
import { z } from 'zod';

const boolFromEnv = (def = false) =>
  z.string().default(String(def))
    .transform((v) => ['true', '1', 'yes', 'on'].includes(v.trim().toLowerCase()));

// FIX: empty string ("") pe NaN/0 nahi, default
const intFromEnv = (def) =>
  z.string().optional().transform((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
  });

// FIX: trailing slash hatao
const urlNoSlash = () => z.string().url().transform((v) => v.replace(/\/+$/, ''));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL required'),
  DB_SSL: boolFromEnv(true),
  DB_POOL_MAX: intFromEnv(8),
  // 0 = off. Server startup param hai, isliye default off rakha.
  DB_STATEMENT_TIMEOUT: intFromEnv(0),
  DB_QUERY_TIMEOUT: intFromEnv(20000),   // client-side, connection nahi todta

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be >= 16 chars'),
  JWT_EXPIRES: z.string().default('7d'),
  COOKIE_DOMAIN: z.string().default(''),
  COOKIE_SECURE: boolFromEnv(true),

  FRONTEND_URL: urlNoSlash(),
  DISCORD_CLIENT_ID: z.string().min(17),
  DISCORD_CLIENT_SECRET: z.string().min(10),
  DISCORD_REDIRECT_URI: urlNoSlash(),

  BOT_API_URL: urlNoSlash(),
  BOT_API_KEY: z.string().min(8),
  INGEST_KEY: z.string().min(8),

  OWNER_DISCORD_ID: z.string().min(17),
  ADMIN_DISCORD_IDS: z.string().default(''),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = Object.entries(parsed.error.flatten().fieldErrors)
    .map(([k, v]) => `${k}: ${v.join('; ')}`).join(' | ');
  throw new Error('Invalid environment -> ' + details);
}

export const env = parsed.data;
export const adminIds = env.ADMIN_DISCORD_IDS.split(',').map((s) => s.trim()).filter(Boolean);
export const isOwner = (id) => String(id) === env.OWNER_DISCORD_ID;
