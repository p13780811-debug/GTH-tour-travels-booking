-- Exact-property affiliate hotel handoffs; additive to OSM and licensed media overlays.
-- Historical hotel source/identity rows are NEVER replaced by commercial links.
begin;
create table if not exists public.hotel_booking_links (
 id bigint generated always as identity primary key,
 catalog_source text,
 catalog_source_id text,
 reviewed_hotel_id uuid references public.hotels(id) on delete cascade,
 provider text not null check(provider in ('klook','trip_com','booking_com','other_approved')),
 provider_property_id text not null check(char_length(provider_property_id) between 2 and 180),
 provider_property_url text not null check(left(provider_property_url,8)='https://' and char_length(provider_property_url)<=1600),
 affiliate_url text not null check(left(affiliate_url,8)='https://' and char_length(affiliate_url)<=2048),
 hotel_name_at_provider text not null check(char_length(hotel_name_at_provider) between 3 and 240),
 verified_at timestamptz,
 exact_property_verified boolean not null default false,
 program_approved boolean not null default false,
 active boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint hotel_booking_links_one_identity_check check (
   (catalog_source='osm' and catalog_source_id is not null and reviewed_hotel_id is null)
   or (catalog_source is null and catalog_source_id is null and reviewed_hotel_id is not null)
 ),
 constraint hotel_booking_links_osm_fk foreign key(catalog_source,catalog_source_id)
   references public.hotel_catalog(source,source_id) on delete cascade,
 constraint hotel_booking_links_verified_at_check check (
   not active or (exact_property_verified and program_approved and verified_at is not null)
 )
);
create unique index if not exists hotel_booking_links_osm_unique
 on public.hotel_booking_links(catalog_source,catalog_source_id,provider)
 where reviewed_hotel_id is null;
create unique index if not exists hotel_booking_links_partner_unique
 on public.hotel_booking_links(reviewed_hotel_id,provider)
 where reviewed_hotel_id is not null;
create index if not exists hotel_booking_links_approved_idx
 on public.hotel_booking_links(catalog_source,catalog_source_id,verified_at desc) where active;
alter table public.hotel_booking_links enable row level security;
revoke all on public.hotel_booking_links from public,anon,authenticated;
grant select on public.hotel_booking_links to anon,authenticated;
drop policy if exists "Read current exact-property hotel booking links" on public.hotel_booking_links;
create policy "Read current exact-property hotel booking links" on public.hotel_booking_links
 for select to anon,authenticated using(
   active is true and exact_property_verified is true and program_approved is true
   and verified_at >= (now() - interval '180 days')
 );
comment on table public.hotel_booking_links is
 'Manual/authorized supplier verified exact property affiliate overlays. Inactive until provider ID, destination hotel and program are independently reviewed. No generic search URLs.';
commit;
