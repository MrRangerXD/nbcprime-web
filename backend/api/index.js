import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../src/app.js';
import { connectDB, pool } from '../src/db.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = createApp();

let ready = null;
let lastCleanup = Date.now(); // FIX: cold start pe turant 3 DELETE na maaro

async function boot() {
  await connectDB();
  const schema = await fs.readFile(path.join(here, '..', 'src', 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('[db] schema verified');
}

function ensureReady() {
  if (!ready) {
    ready = boot().catch((err) => {
      ready = null; // let the next request retry instead of staying poisoned
      console.error('[boot] failed:', err.message);
      throw err;
    });
  }
  return ready;
}

// server.js used setInterval(), which doesn't fire on Vercel — run it opportunistically
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
  try {
    await ensureReady();
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'boot_failed', detail: err.message });
  }
  maybeCleanup().catch(() => {}); // await na karo
  return app(req, res);
}
