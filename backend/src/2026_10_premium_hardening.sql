begin;

-- A2: ek txid sirf ek baar credit ho
create unique index if not exists premium_requests_txid_uniq
  on premium_requests (txid) where txid is not null;

-- A3 support: ek user ka ek hi live intent
create unique index if not exists premium_requests_one_pending
  on premium_requests (discord_id) where status = 'pending';

-- lookup paths
create index if not exists premium_requests_user_created
  on premium_requests (discord_id, created_at desc);
create index if not exists premium_requests_status_expires
  on premium_requests (status, expires_at);

-- status ka koi bhi random value na aa jaye
alter table premium_requests drop constraint if exists premium_requests_status_chk;
alter table premium_requests add constraint premium_requests_status_chk
  check (status in ('pending','approved','cancelled','expired'));

-- amount positive ho
alter table premium_requests drop constraint if exists premium_requests_amount_chk;
alter table premium_requests add constraint premium_requests_amount_chk
  check (amount_crypto > 0);

-- A5 fix: browser countdown timezone pe drift na kare
alter table premium_requests alter column created_at  type timestamptz;
alter table premium_requests alter column expires_at  type timestamptz;
alter table premium_requests alter column paid_at     type timestamptz;
alter table premium_requests alter column reviewed_at type timestamptz;
alter table users             alter column premium_until type timestamptz;

commit;
