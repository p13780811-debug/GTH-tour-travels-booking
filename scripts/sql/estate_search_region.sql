CREATE OR REPLACE FUNCTION public.search_hybrid_properties(filters jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
 mode text := coalesce(filters->>'mode','buy');
 page_num integer := coalesce((filters->>'page')::integer,1);
 lo numeric := (filters->>'minPrice')::numeric;
 hi numeric := (filters->>'maxPrice')::numeric;
 cur text := filters->>'currency';
 result jsonb;
begin
 if (filters->'region' is not null and filters->'region'<>'null'::jsonb and not public.property_region_valid(filters->'region')) then raise exception 'Invalid map region' using errcode='22023';end if;
 if jsonb_typeof(filters)<>'object' or mode not in ('buy','rent','new_launch','commercial','plots')
  or page_num<1 or page_num>10000
  or coalesce(filters->>'bedrooms','1') not in ('1','2','3','4+')
  or coalesce(filters->>'possession','ready_to_move') not in ('ready_to_move','under_construction','off_plan')
  or coalesce(filters->>'sort','latest') not in ('latest','ai','price_low','price_high')
  or (cur is not null and cur not in ('INR','AED','USD','GBP','EUR','SGD'))
  or ((lo is not null or hi is not null) and cur is null)
  or lo<=0 or hi<=0 or lo>999999999999 or hi>999999999999 or lo>hi
  or length(coalesce(filters->>'query',''))>120
  or length(coalesce(filters->>'city',''))>80 or length(coalesce(filters->>'country',''))>80 then
  raise exception 'Invalid property search' using errcode='22023';
 end if;
 with matched as (
  select i.* from public.property_inventory i
  where i.status='published'
   and (mode<>'buy' or i.listing_type='buy') and (mode<>'rent' or i.listing_type='rent')
   and (mode<>'new_launch' or (i.is_new_launch and i.listing_type='buy'))
   and (mode<>'commercial' or i.property_type='Commercial')
   and (mode<>'plots' or i.property_type='Plot')
   and (filters->>'type' is null or i.property_type=filters->>'type')
   and (filters->>'bedrooms' is null or
    (filters->>'bedrooms'='4+' and i.bedrooms>=4) or i.bedrooms::text=filters->>'bedrooms')
   and (filters->>'possession' is null or i.possession_status=filters->>'possession')
   and (cur is null or i.currency=cur)
   and (lo is null or i.price_amount>=lo) and (hi is null or i.price_amount<=hi)
 ), projects as (
  select p.id,p.slug,p.title,p.location,p.city,p.country,p.district,p.rera_id,p.developer,p.builder_name,
   p.official_source_url,p.lat,p.lng,p.final_score,
   count(i.id) as active_inventory_count,min(i.price_amount) as inventory_min_price,
   max(i.price_amount) as inventory_max_price,
   case when count(distinct i.currency)=1 then min(i.currency) end as inventory_currency,
   min(i.bedrooms) as beds,min(i.area_sqft) as sqft,
   case when count(distinct i.property_type)=1 then min(i.property_type) else 'Multiple unit types' end as property_type,
   max(i.published_at) as published_at,
   case when count(distinct i.possession_status)=1 then min(i.possession_status) end as possession_status,
   case when count(distinct i.area_basis)=1 then min(i.area_basis) end as area_basis,
   (select jsonb_agg(jsonb_build_object('id',m.id,'project_id',m.project_id,'media_type',m.media_type,
     'attribution',m.attribution,'is_primary',m.is_primary,'published_at',m.published_at))
    from public.property_published_media m where m.project_id=p.id and m.media_type='photo') as "publishedMedia"
  from public.properties p join matched i on i.project_id=p.id
  where coalesce(p.status,'')<>'archived' and p.slug is not null
   and (filters->'region' is null or filters->'region'='null'::jsonb or public.property_region_contains(filters->'region',p.lng::double precision,p.lat::double precision))
   and exists (select 1 from public.property_published_media m where m.project_id=p.id and m.media_type='photo')
   and (filters->>'query' is null or p.title ilike '%'||(filters->>'query')||'%'
    or p.location ilike '%'||(filters->>'query')||'%' or p.city ilike '%'||(filters->>'query')||'%'
    or p.district ilike '%'||(filters->>'query')||'%' or p.rera_id ilike '%'||(filters->>'query')||'%')
   and (filters->>'city' is null or p.city ilike '%'||(filters->>'city')||'%' or p.location ilike '%'||(filters->>'city')||'%')
   and (filters->>'country' is null or p.country ilike '%'||(filters->>'country')||'%')
  group by p.id
 ), selected as (
  select * from projects
  order by
   case when filters->>'sort'='price_low' then inventory_min_price end asc nulls last,
   case when filters->>'sort'='price_high' then inventory_max_price end desc nulls last,
   case when filters->>'sort'='ai' then final_score end desc nulls last,
   published_at desc nulls last,id desc
  limit 25 offset (page_num-1)*24
 ), numbered as (select *, row_number() over (order by
  case when filters->>'sort'='price_low' then inventory_min_price end asc nulls last,
  case when filters->>'sort'='price_high' then inventory_max_price end desc nulls last,
  case when filters->>'sort'='ai' then final_score end desc nulls last,published_at desc nulls last,id desc) as row_no from selected)
 select jsonb_build_object('items',coalesce(jsonb_agg(to_jsonb(n)-'row_no' order by row_no) filter(where row_no<=24),'[]'::jsonb),
  'hasNext',count(*)>24,'page',page_num) into result from numbered n;
 return result;
end;
$function$;

