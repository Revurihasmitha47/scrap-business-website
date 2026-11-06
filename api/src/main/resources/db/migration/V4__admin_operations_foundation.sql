-- Additive Admin operations foundation. Apply after V3__profile_details.sql.
-- Existing tables and rows are preserved.

alter table scrap_categories add column if not exists description text;
alter table scrap_categories add column if not exists unit text not null default 'kg';
alter table scrap_categories add column if not exists icon_url text;

alter table pickup_requests add column if not exists seller_notes text;
alter table pickup_requests add column if not exists cancelled_reason text;
alter table pickup_requests add column if not exists completed_at timestamptz;

alter table pickup_items add column if not exists category_name_snapshot text;
alter table pickup_items add column if not exists rate_type_snapshot text;

alter table profiles add column if not exists service_area text;
alter table profiles add column if not exists availability_status text not null default 'AVAILABLE';

create table if not exists staff_assignment_history (
  id uuid primary key default gen_random_uuid(),
  pickup_id uuid not null references pickup_requests(id),
  previous_staff_id uuid references profiles(id),
  assigned_staff_id uuid not null references profiles(id),
  changed_by uuid not null references profiles(id),
  reason text,
  created_at timestamptz not null default now()
);

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
create index if not exists assignment_history_pickup_idx
  on staff_assignment_history(pickup_id, created_at desc);
create index if not exists pickup_preferred_date_idx
  on pickup_requests(preferred_date, status);

-- Keep historical category names available even if a category is later renamed.
update pickup_items i
set category_name_snapshot = c.name
from scrap_categories c
where i.category_id = c.id and i.category_name_snapshot is null;

-- Existing rows are valid; this constraint only prevents future invalid values.
alter table profiles drop constraint if exists profiles_availability_status_check;
alter table profiles add constraint profiles_availability_status_check
  check (availability_status in ('AVAILABLE', 'ON_PICKUP', 'UNAVAILABLE', 'ON_LEAVE'));
