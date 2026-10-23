import 'dotenv/config';
import { z } from 'zod';

// z.coerce.boolean() is broken: Boolean("false") === true
const boolFromEnv = (def = false) =>
  z
    .string()
    .default(String(def))
    .transform((v) => ['true', '1', 'yes', 'on'].includes(v.trim().toLowerCase()));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL required'),
  DB_SSL: boolFromEnv(true),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be >= 16 chars'),
  JWT_EXPIRES: z.string().default('7d'),
  COOKIE_DOMAIN: z.string().default(''),
  COOKIE_SECURE: boolFromEnv(true),
  FRONTEND_URL: z.string().url(),
  DISCORD_CLIENT_ID: z.string().min(17),
  DISCORD_CLIENT_SECRET: z.string().min(10),
  DISCORD_REDIRECT_URI: z.string().url(),
  BOT_API_URL: z.string().url(),
  BOT_API_KEY: z.string().min(8),
  INGEST_KEY: z.string().min(8),
  OWNER_DISCORD_ID: z.string().min(17),
  ADMIN_DISCORD_IDS: z.string().default(''),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = Object.entries(parsed.error.flatten().fieldErrors)
    .map(([k, v]) => `${k}: ${v.join('; ')}`)
    .join(' | ');
  // throw instead of process.exit(1) so Vercel actually logs the reason
  throw new Error('Invalid environment -> ' + details);
}

export const env = parsed.data;
export const adminIds = env.ADMIN_DISCORD_IDS.split(',').map((s) => s.trim()).filter(Boolean);
export const isOwner = (id) => String(id) === env.OWNER_DISCORD_ID;
