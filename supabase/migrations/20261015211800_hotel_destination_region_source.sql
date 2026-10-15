-- Destination-aware hotel region discovery (only OSM-authored address region).
-- Empty region remains NULL; never infer location from download boundaries.
alter table public.hotel_catalog add column if not exists region text;
create index if not exists hotel_catalog_region_lower_idx
  on public.hotel_catalog (lower(region));
create index if not exists hotel_catalog_city_lower_idx
  on public.hotel_catalog (lower(city));
comment on column public.hotel_catalog.region is
  'Original accommodation address region/state from OSM tags, never the Geofabrik download region. Discovery hint, not country certification.';
