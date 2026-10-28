-- GTH PRO DB stabilization — phase 1.
-- Additive/non-destructive. Importer must remain paused during rollout.

create extension if not exists pg_trgm;

create index if not exists gth_osm_attractions_public_city_norm_idx
  on public.gth_osm_attractions (country_code, (lower(btrim(city))), source_id)
  where is_public=true and is_community_directory=true
    and country_code is not null and city is not null
    and length(btrim(city)) between 3 and 80
    and btrim(city) !~ '[[:cntrl:]]';

create index if not exists gth_osm_attractions_public_country_updated_idx
  on public.gth_osm_attractions (country_code, updated_at desc)
  where is_public=true and is_community_directory=true and country_code is not null;

create table if not exists public.gth_osm_attraction_country_summary (
 country_code text primary key check(country_code ~ '^[A-Z]{2}$'),
 country_name text not null check(char_length(country_name) between 2 and 100),
 records bigint not null check(records>=0),
 last_source_write timestamptz,
 refreshed_at timestamptz not null default now()
);

create table if not exists public.gth_osm_attraction_city_summary (
 country_code text not null check(country_code ~ '^[A-Z]{2}$'),
 city_key text not null check(char_length(city_key) between 3 and 80),
 country_name text not null check(char_length(country_name) between 2 and 100),
 city text not null check(char_length(city) between 3 and 80),
 records bigint not null check(records>=2),
 last_source_write timestamptz,
 refreshed_at timestamptz not null default now(),
 primary key(country_code,city_key)
);

alter table public.gth_osm_attraction_country_summary enable row level security;
alter table public.gth_osm_attraction_city_summary enable row level security;
revoke all on public.gth_osm_attraction_country_summary from public,anon,authenticated;
revoke all on public.gth_osm_attraction_city_summary from public,anon,authenticated;
grant select on public.gth_osm_attraction_country_summary to anon,authenticated;
grant select on public.gth_osm_attraction_city_summary to anon,authenticated;
grant select,insert,update,delete on public.gth_osm_attraction_country_summary to service_role;
grant select,insert,update,delete on public.gth_osm_attraction_city_summary to service_role;

drop policy if exists "Public attraction country summaries" on public.gth_osm_attraction_country_summary;
create policy "Public attraction country summaries"
 on public.gth_osm_attraction_country_summary for select to anon,authenticated using(true);
drop policy if exists "Public attraction city summaries" on public.gth_osm_attraction_city_summary;
create policy "Public attraction city summaries"
 on public.gth_osm_attraction_city_summary for select to anon,authenticated using(true);

create index if not exists gth_osm_attraction_city_summary_display_idx
 on public.gth_osm_attraction_city_summary(country_code,city);

create or replace function public.gth_refresh_osm_attraction_summary(p_country_code text default null)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_country_rows integer:=0; v_city_rows integer:=0;
begin
 if p_country_code is not null and p_country_code !~ '^[A-Z]{2}$' then raise exception 'Invalid country code'; end if;
 if p_country_code is null then
  delete from public.gth_osm_attraction_city_summary;
  delete from public.gth_osm_attraction_country_summary;
 else
  delete from public.gth_osm_attraction_city_summary where country_code=p_country_code;
  delete from public.gth_osm_attraction_country_summary where country_code=p_country_code;
 end if;

 insert into public.gth_osm_attraction_country_summary(country_code,country_name,records,last_source_write,refreshed_at)
 select country_code,max(country_name),count(*)::bigint,max(updated_at),now()
 from public.gth_osm_attractions
 where is_public=true and is_community_directory=true and country_code is not null
   and (p_country_code is null or country_code=p_country_code)
 group by country_code;
 get diagnostics v_country_rows=row_count;

 insert into public.gth_osm_attraction_city_summary(country_code,city_key,country_name,city,records,last_source_write,refreshed_at)
 select country_code,lower(btrim(city)),max(country_name),min(btrim(city)),count(*)::bigint,max(updated_at),now()
 from public.gth_osm_attractions
 where is_public=true and is_community_directory=true and country_code is not null and city is not null
   and length(btrim(city)) between 3 and 80 and btrim(city) !~ '[[:cntrl:]]'
   and (p_country_code is null or country_code=p_country_code)
 group by country_code,lower(btrim(city))
 having count(*)>=2;
 get diagnostics v_city_rows=row_count;
 return jsonb_build_object('country_rows',v_country_rows,'city_rows',v_city_rows,'country',p_country_code,'refreshed_at',now());
