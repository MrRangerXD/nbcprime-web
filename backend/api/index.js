import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../src/app.js';
import { connectDB, pool } from '../src/db.js';
import { env, envReport } from '../src/config/env.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = createApp();

let ready = null;
let bootError = null;
let lastCleanup = Date.now();

async function boot() {
  try {
    await connectDB();
  } catch (e) {
    bootError = 'db_connect: ' + e.message;
    console.error('[boot]', bootError);
    return; // health chalta rahega
  }

  try {
    const dir = path.join(here, '..', 'src');
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.sql'));
    files.sort((a, b) => (a === 'schema.sql' ? -1 : b === 'schema.sql' ? 1 : a.localeCompare(b)));
    for (const f of files) {
      try { await pool.query(await fs.readFile(path.join(dir, f), 'utf8')); }
      catch (e) { bootError = 'sql:' + f + ' ' + e.message; console.error('[boot]', bootError); }
    }
    console.log('[db] schema verified');
  } catch (e) {
    bootError = 'schema_read: ' + e.message;
  }
}

function ensureReady() {
  if (!ready) {
    ready = boot().catch((err) => { bootError = 'boot: ' + err.message; });
  }
  return ready;
}

async function maybeCleanup() {
  if (Date.now() - lastCleanup < 6 * 60 * 60 * 1000) return;
  lastCleanup = Date.now();
  try {
    await pool.query("delete from command_logs where created_at < now() - interval '90 days'");
    await pool.query("delete from audit_logs where created_at < now() - interval '180 days'");
    await pool.query('delete from cache where expires_at < now()');
  } catch (e) { console.error('[cleanup]', e.message); }
}

export default async function handler(req, res) {
  // Vercel rewrite -> /api/index  ko normalise karo
  if (req.url.startsWith('/api/index')) req.url = req.url.slice('/api/index'.length) || '/';

  const pathname = (req.url || '/').split('?')[0];

  // health + diag kabhi DB pe depend na karein
  if (pathname === '/api/health') {
    return res.json({ ok: true, ts: Date.now(), db: !bootError, boot: bootError || null });
  }

  if (pathname === '/api/diag') {
    return res.json({
      ok: true,
      ts: Date.now(),
      bootError,
      env: envReport,
      hasDatabaseUrl: Boolean(env.DATABASE_URL),
    });
  }

  try {
    await ensureReady();
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'boot_failed', detail: String(err?.message || err) });
  }

  maybeCleanup().catch(() => {});

  try {
    return await app(req, res);
  } catch (err) {
    console.error('[handler]', err);
    if (!res.headersSent) {
      return res.status(500).json({ ok: false, error: 'internal_error', detail: String(err?.message || err) });
    }
  }
}

process.on('unhandledRejection', (r) => console.error('[unhandledRejection]', r));
