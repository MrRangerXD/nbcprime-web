create table if not exists users (
  discord_id       text primary key,
  username         text,
  global_name      text,
  avatar           text,
  banner           text,
  email            text,
  access_token     text,
  refresh_token    text,
  token_expires_at timestamptz,
  is_premium       boolean default false,
  premium_source   text,
  premium_until    timestamptz,
  is_admin         boolean default false,
  is_banned        boolean default false,
  blacklist_reason text,
  total_commands   integer default 0,
  admin_guilds     text[]  default '{}',
  last_login_at    timestamptz,
  login_count      integer default 0,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index if not exists users_total_commands_idx on users (total_commands desc);

-- purani table ke liye
alter table users add column if not exists premium_until timestamptz;

create table if not exists guilds (
  guild_id            text primary key,
  name                text,
  icon                text,
  owner_id            text,
  member_count        integer default 0,
  channel_count       integer default 0,
  role_count          integer default 0,
  boost_level         integer default 0,
  boost_count         integer default 0,
  bot_present         boolean default true,
  is_whitelisted      boolean default false,
  command_count       integer default 0,
  joined_at           timestamptz default now(),
  left_at             timestamptz,
  discord_created_at  timestamptz,
  updated_at          timestamptz default now()
);
create index if not exists guilds_member_count_idx on guilds (member_count desc);
create index if not exists guilds_command_count_idx on guilds (command_count desc);
create index if not exists guilds_bot_present_idx on guilds (bot_present);

create table if not exists command_logs (
  id         bigserial primary key,
  user_id    text,
  username   text,
  guild_id   text,
  guild_name text,
  command    text,
  created_at timestamptz default now()
);
create index if not exists command_logs_user_idx on command_logs (user_id);
create index if not exists command_logs_created_idx on command_logs (created_at desc);
create index if not exists command_logs_command_idx on command_logs (command);

create table if not exists giveaways (
  id            uuid primary key default gen_random_uuid(),
  message_id    text,
  guild_id      text,
  guild_name    text,
  channel_id    text,
  prize         text,
  winners_count integer default 1,
  winner_ids    text[] default '{}',
  host_id       text,
  host_name     text,
  ends_at       timestamptz,
  ended_at      timestamptz,
  status        text default 'active',
  created_at    timestamptz default now()
);
create index if not exists giveaways_status_idx on giveaways (status);
create index if not exists giveaways_guild_idx on giveaways (guild_id);

create table if not exists posts (
  id           uuid primary key default gen_random_uuid(),
  type         text not null,
  title        text not null,
  slug         text unique not null,
  excerpt      text,
  content      text,
  cover_image  text,
  tags         text[] default '{}',
  author_id    text,
  author_name  text,
  published    boolean default false,
  published_at timestamptz,
  views        integer default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists posts_published_idx on posts (published, published_at desc);

create table if not exists action_logs (
  id                bigserial primary key,
  job_id            text,
  action            text,
  guild_id          text,
  guild_name        text,
  requested_by      text,
  requested_by_name text,
  status            text default 'queued',
  result            jsonb,
  error             text,
  started_at        timestamptz,
  finished_at       timestamptz,
  created_at        timestamptz default now()
);
create index if not exists action_logs_job_idx on action_logs (job_id);
create index if not exists action_logs_guild_idx on action_logs (guild_id);

create table if not exists audit_logs (
  id         bigserial primary key,
  actor_id   text,
  actor_name text,
  action     text,
  target     text,
  meta       jsonb,
  ip         text,
  created_at timestamptz default now()
);
create index if not exists audit_logs_created_idx on audit_logs (created_at desc);

create table if not exists settings (
  key        text primary key,
  value      jsonb,
  updated_at timestamptz default now()
);

create table if not exists cache (
  key        text primary key,
  value      jsonb,
  expires_at timestamptz
);
create index if not exists cache_expires_idx on cache (expires_at);

-- ===== premium (ye pehle missing thi) =====
-- index/constraint names 2026_10_premium_hardening.sql se match karte hain,
-- taaki wo file idempotent rahe.
create table if not exists premium_requests (
  id            uuid primary key default gen_random_uuid(),
  discord_id    text not null,
  username      text,
  plan          text not null,
  amount_inr    numeric(10,2),
  amount_usd    numeric(10,4),
  duration_days integer,
  currency      text not null,
  amount_crypto numeric(24,10) not null,
  pay_address   text not null,
  txid          text,
  status        text not null default 'pending',
  expires_at    timestamptz not null default (now() + interval '30 minutes'),
  paid_at       timestamptz,
  reviewed_at   timestamptz,
  reviewed_by   text,
  created_at    timestamptz not null default now(),
  constraint premium_requests_status_chk
    check (status in ('pending','approved','cancelled','expired')),
  constraint premium_requests_amount_chk
    check (amount_crypto > 0)
);

create index if not exists premium_requests_user_created
  on premium_requests (discord_id, created_at desc);
create index if not exists premium_requests_status_expires
  on premium_requests (status, expires_at);
create unique index if not exists premium_requests_txid_uniq
  on premium_requests (txid) where txid is not null;
create unique index if not exists premium_requests_one_pending
  on premium_requests (discord_id) where status = 'pending';
