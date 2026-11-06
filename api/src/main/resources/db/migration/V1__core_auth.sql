-- ScrapFlow foundation schema. Apply this migration before starting the API.
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  phone text,
  account_type text not null check (account_type in ('ADMIN','STAFF','HOME_SELLER','BULK_SELLER')),
  account_status text not null default 'ACTIVE' check (account_status in ('ACTIVE','INACTIVE','PENDING')),
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists one_admin_only_idx on profiles ((account_type)) where account_type = 'ADMIN';

create table if not exists seller_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  business_name text,
  gstin text,
  approximate_quantity numeric(12,2),
  updated_at timestamptz not null default now()
);

create table if not exists staff_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  invited_by uuid not null references profiles(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on profiles(account_type, account_status);
create index if not exists invitations_email_idx on staff_invitations(lower(email), accepted_at);
