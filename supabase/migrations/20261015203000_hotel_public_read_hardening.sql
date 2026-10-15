-- GTH PRO Hotels: close legacy anonymous write access to unverified hotel table.
-- All writes remain server-side via service_role. Existing data is preserved.
begin;
alter table public.hotels enable row level security;
drop policy if exists "Allow public insert hotels" on public.hotels;
drop policy if exists "Allow update hotels" on public.hotels;
drop policy if exists "Allow delete hotels" on public.hotels;
drop policy if exists "Allow public read hotels" on public.hotels;
drop policy if exists "travel public hotels are review approved" on public.hotels;
create policy "Read reviewed licensed hotel partner listings" on public.hotels
 for select to anon, authenticated
 using (is_public is true and media_rights_verified is true
        and source_name is not null and source_url is not null);
revoke all on public.hotels from public,anon,authenticated;
grant select on public.hotels to anon,authenticated;

create index if not exists hotel_catalog_country_category_name_idx
 on public.hotel_catalog(country_code,category,name,id);
create index if not exists hotel_catalog_name_idx
 on public.hotel_catalog(lower(name));
create index if not exists hotel_catalog_imported_idx
 on public.hotel_catalog(imported_at desc,id);
commit;
