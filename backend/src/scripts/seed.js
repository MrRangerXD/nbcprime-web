import { pool, connectDB } from '../db.js';

async function main() {
  await connectDB();

  await pool.query('delete from posts');
  await pool.query(
    `insert into posts (type, title, slug, excerpt, content, published, published_at, author_name, tags)
     values
     ($1,$2,$3,$4,$5,true,now(),$6,$7),
     ($8,$9,$10,$11,$12,true,now(),$13,$14)`,
    [
      'news',
      'NBCPrime v14.1 is live',
      'nbcprime-v141-live',
      'Remote nuke execution, web dashboard, giveaway engine and a public leaderboard.',
      '## What is new\n\n- Web dashboard with Discord login\n- Remote nuke execution from the browser\n- Giveaway engine\n- Public leaderboards\n',
      'Zensei',
      ['release'],
      'blog',
      'How to nuke a server without getting rate limited',
      'avoid-rate-limits',
      'The exact semaphore and jitter pattern NBC uses to survive 5000 request raids.',
      '## The pattern\n\nUse a semaphore of 35 and a 0.1-0.2s jitter between requests.\n',
      'Zensei',
      ['guide', 'nuke'],
    ]
  );

  await pool.query(
    `insert into settings (key, value) values ('socials', $1)
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify({
      discord: 'https://discord.gg/nbc-prime-1256250708190036019',
      youtube: 'https://youtube.com/@zenseitech/videos',
      instagram: 'https://www.instagram.com/zenseibabe',
    })]
  );

  console.log('seeded');
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
