-- Additive split-payment and retry protection for pickup settlements.
alter table pickup_payment_records add column if not exists idempotency_key text;

create unique index if not exists pickup_payment_idempotency_idx
  on pickup_payment_records(pickup_id, idempotency_key)
  where idempotency_key is not null;