end $$;
revoke all on function public.gth_refresh_osm_attraction_summary(text) from public,anon,authenticated;
grant execute on function public.gth_refresh_osm_attraction_summary(text) to service_role;

create index if not exists tenders_public_country_deadline_id_idx
 on public.tenders(country_code,deadline_at,id)
 where is_public=true and source_verified=true and status='published';
create index if not exists tenders_public_sector_deadline_id_idx
 on public.tenders(sector,deadline_at,id)
 where is_public=true and source_verified=true and status='published';
create index if not exists tenders_public_imported_id_idx
 on public.tenders(imported_at desc,id)
 where is_public=true and source_verified=true and status='published';
create index if not exists tenders_public_title_trgm_idx
 on public.tenders using gin(title gin_trgm_ops)
 where is_public=true and source_verified=true and status='published';

create or replace function public.gth_tender_market_metrics(
 p_home_country text default null,
 p_nearby text[] default '{}'::text[],
 p_sector text default null,
 p_query text default null,
 p_closing_before timestamptz default null,
 p_closing_within timestamptz default null
) returns jsonb
language plpgsql stable security invoker set search_path=public,pg_temp as $$
declare v_result jsonb;
begin
 if p_home_country is not null and p_home_country !~ '^[A-Z]{2}$' then raise exception 'Invalid home country'; end if;
 if cardinality(coalesce(p_nearby,'{}'::text[]))>12
    or exists(select 1 from unnest(coalesce(p_nearby,'{}'::text[])) c where c !~ '^[A-Z]{2}$')
 then raise exception 'Invalid nearby countries'; end if;
 if p_sector is not null and p_sector<>'' and p_sector not in ('works','goods','services','consultancy','other')
 then raise exception 'Invalid sector'; end if;
 if p_query is not null and char_length(p_query)>100 then raise exception 'Invalid query'; end if;

 with geo as materialized (
  select country_code,sector,deadline_at,imported_at,title
  from public.tenders
  where is_public=true and source_verified=true and status='published' and deadline_at>now()
    and (p_home_country is null or country_code=p_home_country or country_code=any(coalesce(p_nearby,'{}'::text[])))
 ), filtered as materialized (
  select * from geo
  where (p_sector is null or p_sector='' or sector=p_sector)
    and (p_closing_before is null or deadline_at<=p_closing_before)
    and (p_closing_within is null or deadline_at<=p_closing_within)
    and (p_query is null or p_query='' or strpos(lower(title),lower(p_query))>0)
 ), g as (
  select
   count(*) filter(where sector='works')::bigint works,
   count(*) filter(where sector='goods')::bigint goods,
   count(*) filter(where sector='services')::bigint services,
   count(*) filter(where sector='consultancy')::bigint consultancy,
   count(*) filter(where sector='other')::bigint other_count,
   count(*) filter(where deadline_at<=now()+interval '7 days')::bigint closing_soon_7,
   max(imported_at) latest_imported_at
  from geo
 ), f as (
  select count(*)::bigint total_filtered,
   count(*) filter(where p_home_country is not null and country_code=p_home_country)::bigint home_count,
   count(*) filter(where p_home_country is not null and country_code=any(coalesce(p_nearby,'{}'::text[])) and country_code<>p_home_country)::bigint nearby_count
  from filtered
 )
 select jsonb_build_object(
  'total_filtered',f.total_filtered,
  'home_count',case when p_home_country is null then f.total_filtered else f.home_count end,
  'nearby_count',case when p_home_country is null then 0 else f.nearby_count end,
  'sectors',jsonb_build_object('works',g.works,'goods',g.goods,'services',g.services,'consultancy',g.consultancy,'other',g.other_count),
  'closing_soon_7',g.closing_soon_7,'latest_imported_at',g.latest_imported_at
 ) into v_result from g cross join f;
 return coalesce(v_result,jsonb_build_object(
  'total_filtered',0,'home_count',0,'nearby_count',0,
  'sectors',jsonb_build_object('works',0,'goods',0,'services',0,'consultancy',0,'other',0),
  'closing_soon_7',0,'latest_imported_at',null));
end $$;
revoke all on function public.gth_tender_market_metrics(text,text[],text,text,timestamptz,timestamptz) from public;
grant execute on function public.gth_tender_market_metrics(text,text[],text,text,timestamptz,timestamptz) to anon,authenticated;

comment on function public.gth_tender_market_metrics(text,text[],text,text,timestamptz,timestamptz)
 is 'RLS-respecting aggregate replacing multiple exact-count HTTP requests.';
