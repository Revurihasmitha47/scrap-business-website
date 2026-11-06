-- ScrapFlow business workflow. Apply after V1__core_auth.sql.
create table if not exists scrap_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists scrap_rates (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references scrap_categories(id) on delete cascade,
  home_seller_rate numeric(12,2) not null check (home_seller_rate > 0),
  bulk_seller_rate numeric(12,2) not null check (bulk_seller_rate > 0),
  changed_by uuid not null references profiles(id),
  effective_from timestamptz not null default now()
);

create table if not exists pickup_requests (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles(id),
  status text not null default 'SUBMITTED' check (status in ('SUBMITTED','CONFIRMED','ASSIGNED','ON_THE_WAY','COLLECTED','COMPLETED','REJECTED','CANCELLED','UNABLE_TO_COLLECT')),
  pickup_address jsonb not null,
  preferred_date date not null,
  preferred_time text,
  photo_url text,
  estimated_amount numeric(12,2) not null default 0,
  actual_amount numeric(12,2),
  assigned_staff_id uuid references profiles(id),
  rejection_reason text,
  collection_notes text,
  actual_weight numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pickup_items (
  id uuid primary key default gen_random_uuid(),
  pickup_id uuid not null references pickup_requests(id) on delete cascade,
  category_id uuid not null references scrap_categories(id),
  estimated_quantity numeric(12,2) not null check (estimated_quantity > 0),
  saved_rate numeric(12,2) not null check (saved_rate > 0),
  actual_weight numeric(12,2)
);

create table if not exists pickup_status_history (
  id uuid primary key default gen_random_uuid(),
  pickup_id uuid not null references pickup_requests(id) on delete cascade,
  status text not null,
  changed_by uuid not null references profiles(id),
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists pickup_seller_idx on pickup_requests(seller_id, created_at desc);
create index if not exists pickup_staff_idx on pickup_requests(assigned_staff_id, status, created_at desc);
create index if not exists pickup_status_idx on pickup_requests(status, created_at desc);

insert into scrap_categories(name) values ('Plastic'), ('Copper'), ('Paper'), ('Cotton cards') on conflict(name) do nothing;
