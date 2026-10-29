-- Extends only the disposable CI scaffolding to match deployed enquiry/auth columns.
alter table auth.users add column email text,add column aud text,add column role text;
create table public.property_leads(
 id bigint generated always as identity primary key,legacy_lead_id bigint references public.leads(id),
 property_id bigint references public.properties(id),project_name varchar(180) not null,full_name varchar(100) not null,
 phone varchar(40) not null,email varchar(254),preferred_unit varchar(80),budget_range varchar(120),intent_type varchar(50),
 status varchar(30) not null default 'new' check(status in ('new','contacted','qualified','viewing','closed_won','closed_lost','spam')),
 request_id uuid,consent_at timestamptz,created_at timestamptz not null default now()
);
alter table public.property_leads enable row level security;
grant select on public.property_leads to authenticated;
create policy enquiry_admin_read on public.property_leads for select to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin');
