-- Partner/developer onboarding. Additive: no changes to existing real estate, travel or tender data.
create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  application_type text not null check (application_type in ('developer','agent','travel_supplier','affiliate','general')),
  contact_name text not null check (char_length(contact_name) between 2 and 100),
  contact_email text not null check (char_length(contact_email) between 5 and 254),
  organisation text check (organisation is null or char_length(organisation) <= 160),
  website text check (website is null or char_length(website) <= 500),
  project_url text check (project_url is null or char_length(project_url) <= 500),
  country text check (country is null or char_length(country) <= 100),
  message text not null check (char_length(message) between 15 and 3000),
  consent_to_contact boolean not null default false check (consent_to_contact = true),
  status text not null default 'new' check (status in ('new','reviewing','closed')),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists partner_applications_review_queue_idx
  on public.partner_applications(status, submitted_at desc);
alter table public.partner_applications enable row level security;
revoke all on public.partner_applications from public, anon, authenticated;
grant select, update on public.partner_applications to authenticated;
drop policy if exists "Admin reads partner applications" on public.partner_applications;
drop policy if exists "Admin updates partner applications" on public.partner_applications;
create policy "Admin reads partner applications" on public.partner_applications
  for select to authenticated using ((auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy "Admin updates partner applications" on public.partner_applications
  for update to authenticated
  using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');
comment on table public.partner_applications is
  'Private prospective partner, developer, agent and business enquiries. Inserts only through rate-limited server API. No public read or direct write.';
