-- Additive compatibility and secure pickup photo metadata.
-- Existing tables and rows are preserved.
alter table pickup_requests add column if not exists seller_notes text;
alter table pickup_requests add column if not exists idempotency_key text;
alter table pickup_items add column if not exists category_name_snapshot text;
alter table pickup_items add column if not exists rate_type_snapshot text;

create unique index if not exists pickup_seller_idempotency_idx
  on pickup_requests(seller_id, idempotency_key)
  where idempotency_key is not null;

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id),
  notification_type text not null,
  title text not null,
  message text not null,
  related_entity_type text,
  related_entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_recipient_idx
  on notifications(recipient_id, is_read, created_at desc);

create table if not exists pickup_photos (
  id uuid primary key default gen_random_uuid(),
  pickup_id uuid not null references pickup_requests(id) on delete cascade,
  seller_id uuid not null references profiles(id),
  storage_name text not null unique,
  original_name text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);

create index if not exists pickup_photos_pickup_idx
  on pickup_photos(pickup_id, created_at desc);
