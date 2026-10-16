-- GTH PRO: owner-submitted hotel inventory with private, reviewed photo evidence.
-- Additive. Existing hotel_catalog, real estate, supplier APIs, and global CSS unchanged.
begin;
alter table public.hotels add column if not exists category text;
alter table public.hotels add column if not exists country_code text;
alter table public.hotels add column if not exists address text;
alter table public.hotels add column if not exists description text;
-- Existing partner rows may have null categories; owner entries are checked on ingestion.
create index if not exists hotels_country_category_name_idx on public.hotels(country_code,category,name);
create table if not exists public.hotel_partner_submissions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  hotel_name text not null check (char_length(hotel_name) between 3 and 180),
  city text not null check (char_length(city) between 2 and 100),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  address text not null check (char_length(address) between 8 and 350),
  category text not null check (category in ('hotel','motel','hostel','guest_house','apartment','resort')),
  description text not null check (char_length(description) between 40 and 3000),
  owner_name text not null check (char_length(owner_name) between 2 and 120),
  contact_email text not null check (char_length(contact_email) between 5 and 254),
  website text,
  photo_rights_confirmed boolean not null check (photo_rights_confirmed is true),
  owner_authorised boolean not null check (owner_authorised is true),
  status text not null default 'pending' check (status in ('pending','reviewing','approved','rejected')),
  published_hotel_id uuid unique references public.hotels(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hotel_partner_submissions_owner_idx on public.hotel_partner_submissions(owner_id,created_at desc);
create index if not exists hotel_partner_submissions_status_idx on public.hotel_partner_submissions(status,created_at);
create table if not exists public.hotel_partner_photos (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.hotel_partner_submissions(id) on delete cascade,
  slot smallint not null check (slot between 0 and 5),
  private_path text not null unique,
  created_at timestamptz not null default now(),
  unique(submission_id,slot)
);
create index if not exists hotel_partner_photos_submission_idx on public.hotel_partner_photos(submission_id);
create table if not exists public.hotel_partner_public_photos (
 id uuid primary key default gen_random_uuid(),
 hotel_id uuid not null references public.hotels(id) on delete cascade,
 slot smallint not null check(slot between 0 and 5),
 image_url text not null check(left(image_url,8)='https://'),
 unique(hotel_id,slot)
);
create index if not exists hotel_partner_public_photos_hotel_idx on public.hotel_partner_public_photos(hotel_id,slot);
alter table public.hotel_partner_public_photos enable row level security;
revoke all on public.hotel_partner_public_photos from public,anon,authenticated;
grant select on public.hotel_partner_public_photos to anon,authenticated;
drop policy if exists "Approved hotel photo galleries public" on public.hotel_partner_public_photos;
create policy "Approved hotel photo galleries public" on public.hotel_partner_public_photos
 for select to anon,authenticated using (exists(select 1 from public.hotels h where h.id=hotel_id
 and h.is_public is true and h.media_rights_verified is true
 and h.source_name is not null and h.source_url is not null));
alter table public.hotel_partner_submissions enable row level security;
alter table public.hotel_partner_photos enable row level security;
revoke all on public.hotel_partner_submissions from public,anon,authenticated;
revoke all on public.hotel_partner_photos from public,anon,authenticated;
grant select,insert on public.hotel_partner_submissions to authenticated;
grant select on public.hotel_partner_photos to authenticated;
drop policy if exists "Hotel owners read their submissions" on public.hotel_partner_submissions;
create policy "Hotel owners read their submissions" on public.hotel_partner_submissions
 for select to authenticated using (owner_id=auth.uid());
drop policy if exists "Hotel owners submit private pending inventory" on public.hotel_partner_submissions;
create policy "Hotel owners submit private pending inventory" on public.hotel_partner_submissions
 for insert to authenticated with check(owner_id=auth.uid() and status='pending' and published_hotel_id is null);
drop policy if exists "Hotel owners read their photo entries" on public.hotel_partner_photos;
create policy "Hotel owners read their photo entries" on public.hotel_partner_photos
 for select to authenticated using (exists(select 1 from public.hotel_partner_submissions s
   where s.id=submission_id and s.owner_id=auth.uid()));
-- Storage: zero public reads to unapproved media; server-only upload via authenticated service role.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values ('hotel-partner-private','hotel-partner-private',false,2097152,array['image/webp'])
 on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values ('hotel-partner-public','hotel-partner-public',true,2097152,array['image/webp'])
 on conflict(id) do nothing;
comment on table public.hotel_partner_submissions is 'Private owner-authorised hotel inventory requests; only explicitly reviewed photos and listings may be published.';
comment on table public.hotel_partner_photos is 'Private, image-reencoded evidence; approval copies source files into hotel-partner-public.';
commit;