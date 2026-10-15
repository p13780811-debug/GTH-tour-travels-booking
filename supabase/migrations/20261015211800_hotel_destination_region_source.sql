-- Destination-aware hotel region discovery (only OSM-authored address region).
-- Empty region remains NULL; never infer location from download boundaries.
alter table public.hotel_catalog add column if not exists region text;
alter table public.hotel_catalog add column if not exists extract_region text;
alter table public.hotel_catalog add column if not exists extract_country_hint text;
comment on column public.hotel_catalog.extract_region is
 'Geofabrik licensed download region path; may cross borders, not the hotel official address.';
comment on column public.hotel_catalog.extract_country_hint is
 'Approximate Geofabrik extract country for discovery only; never an independently verified hotel country code.';
create index if not exists hotel_catalog_country_hint_idx on public.hotel_catalog(extract_country_hint);
create index if not exists hotel_catalog_region_lower_idx
  on public.hotel_catalog (lower(region));
create index if not exists hotel_catalog_city_lower_idx
  on public.hotel_catalog (lower(city));
comment on column public.hotel_catalog.region is
  'Original accommodation address region/state from OSM tags, never the Geofabrik download region. Discovery hint, not country certification.';
