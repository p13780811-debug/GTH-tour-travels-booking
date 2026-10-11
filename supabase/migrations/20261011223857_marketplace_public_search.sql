create or replace view public.marketplace_public_projects
with (security_invoker = true)
as
select
  p.*,
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
left join lateral (
  select
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
  where i.project_id = p.id
    and i.status = 'published'
) s on true;
