alter table public.listing_submissions
  add column if not exists media_urls jsonb not null default '[]'::jsonb;

alter table public.property_inventory
  add column if not exists media_urls jsonb not null default '[]'::jsonb;

alter table public.listing_submissions
  drop constraint if exists listing_submissions_media_urls_check,
  add constraint listing_submissions_media_urls_check
  check (jsonb_typeof(media_urls) = 'array' and jsonb_array_length(media_urls) <= 8);

alter table public.property_inventory
  drop constraint if exists property_inventory_media_urls_check,
  add constraint property_inventory_media_urls_check
  check (jsonb_typeof(media_urls) = 'array' and jsonb_array_length(media_urls) <= 8);

alter table public.leads
  add column if not exists inventory_id uuid references public.property_inventory(id) on delete set null;

create index if not exists leads_inventory_id_idx
  on public.leads(inventory_id)
  where inventory_id is not null;


drop policy if exists "Allow uploads" on storage.objects;
drop policy if exists "authenticated property image uploads" on storage.objects;

create policy "authenticated property image uploads"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = 'properties'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

update storage.buckets
set file_size_limit = 8388608,
    allowed_mime_types = array['image/webp']::text[]
where id = 'property-images';

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
        status, verified, source_type, media_urls, published_at
      )
      values (
        published_id, item.owner_id, item.id,
        item.listing_type, item.property_type, item.bedrooms, item.bathrooms, item.area_sqft,
        item.price_amount, item.currency, item.description, item.submitter_role,
        'published', false, 'user_submission', item.media_urls, now()
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
