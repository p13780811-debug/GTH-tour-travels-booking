-- Isolated test scaffolding only; no production data or credentials.
alter table public.properties alter column rera_id drop not null;
alter table public.properties add column slug text, add column location text, add column city text,
 add column country text, add column district text, add column developer text, add column builder_name text,
 add column official_source_url text, add column lat numeric, add column lng numeric, add column final_score numeric,
 add column property_type text, add column listing_type text, add column status text,
 add column verified boolean, add column description text, add column ingestion_source text;
create sequence public.hybrid_test_property_id_seq start 100;
alter table public.properties alter column id set default nextval('public.hybrid_test_property_id_seq');
create table public.listing_submissions (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id),
 title text,country text,city text,location text,description text,property_type text,listing_type text,
 status text not null default 'review',property_id bigint references public.properties(id),reviewed_at timestamptz
);
alter table public.listing_submissions enable row level security;
create policy owner_read on public.listing_submissions for select to authenticated using(owner_id=auth.uid());
grant select on public.listing_submissions to authenticated;
create table public.leads(id bigint generated always as identity primary key);
grant usage on schema auth,public to anon;
grant select on public.properties to anon;
-- Mirror deployed column privileges and owner-only pending submission policy.
create policy submission_insert on public.listing_submissions for insert to authenticated
 with check(owner_id=(select auth.uid()) and status='review' and property_id is null and reviewed_at is null);
grant insert(title,country,city,location,description,property_type,listing_type) on public.listing_submissions to authenticated;
create table public.cities(id bigint primary key,name text not null);
insert into public.cities values(1,'Public city fixture');
grant all on public.cities to anon,authenticated,service_role;
