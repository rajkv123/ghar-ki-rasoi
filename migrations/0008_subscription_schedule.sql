alter table subscriptions
  add column if not exists start_date date;

alter table subscriptions
  add column if not exists end_date date;

alter table subscriptions
  add column if not exists pause_from date;

alter table subscriptions
  add column if not exists pause_to date;

update subscriptions
set start_date = coalesce(start_date, started_at::date),
    end_date = coalesce(end_date, renews_at::date)
where start_date is null or end_date is null;

alter table subscriptions
  alter column start_date set default current_date,
  alter column start_date set not null,
  alter column end_date set default (current_date + 30),
  alter column end_date set not null;
