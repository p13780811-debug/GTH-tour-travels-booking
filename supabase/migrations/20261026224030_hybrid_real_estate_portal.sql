-- Additive portal upgrade; existing registry, enquiry and media pipelines remain.
begin;
alter table public.listing_submissions
 add column if not exists possession_status text check (possession_status in ('ready_to_move','under_construction','off_plan')),
 add column if not exists is_new_launch boolean not null default false,
 add column if not exists agent_registration text check(agent_registration is null or length(agent_registration) between 3 and 80),
 add column if not exists media_rights_confirmed boolean not null default false,
 add column if not exists area_basis text check (area_basis in ('carpet','built_up','plot'));
alter table public.property_inventory
 add column if not exists possession_status text check (possession_status in ('ready_to_move','under_construction','off_plan')),
 add column if not exists is_new_launch boolean not null default false,
 add column if not exists area_basis text check (area_basis in ('carpet','built_up','plot'));
create or replace function public.review_listing_submission(submission_id uuid, decision text)
returns bigint
language plpgsql
security definer
set search_path to ''
as $function$
declare
  item public.listing_submissions;
  published_id bigint;
begin
  if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'role','') <> 'admin' then
    raise exception 'Administrator required';
  end if;
  if decision not in ('approved','rejected') then
    raise exception 'Invalid decision';
  end if;

  select * into item
  from public.listing_submissions
  where id = submission_id
  for update;

  if not found or item.status <> 'review' then
    raise exception 'Submission unavailable';
  end if;

  if decision = 'approved' then
    if item.target_project_id is not null then
      select id into published_id
      from public.properties
      where id = item.target_project_id
        and source_type = 'registry';
      if published_id is null then
        raise exception 'Registry project unavailable';
      end if;
    else
      insert into public.properties(
        title, slug, country, city, location, description,
        property_type, listing_type, status, verified,
        source_type, ingestion_source
      )
      values (
        item.title, 'listing-' || item.id::text, item.country, item.city, item.location, item.description,
        item.property_type, item.listing_type, 'listed', false,
        'owner', 'Owner submission'
      )
      returning id into published_id;
    end if;

    if item.target_project_id is not null
       or item.price_amount is not null
       or item.bedrooms is not null
       or item.bathrooms is not null
       or item.area_sqft is not null
       or jsonb_array_length(item.media_urls) > 0 then
      insert into public.property_inventory(
        project_id, owner_id, source_submission_id,
        listing_type, property_type, bedrooms, bathrooms, area_sqft,
        price_amount, currency, description, submitter_role,
        status, verified, source_type, media_urls, published_at, possession_status, is_new_launch, area_basis
      )
      values (
        published_id, item.owner_id, item.id,
        item.listing_type, item.property_type, item.bedrooms, item.bathrooms, item.area_sqft,
        item.price_amount, item.currency, item.description, item.submitter_role,
        'published', false, 'user_submission', item.media_urls, now(), item.possession_status, item.is_new_launch, item.area_basis
      );
    end if;
  end if;

  update public.listing_submissions
  set status = decision,
      property_id = published_id,
      reviewed_at = now()
  where id = item.id;

  return published_id;
end;
$function$;

-- Never expose full submission evidence or contact data through this RPC.
-- The invoker sees only RLS-readable published inventory and independently approved photos.
create or replace function public.search_hybrid_properties(filters jsonb default '{}'::jsonb)
returns jsonb language plpgsql stable security invoker set search_path='' as $fn$
declare
 mode text := coalesce(filters->>'mode','buy');
 page_num integer := coalesce((filters->>'page')::integer,1);
 lo numeric := (filters->>'minPrice')::numeric;
 hi numeric := (filters->>'maxPrice')::numeric;
 cur text := filters->>'currency';
 result jsonb;
begin
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
$fn$;
revoke all on function public.search_hybrid_properties(jsonb) from public;
grant execute on function public.search_hybrid_properties(jsonb) to anon,authenticated;

