import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, connectDB } from '../db.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(here, '..');

async function main() {
  await connectDB();

  // schema.sql SABSE PEHLE, warna hardening file fail hogi
  const files = (await fs.readdir(srcDir)).filter((f) => f.endsWith('.sql'));
  files.sort((a, b) => {
    if (a === 'schema.sql') return -1;
    if (b === 'schema.sql') return 1;
    return a.localeCompare(b);
  });

  for (const file of files) {
    const sql = await fs.readFile(path.join(srcDir, file), 'utf8');
    await pool.query(sql);
    console.log('applied', file);
  }

  console.log('schema applied');
  await pool.end();
}

main().catch((e) => {
  console.error('migration failed:', e.message);
  process.exit(1);
});
