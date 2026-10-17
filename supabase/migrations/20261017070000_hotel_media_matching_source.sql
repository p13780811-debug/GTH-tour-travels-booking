-- Explicit rights provenance for photo links without generating fake hotel media.
begin;
alter table public.hotel_catalog_media alter column wikidata_qid drop not null;
alter table public.hotel_catalog_media add column if not exists match_method text not null default 'wikidata_p18';
alter table public.hotel_catalog_media drop constraint if exists hotel_catalog_media_match_method_check;
alter table public.hotel_catalog_media add constraint hotel_catalog_media_match_method_check
  check (match_method in ('wikidata_p18','osm_commons_file'));
comment on column public.hotel_catalog_media.match_method is
 'Explicit OSM Wikidata P18 or directly linked OSM wikimedia_commons=File, both validated for reuse and attribution.';
comment on column public.hotel_catalog_media.wikidata_qid is
 'Optional when a Commons File is directly tagged on the original OSM accommodation feature.';
commit;