-- Owner photos use the same published-media gate, with separate rights review.
-- Claim-backed records and their existing takedown function remain unchanged.
alter table public.property_published_media alter column claim_media_id drop not null;
alter table public.property_published_media
 add column if not exists source_submission_id uuid references public.listing_submissions(id),
 add column if not exists submission_media_index smallint,
 add constraint property_media_exact_source check (
  (claim_media_id is not null and source_submission_id is null and submission_media_index is null)
  or (claim_media_id is null and source_submission_id is not null and submission_media_index is not null and submission_media_index between 0 and 7));
create unique index property_submission_media_unique on public.property_published_media(source_submission_id,submission_media_index)
 where source_submission_id is not null;

-- Keep the previously reviewed claim predicate byte-for-byte in the first branch.
create or replace function public.is_property_media_public(p_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists (
   select 1 from public.property_published_media p
   join public.property_claim_media m on m.id=p.claim_media_id
   join public.property_project_claims c on c.id=m.claim_id
   join public.properties project on project.id=p.project_id
   where p.id=p_id and p.status='published'
     and m.status='approved' and c.status='approved'
     and m.project_id=p.project_id and c.project_id=p.project_id
     and project.rera_id=c.rera_reference and project.source_type='registry'
     and m.reviewed_by is not null and m.reviewed_at is not null
     and m.reviewed_by<>m.uploader_id
 ) or exists (
  select 1 from public.property_published_media p
  join public.listing_submissions s on s.id=p.source_submission_id
  join public.properties project on project.id=p.project_id
  where p.id=p_id and p.status='published' and p.claim_media_id is null and p.media_type='photo'
   and s.status='approved' and s.media_rights_confirmed and s.property_id=p.project_id and p.published_by<>s.owner_id
   and coalesce(project.status,'')<>'archived'
   and jsonb_typeof(s.media_urls)='array' and s.media_urls->>p.submission_media_index is not null
   and exists(select 1 from public.property_inventory i where i.source_submission_id=s.id and i.status='published')
 );
$$;

create or replace function public.manage_submission_media_publication(p_submission uuid,p_index integer,p_action text,p_notes text)
returns uuid language plpgsql security definer set search_path='' as $$
declare s public.listing_submissions; existing_id uuid;
begin
 if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'role','')<>'admin' then raise exception 'Administrator required'; end if;
 if p_action not in ('publish','take_down') or p_notes is null or length(btrim(p_notes))<20 or length(p_notes)>1000 or p_index<0 or p_index>7 then raise exception 'Documented decision required'; end if;
 select * into s from public.listing_submissions where id=p_submission for update;
 if not found or s.status<>'approved' or not s.media_rights_confirmed or s.property_id is null or s.owner_id=auth.uid()
  or jsonb_typeof(s.media_urls)<>'array' or s.media_urls->>p_index is null then raise exception 'Independent review required'; end if;
 select id into existing_id from public.property_published_media where source_submission_id=s.id and submission_media_index=p_index for update;
 if p_action='take_down' then
  update public.property_published_media set status='taken_down',taken_down_at=now(),takedown_by=auth.uid(),takedown_notes=btrim(p_notes),is_primary=false where id=existing_id;
  if existing_id is null then raise exception 'Publication unavailable'; end if;
  return existing_id;
 end if;
 if not exists(select 1 from public.property_inventory where source_submission_id=s.id and status='published') then raise exception 'Published inventory required'; end if;
 if existing_id is null then
  insert into public.property_published_media(project_id,source_submission_id,submission_media_index,media_type,attribution,published_by,publication_notes)
  values(s.property_id,s.id,p_index,'photo','Owner-authorized property photograph',auth.uid(),btrim(p_notes)) returning id into existing_id;
 else
  update public.property_published_media set status='published',published_by=auth.uid(),published_at=now(),publication_notes=btrim(p_notes),taken_down_at=null,takedown_by=null,takedown_notes=null where id=existing_id;
 end if;
 return existing_id;
end;
$$;
revoke all on function public.manage_submission_media_publication(uuid,integer,text,text) from public,anon;
grant execute on function public.manage_submission_media_publication(uuid,integer,text,text) to authenticated;
-- Public grants remain column-scoped; private submission identifiers are not exposed.
notify pgrst,'reload schema';
commit;
