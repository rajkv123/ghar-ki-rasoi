alter table subscriptions
  add column if not exists cancelled_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscriptions_date_range_check'
      and conrelid = 'subscriptions'::regclass
  ) then
    alter table subscriptions
      add constraint subscriptions_date_range_check
      check (start_date <= end_date);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscriptions_pause_range_check'
      and conrelid = 'subscriptions'::regclass
  ) then
    alter table subscriptions
      add constraint subscriptions_pause_range_check
      check (
        (pause_from is null and pause_to is null)
        or (
          pause_from is not null
          and pause_to is not null
          and pause_from <= pause_to
          and pause_from >= start_date
          and pause_to <= end_date
        )
      );
  end if;
end;
$$;
