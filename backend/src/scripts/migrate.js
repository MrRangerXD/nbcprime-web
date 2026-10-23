import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, connectDB } from '../db.js';

const here = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  await connectDB();
  const sql = await fs.readFile(path.join(here, '..', 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('schema applied');
  await pool.end();
}

main().catch((e) => {
  console.error('migration failed:', e.message);
  process.exit(1);
});
