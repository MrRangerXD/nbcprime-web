import { q } from '../db.js';

export async function grantPremium(discordId, days, source, client = null) {
  const run = client ? (text, params) => client.query(text, params) : q;

  await run(
    `update users
        set is_premium = true,
            premium_source = case when $2::int is null then 'lifetime' else $3 end,
            premium_until = case
              when $2::int is null then null
              when premium_until is null and premium_source = 'lifetime' then null
              else greatest(coalesce(premium_until, now()), now()) + ($2::int * interval '1 day')
            end,
            updated_at = now()
      where discord_id = $1`,
    [discordId, days, source]
  );
}
