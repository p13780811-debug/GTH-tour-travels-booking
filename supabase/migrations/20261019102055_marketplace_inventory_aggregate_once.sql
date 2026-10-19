-- Preserve the public field contract and RLS while aggregating published inventory once.
-- Avoid one correlated aggregate for every historical registry record during sorting.
BEGIN;
create or replace view public.marketplace_public_projects
with (security_invoker = true)
as
select
  p.id,
  p.title,
  p.slug,
  p.location,
  p.city,
  p.country,
  p.state,
  p.district,
  p.taluka,
  p.village,
  p.pin_code,
  p.price,
  p.bhk,
  p.lat,
  p.lng,
  p.image,
  p.gallery,
  p.hero_image,
  p.builder_name,
  p.developer,
  p.description,
  p.created_at,
  p.is_featured,
  p.boost_expiry,
  p.property_type,
  p.listing_type,
  p.status,
  p.verified,
  p.bedrooms,
  p.bathrooms,
  p.area_sqft,
  p.sqft,
  p.beds,
  p.baths,
  p.amenities,
  p.rating,
  p.review_count,
  p.featured,
  p.intelligence_score,
  p.final_score,
  p.rank_position,
  p.ai_score,
  p.views,
  p.leads,
  p.fraud_score,
  p.rera_id,
  p.completion_date,
  p.registration_date,
  p.source_type,
  p.ingestion_source,
  p.last_verified_at,
  p.official_source_url,
  p.official_source_reference,
  coalesce(s.active_inventory_count,0)::bigint as active_inventory_count,
  s.inventory_min_price,
  s.inventory_max_price,
  s.inventory_currency,
  s.inventory_min_bedrooms,
  s.inventory_max_bedrooms,
  s.inventory_min_bathrooms,
  s.inventory_max_bathrooms,
  s.inventory_min_area_sqft,
  s.inventory_max_area_sqft,
  s.inventory_latest_at,
  s.inventory_has_buy,
  s.inventory_has_rent,
  s.inventory_property_types,
  s.inventory_image
from public.properties p
left join (
  select
    i.project_id,
    count(*)::bigint as active_inventory_count,
    min(i.price_amount) filter (where i.price_amount is not null) as inventory_min_price,
    max(i.price_amount) filter (where i.price_amount is not null) as inventory_max_price,
    case when count(distinct i.currency) = 1 then min(i.currency) else null end as inventory_currency,
    min(i.bedrooms) filter (where i.bedrooms is not null) as inventory_min_bedrooms,
    max(i.bedrooms) filter (where i.bedrooms is not null) as inventory_max_bedrooms,
    min(i.bathrooms) filter (where i.bathrooms is not null) as inventory_min_bathrooms,
    max(i.bathrooms) filter (where i.bathrooms is not null) as inventory_max_bathrooms,
    min(i.area_sqft) filter (where i.area_sqft is not null) as inventory_min_area_sqft,
    max(i.area_sqft) filter (where i.area_sqft is not null) as inventory_max_area_sqft,
    max(i.published_at) as inventory_latest_at,
    bool_or(i.listing_type = 'buy') as inventory_has_buy,
    bool_or(i.listing_type = 'rent') as inventory_has_rent,
    array_agg(distinct i.property_type) filter (where i.property_type is not null) as inventory_property_types,
    (array_agg(i.media_urls->>0 order by i.published_at desc nulls last)
      filter (where jsonb_array_length(i.media_urls) > 0))[1] as inventory_image
  from public.property_inventory i
  where i.status = 'published'
  group by i.project_id
) s on s.project_id = p.id;
REVOKE ALL ON public.marketplace_public_projects FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.marketplace_public_projects TO anon, authenticated, service_role;
COMMIT;
