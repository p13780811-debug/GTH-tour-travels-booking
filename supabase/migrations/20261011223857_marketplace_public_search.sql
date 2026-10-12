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


revoke all on table public.marketplace_public_projects from public;
grant select on table public.marketplace_public_projects to anon, authenticated, service_role;

create or replace function public.search_marketplace_projects(
  search_query text default null,
  search_country text default null,
  search_city text default null,
  search_type text default null,
  search_listing text default null,
  search_bedrooms integer default null,
  search_currency text default null,
  min_price numeric default null,
  max_price numeric default null,
  sort_mode text default 'latest',
  page_limit integer default 24,
  page_offset integer default 0
)
returns setof public.marketplace_public_projects
language sql
stable
security invoker
set search_path = ''
as $function$
  select v.*
  from public.marketplace_public_projects v
  where
    not (
      v.source_type in ('rera','manual')
      and v.active_inventory_count = 0
      and v.price is null
      and coalesce(v.bedrooms, v.beds) = 1
      and coalesce(v.area_sqft, v.sqft) = 650
      and v.verified is true
      and coalesce(lower(v.status),'') <> 'verified'
    )
    and (search_query is null or btrim(search_query) = '' or
      v.title ilike '%' || search_query || '%' or
      v.city ilike '%' || search_query || '%' or
      v.location ilike '%' || search_query || '%' or
      coalesce(v.developer,'') ilike '%' || search_query || '%' or
      coalesce(v.rera_id,'') ilike '%' || search_query || '%')
    and (search_country is null or btrim(search_country) = '' or v.country ilike '%' || search_country || '%')
    and (search_city is null or btrim(search_city) = '' or v.city ilike '%' || search_city || '%')
    and (
      (
        search_type is null and search_listing is null and search_bedrooms is null
        and search_currency is null and min_price is null and max_price is null
      )
      or exists (
        select 1 from public.property_inventory i
        where i.project_id = v.id
          and i.status = 'published'
          and (search_type is null or i.property_type = search_type)
          and (search_listing is null or i.listing_type = search_listing)
          and (search_bedrooms is null or i.bedrooms = search_bedrooms)
          and (search_currency is null or i.currency = upper(search_currency))
          and (min_price is null or i.price_amount >= min_price)
          and (max_price is null or i.price_amount <= max_price)
      )
      or (
        v.active_inventory_count = 0
        and v.source_type is distinct from 'registry'
        and search_currency is null and min_price is null and max_price is null
        and (search_type is null or v.property_type = search_type)
        and (search_listing is null or lower(v.listing_type) = lower(search_listing))
        and (search_bedrooms is null or v.bedrooms = search_bedrooms)
      )
    )
  order by
    case when sort_mode = 'price_low' then v.inventory_min_price end asc nulls last,
    case when sort_mode = 'price_high' then v.inventory_max_price end desc nulls last,
    case when sort_mode = 'ai' then v.final_score end desc nulls last,
    case when sort_mode = 'latest' then coalesce(v.inventory_latest_at, v.created_at) end desc nulls last,
    v.id desc
  limit least(greatest(coalesce(page_limit,24),1),100)
  offset least(greatest(coalesce(page_offset,0),0),100000);
$function$;

revoke all on function public.search_marketplace_projects(text,text,text,text,text,integer,text,numeric,numeric,text,integer,integer) from public;
grant execute on function public.search_marketplace_projects(text,text,text,text,text,integer,text,numeric,numeric,text,integer,integer)
  to anon, authenticated, service_role;


create or replace function public.marketplace_market_counts()
returns table(city text, country text, result_count bigint)
language sql
stable
security invoker
set search_path = ''
as $function$
  select
    v.city,
    v.country,
    count(*)::bigint as result_count
  from public.marketplace_public_projects v
  where
    coalesce(btrim(v.city),'') <> ''
    and coalesce(btrim(v.country),'') <> ''
    and not (
      v.source_type in ('rera','manual')
      and v.active_inventory_count = 0
      and v.price is null
      and coalesce(v.bedrooms, v.beds) = 1
      and coalesce(v.area_sqft, v.sqft) = 650
      and v.verified is true
      and coalesce(lower(v.status),'') <> 'verified'
    )
  group by v.city, v.country
  order by count(*) desc, v.city asc;
$function$;

revoke all on function public.marketplace_market_counts() from public;
grant execute on function public.marketplace_market_counts() to anon, authenticated, service_role;
