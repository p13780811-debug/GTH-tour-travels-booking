-- Additive NRI lead metadata; existing domestic lead capture remains unchanged.
alter table public.property_leads add column if not exists lead_priority text not null default 'STANDARD'
 check (lead_priority in ('STANDARD','NRI_HIGH_VALUE'));
alter table public.property_leads add column if not exists international_phone text;
alter table public.property_leads add column if not exists investor_corridor text;
alter table public.property_leads add column if not exists investor_currency text;
alter table public.property_leads add column if not exists investor_notes text;
-- International enquiries have a separate restricted table because the existing
-- property_leads.phone CHECK only permits 10-digit Indian mobile numbers.
create table if not exists public.property_nri_inquiries (
 id bigint generated always as identity primary key,
 request_id uuid not null unique,
 property_id bigint references public.properties(id),
 full_name varchar(150) not null,
 email varchar(150) not null,
 phone_e164 varchar(16) not null check (phone_e164 ~ '^[+][1-9][0-9]{7,14}),
 investor_corridor varchar(30) not null,
 investor_currency varchar(3) not null,
 lead_priority text not null default 'NRI_HIGH_VALUE' check(lead_priority='NRI_HIGH_VALUE'),
 consent_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
alter table public.property_nri_inquiries enable row level security;
revoke all on public.property_nri_inquiries from public,anon,authenticated;
grant select,insert on public.property_nri_inquiries to service_role;
grant usage,select on sequence public.property_nri_inquiries_id_seq to service_role;
),
 investor_corridor varchar(30) not null,
 investor_currency varchar(3) not null,
 lead_priority text not null default 'NRI_HIGH_VALUE' check(lead_priority='NRI_HIGH_VALUE'),
 consent_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
alter table public.property_nri_inquiries enable row level security;
revoke all on public.property_nri_inquiries from public,anon,authenticated;
grant select,insert on public.property_nri_inquiries to service_role;
grant usage,select on sequence public.property_nri_inquiries_id_seq to service_role;
