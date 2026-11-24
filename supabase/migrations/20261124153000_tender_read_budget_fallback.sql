-- Shared budget for public catalogue refreshes when the primary Redis limiter is unavailable.
create table public.tender_read_budget_fallback (
  environment text primary key check(environment in ('production','preview','development')),
  minute_window bigint not null,
  day_window bigint not null,
  minute_used integer not null check(minute_used between 1 and 30),
  day_used integer not null check(day_used between 1 and 1000)
);
alter table public.tender_read_budget_fallback enable row level security;
revoke all on public.tender_read_budget_fallback from public, anon, authenticated;

create function public.tender_reserve_fallback_read(p_environment text)
returns boolean language plpgsql security definer set search_path='' as $$
declare
  epoch_seconds numeric := extract(epoch from statement_timestamp());
  bucket_minute bigint := floor(epoch_seconds/60);
  bucket_day bigint := floor(epoch_seconds/86400);
begin
  if p_environment not in ('production','preview','development') or p_environment is null then
    return false;
  end if;
  insert into public.tender_read_budget_fallback as budget (
    environment,minute_window,day_window,minute_used,day_used
  ) values(p_environment,bucket_minute,bucket_day,1,1)
  on conflict(environment) do update set
    minute_window=bucket_minute,
    day_window=bucket_day,
    minute_used=case when budget.minute_window=bucket_minute then budget.minute_used+1 else 1 end,
    day_used=case when budget.day_window=bucket_day then budget.day_used+1 else 1 end
  where (budget.minute_window<>bucket_minute or budget.minute_used<30)
    and (budget.day_window<>bucket_day or budget.day_used<1000);
  return found;
end;
$$;
revoke all on function public.tender_reserve_fallback_read(text) from public, anon, authenticated;
grant execute on function public.tender_reserve_fallback_read(text) to service_role;
