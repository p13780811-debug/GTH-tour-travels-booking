-- Private NRI investor intake: additive only. No public or user-level direct writes.
begin;
alter table public.property_leads
 add column if not exists lead_priority text not null default 'STANDARD',
 add column if not exists international_phone text,
 add column if not exists investor_corridor text,
 add column if not exists investor_currency text,
 add column if not exists investor_notes text;
-- Avoid a table rewrite on existing leads; constrain only the newly created rows.
alter table public.property_leads drop constraint if exists property_leads_lead_priority_check;
alter table public.property_leads add constraint property_leads_lead_priority_check
 check (lead_priority in ('STANDARD','NRI_HIGH_VALUE')) not valid;

create table if not exists public.property_nri_inquiries (
 id bigint generated always as identity primary key,
 request_id uuid not null unique,
 property_id bigint references public.properties(id) on delete set null,
 full_name varchar(150) not null check (octet_length(full_name) between 2 and 150),
 email varchar(150) not null check (octet_length(email) between 5 and 150),
 phone_e164 varchar(16) not null check (phone_e164 ~ '^[+][1-9][0-9]{7,14}),
 investor_corridor varchar(30) not null check (investor_corridor in ('mmr','kolkata','dubai','london','global')),
 investor_currency varchar(3) not null check (investor_currency in ('INR','USD','AED','GBP','EUR','SGD')),
 lead_priority text not null default 'NRI_HIGH_VALUE' check (lead_priority='NRI_HIGH_VALUE'),
 consent_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
alter table public.property_nri_inquiries enable row level security;
revoke all on table public.property_nri_inquiries from public, anon, authenticated;
grant select, insert on table public.property_nri_inquiries to service_role;
-- Identity sequences are also accessible through service_role during POST.
do $$ declare seq_name text; begin
 seq_name:=pg_get_serial_sequence('public.property_nri_inquiries','id');
 if seq_name is not null then execute format('grant usage,select on sequence %s to service_role',seq_name); end if;
end $$;
notify pgrst,'reload schema';
commit;
),
 investor_corridor varchar(30) not null check (investor_corridor in ('mmr','kolkata','dubai','london','global')),
 investor_currency varchar(3) not null check (investor_currency in ('INR','USD','AED','GBP','EUR','SGD')),
 lead_priority text not null default 'NRI_HIGH_VALUE' check (lead_priority='NRI_HIGH_VALUE'),
 consent_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
alter table public.property_nri_inquiries enable row level security;
revoke all on table public.property_nri_inquiries from public, anon, authenticated;
grant select, insert on table public.property_nri_inquiries to service_role;
-- Identity sequences are also accessible through service_role during POST.
do $$ declare seq_name text; begin
 seq_name:=pg_get_serial_sequence('public.property_nri_inquiries','id');
 if seq_name is not null then execute format('grant usage,select on sequence %s to service_role',seq_name); end if;
end $$;
notify pgrst,'reload schema';
commit;
