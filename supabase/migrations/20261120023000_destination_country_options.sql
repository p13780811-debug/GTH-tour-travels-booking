-- Small security-invoker facet reader for the existing public directory.
-- No new destination table, and no grants to write destination data.
create or replace function public.gth_destination_country_options()
returns table(country text)
language sql stable security invoker
set search_path = ''
as $$
  select distinct d.country
  from public.destinations as d
  where d.is_active is true and d.country is not null
    and length(d.country) between 2 and 160
  order by d.country;
$$;
revoke all on function public.gth_destination_country_options() from public;
grant execute on function public.gth_destination_country_options() to anon, authenticated, service_role;
