-- Separate, private Nuitee reference catalog.
-- Existing destinations, hotels, and booking tables remain unchanged.

create table if not exists public.nuitee_destinations (
  country_code text not null
    check (country_code ~ '^[A-Z]{2}$'),

  slug text not null
    check (
      length(slug) between 1 and 140
      and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    ),

  city_name text not null
    check (length(city_name) between 1 and 160),

  country_name text not null
    check (length(country_name) between 1 and 160),

  -- The free Cities endpoint does not supply verified Place IDs.
  nuitee_place_id text unique
    check (
      nuitee_place_id is null
      or (
        length(nuitee_place_id) between 5 and 255
        and nuitee_place_id ~ '^[A-Za-z0-9_-]+$'
      )
    ),

  updated_at timestamptz not null default now(),

  constraint nuitee_destinations_pkey
    primary key (country_code, slug)
);

alter table public.nuitee_destinations
  enable row level security;

-- Private ingestion only; no browser or anonymous access.
revoke all on table public.nuitee_destinations
  from public, anon, authenticated;

grant select, insert, update
  on table public.nuitee_destinations
  to service_role;

comment on table public.nuitee_destinations is
  'Nuitee official Countries/Cities reference data. '
  'Place IDs remain NULL until independently verified. '
  'Not evidence of live hotel availability.';
