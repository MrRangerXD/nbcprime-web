import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../src/app.js';
import { connectDB, pool } from '../src/db.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = createApp();

let ready = null;
let lastCleanup = Date.now();

async function boot() {
  await connectDB();
  const dir = path.join(here, '..', 'src');
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.sql'));
  files.sort((a, b) => (a === 'schema.sql' ? -1 : b === 'schema.sql' ? 1 : a.localeCompare(b)));
  for (const f of files) await pool.query(await fs.readFile(path.join(dir, f), 'utf8'));
  console.log('[db] schema verified');
}

function ensureReady() {
  if (!ready) {
    ready = boot().catch((err) => {
      ready = null;
      console.error('[boot] failed:', err.message);
      throw err;
    });
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
  } catch (e) {
    console.error('[cleanup]', e.message);
  }
}

export default async function handler(req, res) {
  // FIX: Vercel rewrite se aane wale /api/index ko normalise karo
  if (req.url.startsWith('/api/index')) req.url = req.url.slice('/api/index'.length) || '/';

  try {
    await ensureReady();
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'boot_failed', detail: err.message });
  }
  maybeCleanup().catch(() => {});
  return app(req, res);
}
