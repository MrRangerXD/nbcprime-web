import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { connectDB, pool } from './db.js';
import { env } from './config/env.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = createApp();

async function boot() {
  await connectDB();

  const schema = await fs.readFile(path.join(here, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('[db] schema verified');

  app.listen(env.PORT, () => console.log('API on :' + env.PORT + ' [' + env.NODE_ENV + ']'));

  setInterval(async () => {
    try {
      await pool.query("delete from command_logs where created_at < now() - interval '90 days'");
      await pool.query("delete from audit_logs where created_at < now() - interval '180 days'");
      await pool.query('delete from cache where expires_at < now()');
    } catch (e) { console.error('[cleanup]', e.message); }
  }, 6 * 60 * 60 * 1000);
}

boot().catch((err) => {
  console.error('boot failed:', err);
  process.exit(1);
});

process.on('unhandledRejection', (r) => console.error('unhandledRejection', r));
