import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL required'),
  DB_SSL: z.coerce.boolean().default(true),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES: z.string().default('7d'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  FRONTEND_URL: z.string().url(),
  DISCORD_CLIENT_ID: z.string(),
  DISCORD_CLIENT_SECRET: z.string(),
  DISCORD_REDIRECT_URI: z.string().url(),
  BOT_API_URL: z.string().url(),
  BOT_API_KEY: z.string(),
  INGEST_KEY: z.string(),
  OWNER_DISCORD_ID: z.string(),
  ADMIN_DISCORD_IDS: z.string().default(''),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const adminIds = env.ADMIN_DISCORD_IDS.split(',').map((s) => s.trim()).filter(Boolean);
export const isOwner = (id) => String(id) === env.OWNER_DISCORD_ID;
