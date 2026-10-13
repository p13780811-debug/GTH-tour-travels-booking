-- GTH PRO public, source-attributed hotel catalog (OSM ODbL).
-- Additive: existing hotels, booking, real estate and RLS stay unchanged.
create table if not exists public.hotel_catalog (
 id bigint generated always as identity primary key,
 source text not null check (source in ('osm')),
 source_id text not null check (length(source_id) between 3 and 100),
 name text not null check (length(name) between 1 and 240),
 city text,
 country_code text,
 address text,
 latitude double precision not null check(latitude between -90 and 90),
 longitude double precision not null check(longitude between -180 and 180),
 website text,
 phone text,
 category text not null check(category in ('hotel','motel','hostel','guest_house','apartment','resort')),
 source_license text not null default 'ODbL-1.0',
 source_url text not null,
 imported_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (source, source_id)
);
create index if not exists hotel_catalog_city_idx on public.hotel_catalog (lower(city));
create index if not exists hotel_catalog_country_idx on public.hotel_catalog (country_code);
create table if not exists public.hotel_catalog_ingestion_runs (
 id bigint generated always as identity primary key,
 source text not null,
 input_file text not null,
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 upserted_count integer not null default 0,
 rejected_count integer not null default 0,
 status text not null check (status in ('running','completed','failed'))
);
alter table public.hotel_catalog enable row level security;
alter table public.hotel_catalog_ingestion_runs enable row level security;
revoke all on public.hotel_catalog from public, anon, authenticated;
revoke all on public.hotel_catalog_ingestion_runs from public, anon, authenticated;
grant select on public.hotel_catalog to anon, authenticated;
create policy "Public can read attributed hotel catalog" on public.hotel_catalog
 for select to anon, authenticated using (true);
-- No public write/usage access to ingestion data. Server-side importer uses service role.
comment on table public.hotel_catalog is 'OpenStreetMap-derived accommodation catalog. ODbL-1.0 attribution/share-alike obligations apply; not live inventory or verified listings.';
