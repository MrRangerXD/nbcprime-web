import pg from 'pg';
import { env } from './config/env.js';

const { Pool } = pg;

const poolConfig = {
  max: env.DB_POOL_MAX || 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  query_timeout: env.DB_QUERY_TIMEOUT || 20000,
  allowExitOnIdle: true,
};

// FIX: connectionString undefined hone pe bhi crash na ho
if (env.DATABASE_URL) poolConfig.connectionString = env.DATABASE_URL;
if (env.DB_SSL) poolConfig.ssl = { rejectUnauthorized: false };
if (env.DB_STATEMENT_TIMEOUT > 0) poolConfig.statement_timeout = env.DB_STATEMENT_TIMEOUT;

export const pool = new Pool(poolConfig);

pool.on('error', (err) => console.error('[pg] idle client error:', err.message));

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

export async function q(text, params = []) { return pool.query(text, params); }

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
