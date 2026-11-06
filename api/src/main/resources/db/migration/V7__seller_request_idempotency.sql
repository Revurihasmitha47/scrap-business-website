alter table pickup_requests add column if not exists idempotency_key text;
create unique index if not exists pickup_seller_idempotency_idx
  on pickup_requests(seller_id, idempotency_key)
  where idempotency_key is not null;
