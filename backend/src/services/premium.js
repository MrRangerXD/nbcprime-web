import { q } from '../db.js';

export async function grantPremium(discordId, days, source) {
  await q(
    `update users
        set is_premium = true,
            premium_until = case
              -- lifetime purchase -> clear the expiry
              when $2::int is null then null
              -- already lifetime (source flagged, no expiry) -> keep it lifetime
              when premium_until is null and premium_source = 'lifetime' then null
              else greatest(coalesce(premium_until, now()), now()) + ($2::int * interval '1 day')
            end,
            premium_source = case when $2::int is null then 'lifetime' else $3 end,
            updated_at = now()
      where discord_id = $1`,
    [discordId, days, source]
  );
}
