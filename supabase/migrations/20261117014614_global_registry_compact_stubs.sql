-- Worldwide registry stub fabric: additive, private, bounded; never a raw scrape dump.
-- Prepared migration only; apply after a reviewed staging DB/RLS/security audit.
begin;

create type public.global_registry_verification_status as enum
  ('verified', 'pending_global_review', 'official_synced');

create table public.global_registry_projects (
  id bigint generated always as identity primary key,
  country_code varchar(2) not null check (country_code ~ '^[A-Z]{2}$'),
  region_state varchar(64) not null check (octet_length(region_state) between 2 and 64),
  city varchar(64) not null check (octet_length(city) between 2 and 64),
  registry_authority varchar(32) not null check (registry_authority ~ '^[A-Z0-9][A-Z0-9_/-]{2,31}$'),
  registration_id varchar(80) not null check (registration_id ~ '^[A-Z0-9][A-Z0-9./_-]{2,79}$'),
  project_name varchar(120) not null check (octet_length(project_name) between 3 and 120),
  developer_name varchar(100) check (developer_name is null or octet_length(developer_name) between 2 and 100),
  postal_code varchar(16) check (postal_code is null or postal_code ~ '^[A-Za-z0-9 -]{2,16}$'),
  lat real check (lat between -90 and 90),
  lng real check (lng between -180 and 180),
  verification_status public.global_registry_verification_status not null default 'pending_global_review',
  updated_at timestamptz not null default now(),
  submitted_by uuid references auth.users(id) on delete set null,
  constraint global_registry_coordinate_pair check ((lat is null) = (lng is null)),
  constraint global_registry_text_budget check (
    octet_length(country_code || region_state || city || registry_authority ||
      registration_id || project_name || coalesce(developer_name,'') ||
      coalesce(postal_code,'')) <= 220
  ),
  constraint global_registry_unique_reference unique (country_code, registry_authority, registration_id)
);

comment on table public.global_registry_projects is
  'Compact, private project registration stubs; user submissions stay pending until independently reviewed. Not legal title or published inventory.';

alter table public.global_registry_projects enable row level security;
revoke all on table public.global_registry_projects from public, anon, authenticated;
grant select on table public.global_registry_projects to authenticated;
grant select, insert, update, delete on table public.global_registry_projects to service_role;

create policy "global registry private submitter read" on public.global_registry_projects
  for select to authenticated
  using (submitted_by = (select auth.uid()));
-- No authenticated INSERT, UPDATE or DELETE policies; server-only service role writes.

alter table public.listing_submissions
  add column if not exists global_registry_id bigint references public.global_registry_projects(id);
create index if not exists listing_submissions_global_registry_idx
  on public.listing_submissions (global_registry_id)
  where global_registry_id is not null;

grant insert (global_registry_id) on table public.listing_submissions to authenticated;

-- Preserve existing owner and pending-review requirements while constraining
-- linked registrations to the user's own submitted stub.
drop policy if exists submission_insert on public.listing_submissions;
create policy submission_insert on public.listing_submissions
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and status = 'review'
    and property_id is null
    and reviewed_at is null
    and (
      global_registry_id is null
      or exists (
        select 1 from public.global_registry_projects registry
        where registry.id = listing_submissions.global_registry_id
          and registry.submitted_by = (select auth.uid())
      )
    )
  );

notify pgrst, 'reload schema';
commit;
