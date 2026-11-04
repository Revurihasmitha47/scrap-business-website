-- Additive collection and seller-payment details.
-- Existing pickup requests and collection data are preserved.
alter table pickup_requests add column if not exists amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0);
alter table pickup_requests add column if not exists payment_balance numeric(12,2);
alter table pickup_requests add column if not exists payment_method text;
alter table pickup_requests add column if not exists payment_status text not null default 'UNPAID';
alter table pickup_requests add column if not exists payment_reference text;
alter table pickup_requests add column if not exists payment_notes text;
alter table pickup_requests add column if not exists collected_at timestamptz;
alter table pickup_requests add column if not exists collected_by uuid references profiles(id);

alter table pickup_requests drop constraint if exists pickup_requests_payment_status_check;
alter table pickup_requests add constraint pickup_requests_payment_status_check
  check (payment_status in ('UNPAID','PARTIALLY_PAID','PAID'));

create table if not exists pickup_payment_records (
  id uuid primary key default gen_random_uuid(),
  pickup_id uuid not null references pickup_requests(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  payment_method text,
  payment_reference text,
  payment_notes text,
  payment_status text not null check (payment_status in ('UNPAID','PARTIALLY_PAID','PAID')),
  recorded_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists pickup_payment_records_pickup_idx
  on pickup_payment_records(pickup_id, created_at desc);
