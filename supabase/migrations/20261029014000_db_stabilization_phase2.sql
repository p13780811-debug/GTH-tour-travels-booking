-- GTH PRO DB stabilization — phase 2 cutover.
-- Run only after phase 1 succeeds while attraction ingestion remains paused.

select public.gth_refresh_osm_attraction_summary(null);

do $$
begin
 if exists(select 1 from public.gth_osm_attractions where is_public=true and is_community_directory=true)
    and not exists(select 1 from public.gth_osm_attraction_country_summary) then
  raise exception 'Attraction summary backfill produced no country rows';
 end if;
end $$;

analyze public.gth_osm_attraction_country_summary;
analyze public.gth_osm_attraction_city_summary;

create or replace view public.gth_osm_attraction_country_counts
with(security_invoker=true) as
select country_code,country_name,records,last_source_write
from public.gth_osm_attraction_country_summary;

create or replace view public.gth_osm_attraction_city_counts
with(security_invoker=true) as
select country_code,country_name,city,records,last_source_write
from public.gth_osm_attraction_city_summary;

revoke all on public.gth_osm_attraction_country_counts from public;
revoke all on public.gth_osm_attraction_city_counts from public;
grant select on public.gth_osm_attraction_country_counts to anon,authenticated;
grant select on public.gth_osm_attraction_city_counts to anon,authenticated;
