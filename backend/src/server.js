import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { connectDB, pool } from './db.js';
import { env } from './config/env.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = createApp();

async function applySql() {
  // schema.sql SABSE PEHLE, warna hardening fail hogi
  const files = (await fs.readdir(here)).filter((f) => f.endsWith('.sql'));
  files.sort((a, b) => {
    if (a === 'schema.sql') return -1;
    if (b === 'schema.sql') return 1;
    return a.localeCompare(b);
  });

  for (const file of files) {
    await pool.query(await fs.readFile(path.join(here, file), 'utf8'));
    console.log('[db] applied', file);
  }
}

async function boot() {
  await connectDB();
  await applySql();

  const server = app.listen(env.PORT, () => console.log('API on :' + env.PORT + ' [' + env.NODE_ENV + ']'));

  setInterval(async () => {
    try {
      await pool.query("delete from command_logs where created_at < now() - interval '90 days'");
      await pool.query("delete from audit_logs where created_at < now() - interval '180 days'");
      await pool.query('delete from cache where expires_at < now()');
    } catch (e) { console.error('[cleanup]', e.message); }
  }, 6 * 60 * 60 * 1000);

  const shutdown = async (sig) => {
    console.log('[shutdown]', sig);
    server.close(async () => {
      await pool.end().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 8000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

boot().catch((err) => {
  console.error('boot failed:', err);
  process.exit(1);
});

process.on('unhandledRejection', (r) => console.error('unhandledRejection', r));
