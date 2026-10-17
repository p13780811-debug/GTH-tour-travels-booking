-- GTH PRO Wikimedia Commons license-checked hotel photos.
-- Independent overlay: recurring OSM catalog refresh never deletes licensed media.
begin;
create table if not exists public.hotel_catalog_media (
  source text not null default 'osm' check(source='osm'),
  source_id text not null,
  wikidata_qid text not null check(wikidata_qid ~ '^Q[1-9][0-9]{0,14}$'),
  image_url text not null check(left(image_url,29)='https://upload.wikimedia.org/'),
  commons_page text not null check(left(commons_page,39)='https://commons.wikimedia.org/wiki/File:'),
  author text not null check(char_length(author) between 1 and 400),
  license_name text not null check(char_length(license_name) between 2 and 80),
  license_url text not null check(left(license_url,8)='https://'),
  source_name text not null default 'Wikimedia Commons' check(source_name='Wikimedia Commons'),
  checked_at timestamptz not null default now(),
  primary key(source,source_id),
  constraint hotel_catalog_media_source_fk foreign key(source,source_id)
    references public.hotel_catalog(source,source_id) on delete cascade
);
create index if not exists hotel_catalog_media_checked_idx on public.hotel_catalog_media(checked_at);
alter table public.hotel_catalog_media enable row level security;
revoke all on public.hotel_catalog_media from public,anon,authenticated;
grant select on public.hotel_catalog_media to anon,authenticated;
drop policy if exists "Read licensed Commons hotel photos" on public.hotel_catalog_media;
create policy "Read licensed Commons hotel photos" on public.hotel_catalog_media
 for select to anon,authenticated using (source='osm');
comment on table public.hotel_catalog_media is
 'Copyright-aware Commons photo overlays keyed to explicit OSM wikidata tag; preserve author/license/source attribution and do not overwrite OSM catalog.';
commit;