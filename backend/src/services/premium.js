import { q } from '../db.js';

export async function grantPremium(discordId, days, source) {
  await q(
    `update users
        set is_premium = true,
            premium_source = $3,
            premium_until = case
              when $2::int is null then null
              when premium_until is null and is_premium then null
              else greatest(coalesce(premium_until, now()), now()) + ($2::int * interval '1 day')
            end,
            updated_at = now()
      where discord_id = $1`,
    [discordId, days, source]
  );
}
