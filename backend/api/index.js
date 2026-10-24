import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

let app = null;
let pool = null;
let env = {};
let envReport = {};
let ready = null;
let bootError = null;
let schemaError = null;
let retryAfter = 0;
let lastCleanup = Date.now();
let lastSchemaRun = 0; // FIX: warm boot pe schema dobara na chale

const RETRY_MS = 15000;
const SCHEMA_TTL_MS = 60 * 60 * 1000;

// FIX: har step ka apna label -> error me exact file dikhegi, generic 'load/db' nahi
async function step(label, fn) {
  try {
    return await fn();
  } catch (e) {
    const err = new Error(e?.message || String(e));
    err.step = label;
    err.stack = e?.stack;
    throw err;
  }
}

async function loadEnv() {
  if (envReport && Object.keys(envReport).length) return;
  const m = await step('import:config/env.js', () => import('../src/config/env.js'));
  env = m.env;
  envReport = m.envReport;
}

async function boot() {
  bootError = null;

  try {
    await loadEnv();
    const [appMod, dbMod] = await Promise.all([
      step('import:app.js', () => import('../src/app.js')),
      step('import:db.js', () => import('../src/db.js')),
    ]);
    app = await step('createApp', async () => appMod.createApp());
    pool = dbMod.pool;
    await step('db:connect', () => dbMod.connectDB());
  } catch (e) {
    bootError = (e?.step ? e.step + ': ' : '') + (e?.message || e);
    retryAfter = Date.now() + RETRY_MS;
    console.error('[boot]', bootError);
    console.error('[boot:stack]', e?.stack || '');
    return; // health chalta rahega
  }

  // FIX: schema fail ho to bootError alag rakhna, warna DB connected hone par bhi db:false dikhta hai
  try {
    // FIX: warm invocation pe har baar saari .sql files dobara na chalao
    if (schemaError === null && lastSchemaRun && Date.now() - lastSchemaRun < SCHEMA_TTL_MS) return;
    lastSchemaRun = Date.now();

    const dir = path.join(here, '..', 'src');
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.sql'));
    files.sort((a, b) => (a === 'schema.sql' ? -1 : b === 'schema.sql' ? 1 : a.localeCompare(b)));
    const errs = [];
    for (const f of files) {
      try {
        await pool.query(await fs.readFile(path.join(dir, f), 'utf8'));
      } catch (e) {
        errs.push(f + ': ' + e.message);
        console.error('[boot:schema]', f, e.message);
      }
    }
    schemaError = errs.length ? errs.join(' | ') : null;
    if (!schemaError) console.log('[db] schema verified');
  } catch (e) {
    schemaError = 'schema_read: ' + (e?.message || e);
    console.error('[boot]', schemaError);
  }
}

// FIX: fail hone par 15s baad dobara try kare, warna ek cold start me permanently dead
function ensureReady() {
  if (app) return Promise.resolve();
  if (bootError && Date.now() < retryAfter) return Promise.resolve();
  if (!ready) {
    ready = boot().finally(() => {
      ready = null;
    });
  }
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
    await pool.query('delete from oauth_states where expires_at < now()');
  } catch (e) {
    console.error('[cleanup]', e.message);
  }
}

// Vercel rewrite -> /api/index ko normalise karo (ek hi baar)
function normalise(req) {
  const url = req.url || '/';
  if (url.startsWith('/api/index')) {
    req.url = url.slice('/api/index'.length) || '/';
  }
  return (req.url || '/').split('?')[0];
}

export default async function handler(req, res) {
  const fullUrl = req.url || '/';
  const pathname = normalise(req);
  const deep = fullUrl.includes('deep=1');

  // health + diag kabhi DB pe depend na karein
  if (pathname === '/api/health') {
    let dbOk = Boolean(pool) && !bootError;
    if (deep && dbOk) {
      try {
        await pool.query('select 1');
      } catch (e) {
        dbOk = false;
        console.error('[health] ping failed:', e.message);
      }
    }
    const ok = !bootError && dbOk;
    return res.status(ok ? 200 : 503).json({
      ok,
      ts: Date.now(),
      db: dbOk,
      boot: bootError,
      schema: schemaError,
    });
  }

  if (pathname === '/api/diag') {
    try {
      await loadEnv();
    } catch (e) {
      return res.status(500).json({
        ok: false,
        error: 'env_import_failed',
        detail: e.message,
        stack: e.stack,
      });
    }

    // FIX: diag public tha -> CRON_SECRET set ho to gate karo
    // header: X-Cron-Secret  |  ya query: /api/diag?key=...
    const secret = env.CRON_SECRET;
    if (secret) {
      let qkey = null;
      try { qkey = new URL(req.url || '/', 'http://x').searchParams.get('key'); } catch {}
      if (req.headers['x-cron-secret'] !== secret && qkey !== secret) {
        return res.status(403).json({ ok: false, error: 'forbidden' });
      }
    }

    return res.json({
      ok: !bootError,
      ts: Date.now(),
      bootError,
      schemaError,
      appLoaded: Boolean(app),
      poolReady: Boolean(pool),
      retryIn: bootError ? Math.max(0, retryAfter - Date.now()) : 0,
      env: envReport,
      hasDatabaseUrl: Boolean(env.DATABASE_URL),
    });
  }

  try {
    await ensureReady();
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'boot_failed',
      detail: String(err?.message || err),
    });
  }

  if (!app) {
    return res.status(503).json({ ok: false, error: 'app_not_loaded', detail: bootError });
  }

  maybeCleanup().catch(() => {});

  try {
    return await app(req, res);
  } catch (err) {
    console.error('[handler]', err);
    if (!res.headersSent) {
      return res.status(500).json({
        ok: false,
        error: 'internal_error',
        detail: String(err?.message || err),
      });
    }
  }
}

process.on('unhandledRejection', (r) => console.error('[unhandledRejection]', r));
