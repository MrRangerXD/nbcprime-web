import pg from 'pg';
import { env } from './config/env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,

  // FIX: query_timeout client-side hai — connection ko kabhi nahi todta
  query_timeout: env.DB_QUERY_TIMEOUT,

  // FIX: statement_timeout sirf tab jab explicitly on karo (Supavisor startup
  // parameter reject kare to 0 kar dena)
  ...(env.DB_STATEMENT_TIMEOUT > 0 ? { statement_timeout: env.DB_STATEMENT_TIMEOUT } : {}),

  allowExitOnIdle: true,
});

pool.on('error', (e) => console.error('[pg] idle client error:', e.message));

export async function connectDB() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('[db] postgres connected');
  } finally {
    client.release();
  }
}

const camel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

export function mapRow(row) {
  if (!row) return row;
  const out = {};
  for (const key of Object.keys(row)) {
    out[key] = row[key];
    out[camel(key)] = row[key];
  }
  if (out.id !== undefined) out._id = String(out.id);
  return out;
}

export async function q(text, params = []) {
  return pool.query(text, params);
}

export async function many(text, params = []) {
  const res = await pool.query(text, params);
  return res.rows.map(mapRow);
}

export async function one(text, params = []) {
  const res = await pool.query(text, params);
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

export async function scalar(text, params = []) {
  const res = await pool.query(text, params);
  if (!res.rows[0]) return null;
  return Object.values(res.rows[0])[0];
}
