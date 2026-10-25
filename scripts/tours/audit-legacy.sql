-- Read-only aggregate audit. No UPDATE, DELETE or publication flag changes.
select count(*) as total_records,
 count(*) filter (where is_public = true) as published,
 count(*) filter (where is_public = true and media_rights_verified = true) as public_media_reviewed,
 count(*) filter (where nullif(trim(source_url),'') is null) as missing_source_url,
 count(*) filter (where nullif(trim(provider),'') is null) as missing_provider,
 count(*) filter (where image_url is null or image_url ~* 'pexels|unsplash|placeholder') as stock_or_missing_photo,
 count(distinct nullif(affiliate_link,'')) as distinct_booking_links,
 count(*) filter (where title ~* ' (Guided Tour|City Tour|Adventure Experience)$') as seed_title_pattern
from public.tours;
select count(*) as possible_duplicate_title_city_groups from (
 select lower(regexp_replace(trim(title),'\s+',' ','g')),coalesce(city_slug,city)
 from public.tours group by 1,2 having count(*)>1
) as duplicates;
