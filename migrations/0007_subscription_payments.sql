alter table kitchen_settings
  add column if not exists subscription_upi_vpa text not null default '9880892916@axisbank';

alter table kitchen_settings
  add column if not exists subscription_upi_name text not null default 'Rajesh';

alter table subscriptions
  add column if not exists payment_ref text;

alter table subscriptions
  add column if not exists payment_submitted_at timestamptz;

create index if not exists subscriptions_pending_payment_idx
  on subscriptions (payment_submitted_at desc)
  where status = 'pending_payment';
