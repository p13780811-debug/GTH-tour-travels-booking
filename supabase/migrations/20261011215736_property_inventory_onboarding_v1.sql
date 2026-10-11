alter table public.listing_submissions
  add column if not exists target_project_id bigint references public.properties(id) on delete restrict,
  add column if not exists registry_reference text,
  add column if not exists price_amount numeric(14,2),
  add column if not exists currency text not null default 'INR',
  add column if not exists bedrooms smallint,
  add column if not exists bathrooms smallint,
  add column if not exists area_sqft integer,
  add column if not exists submitter_role text;

alter table public.listing_submissions
  drop constraint if exists listing_submissions_price_amount_check,
  add constraint listing_submissions_price_amount_check check (price_amount is null or price_amount > 0),
  drop constraint if exists listing_submissions_currency_check,
  add constraint listing_submissions_currency_check check (currency ~ '^[A-Z]{3}$'),
  drop constraint if exists listing_submissions_bedrooms_check,
  add constraint listing_submissions_bedrooms_check check (bedrooms is null or bedrooms between 0 and 20),
  drop constraint if exists listing_submissions_bathrooms_check,
  add constraint listing_submissions_bathrooms_check check (bathrooms is null or bathrooms between 0 and 20),
  drop constraint if exists listing_submissions_area_sqft_check,
  add constraint listing_submissions_area_sqft_check check (area_sqft is null or area_sqft between 1 and 1000000),
  drop constraint if exists listing_submissions_submitter_role_check,
  add constraint listing_submissions_submitter_role_check check (submitter_role is null or submitter_role in ('owner','agent','developer','other')),
  drop constraint if exists listing_submissions_registry_reference_check,
  add constraint listing_submissions_registry_reference_check check (registry_reference is null or registry_reference ~ '^P[0-9]{11}$');

create index if not exists listing_submissions_target_project_idx
  on public.listing_submissions(target_project_id);

create table if not exists public.property_inventory (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.properties(id) on delete restrict,
  owner_id uuid not null,
  source_submission_id uuid unique references public.listing_submissions(id) on delete set null,
  listing_type text not null check (listing_type in ('buy','rent')),
  property_type text,
  bedrooms smallint check (bedrooms is null or bedrooms between 0 and 20),
  bathrooms smallint check (bathrooms is null or bathrooms between 0 and 20),
  area_sqft integer check (area_sqft is null or area_sqft between 1 and 1000000),
  price_amount numeric(14,2) check (price_amount is null or price_amount > 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  description text,
  submitter_role text check (submitter_role is null or submitter_role in ('owner','agent','developer','other')),
  status text not null default 'review' check (status in ('review','published','withdrawn')),
  verified boolean not null default false,
  source_type text not null default 'user_submission',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists property_inventory_project_status_idx
  on public.property_inventory(project_id, status, published_at desc);

create index if not exists property_inventory_owner_idx
  on public.property_inventory(owner_id, created_at desc);

alter table public.property_inventory enable row level security;

drop policy if exists "published inventory public read" on public.property_inventory;
create policy "published inventory public read"
on public.property_inventory
for select
to anon, authenticated
using (status = 'published');

revoke all on table public.property_inventory from anon, authenticated;
grant select on table public.property_inventory to anon, authenticated;
grant select, insert, update, delete on table public.property_inventory to service_role;

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

  select *
  into item
  from public.listing_submissions
  where id = submission_id
  for update;

  if not found or item.status <> 'review' then
    raise exception 'Submission unavailable';
  end if;

  if decision = 'approved' then
    if item.target_project_id is not null then
      select id
      into published_id
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
       or item.area_sqft is not null then
      insert into public.property_inventory(
        project_id, owner_id, source_submission_id,
        listing_type, property_type, bedrooms, bathrooms, area_sqft,
        price_amount, currency, description, submitter_role,
        status, verified, source_type, published_at
      )
      values (
        published_id, item.owner_id, item.id,
        item.listing_type, item.property_type, item.bedrooms, item.bathrooms, item.area_sqft,
        item.price_amount, item.currency, item.description, item.submitter_role,
        'published', false, 'user_submission', now()
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

revoke all on function public.review_listing_submission(uuid, text) from public, anon;
grant execute on function public.review_listing_submission(uuid, text) to authenticated, service_role;
