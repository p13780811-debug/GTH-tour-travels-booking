-- Additive micro-location lookup indexes. No data, policy, function or registry writes.
-- pg_trgm is already installed in the verified GTH PRO Supabase project.
begin;
set local lock_timeout='5s';
set local statement_timeout='45s';
create index if not exists properties_hyperlocal_village_idx
  on public.properties using gin (village gin_trgm_ops)
  where village is not null and source_type in ('registry','rera');
create index if not exists properties_hyperlocal_locality_idx
  on public.properties using gin (locality gin_trgm_ops)
  where locality is not null and source_type in ('registry','rera');
create index if not exists hotel_catalog_geo_bbox_idx
  on public.hotel_catalog (latitude,longitude)
  where source='osm' and latitude is not null and longitude is not null;
commit;
