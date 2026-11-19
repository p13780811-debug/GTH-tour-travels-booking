-- Correct the supplier-specific staging approach: use the existing public.destinations.
-- Preserve all existing records and routes; do not grant public write access.
alter table public.destinations
  add column if not exists country_code text,
  add column if not exists nuitee_place_id text;

create unique index if not exists destinations_slug_unique_idx
  on public.destinations (slug);
create unique index if not exists destinations_nuitee_place_id_unique_idx
  on public.destinations (nuitee_place_id)
  where nuitee_place_id is not null;
create index if not exists destinations_active_name_idx
  on public.destinations (name)
  where is_active is true;

-- Security correction: existing table had unrestricted anon/auth CRUD.
revoke insert, update, delete on public.destinations
  from public, anon, authenticated;

drop policy if exists "Allow insert destinations" on public.destinations;
drop policy if exists "Allow update destinations" on public.destinations;
drop policy if exists "Allow delete destinations" on public.destinations;
drop policy if exists "Allow public read destinations" on public.destinations;

-- Allow public reads of published records, including text-only city references.
-- Leave the older reviewed-media SELECT policy intact for compatibility.
drop policy if exists "GTH published destination reference reads"
  on public.destinations;
create policy "GTH published destination reference reads"
  on public.destinations for select
  to anon, authenticated
  using (is_active is true);

comment on column public.destinations.nuitee_place_id is
  'Only official verified supplier place IDs. Never derived from city text.';
comment on column public.destinations.country_code is
  'ISO-3166 alpha-2 country code, sourced from country/city reference data.';
