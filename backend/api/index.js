import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

let app = null;
let pool = null;
let connectDB = null;
let env = {};
let envReport = {};
let ready = null;
let bootError = null;
let lastCleanup = Date.now();

async function loadEnv() {
  if (envReport && Object.keys(envReport).length) return;
  const m = await import('../src/config/env.js');
  env = m.env;
  envReport = m.envReport;
}

async function boot() {
  try {
    await loadEnv();
    const [appMod, dbMod] = await Promise.all([
      import('../src/app.js'),
      import('../src/db.js'),
    ]);
    app = appMod.createApp();
    pool = dbMod.pool;
    connectDB = dbMod.connectDB;
    await connectDB();
  } catch (e) {
    bootError = 'load/db: ' + (e?.message || e);
    console.error('[boot]', bootError, e?.stack || '');
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
    bootError = 'schema_read: ' + (e?.message || e);
  }
}

function ensureReady() {
  if (!ready) ready = boot();
  return ready;
}

async function maybeCleanup() {
  if (!pool) return;
  if (Date.now() - lastCleanup < 6 * 60 * 60 * 1000) return;
  lastCleanup = Date.now();
  try {
    await pool.query("delete from command_logs where created_at < now() - interval '90 days'");
    await pool.query("delete from audit_logs where created_at < now() - interval '180 days'");
    await pool.query('delete from cache where expires_at < now()');
  } catch (e) { console.error('[cleanup]', e.message); }
}

export default async function handler(req, res) {
  // Vercel rewrite -> /api/index  ko normalise karo (dono form match karo)
  const raw = (req.url || '/').split('?')[0];
  const pathname = raw.startsWith('/api/index')
    ? (raw.slice('/api/index'.length) || '/')
    : raw;

  // health + diag kabhi DB pe depend na karein
  if (raw === '/api/health' || pathname === '/api/health') {
    return res.json({ ok: true, ts: Date.now(), db: !bootError, boot: bootError || null });
  }

  if (raw === '/api/diag' || pathname === '/api/diag') {
    try {
      await loadEnv();
    } catch (e) {
      return res.status(500).json({ ok: false, error: 'env_import_failed', detail: e.message, stack: e.stack });
    }
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

  if (!app) {
    return res.status(500).json({ ok: false, error: 'app_not_loaded', detail: bootError });
  }

  maybeCleanup().catch(() => {});

  if (req.url.startsWith('/api/index')) req.url = req.url.slice('/api/index'.length) || '/';

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
