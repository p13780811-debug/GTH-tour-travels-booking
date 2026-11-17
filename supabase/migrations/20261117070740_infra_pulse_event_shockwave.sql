begin;
-- Public signals inherit existing property/tender RLS; no privileged lookups.
create function public.gth_geo_key(value text) returns text language sql immutable parallel safe set search_path='' as $$
 select lower(regexp_replace(btrim(coalesce(value,'')),'[[:space:]]+',' ','g'));
$$;
create function public.gth_country_key(value text) returns text language sql immutable parallel safe set search_path='' as $$
 select case upper(btrim(value)) when 'INDIA' then 'IN' when 'UNITED ARAB EMIRATES' then 'AE' when 'UAE' then 'AE'
 when 'UNITED KINGDOM' then 'GB' when 'UK' then 'GB' when 'UNITED STATES' then 'US' when 'USA' then 'US'
 when 'SINGAPORE' then 'SG' when 'FRANCE' then 'FR' when 'AUSTRALIA' then 'AU' when 'CANADA' then 'CA'
 else case when btrim(value) ~ '^[A-Za-z]{2}$' then upper(btrim(value)) else null end end;
$$;
create view public.gth_infra_pulse_matches_v1 with(security_invoker=true) as
 select p.id as property_id,t.id as tender_id,t.title,t.buyer as authority,t.deadline_at,t.region,
 case when public.gth_geo_key(t.region)=public.gth_geo_key(p.district) then 'district'
 when p.source_type is distinct from 'rera' and public.gth_geo_key(t.region)=public.gth_geo_key(p.city) then 'city'
 else 'region' end as match_scope
 from public.properties p join public.tenders t on t.country_code=public.gth_country_key(p.country)
 and public.gth_geo_key(t.region) not in ('','all','national','worldwide','unknown','n/a')
 and public.gth_geo_key(t.region)<>public.gth_geo_key(p.country) and (
 public.gth_geo_key(t.region)=public.gth_geo_key(p.state)
 or public.gth_geo_key(t.region)=public.gth_geo_key(p.district)
 or (p.source_type is distinct from 'rera' and public.gth_geo_key(t.region)=public.gth_geo_key(p.city)))
 where p.status is distinct from 'archived' and t.status='published' and t.is_public and t.source_verified
 and t.sector='works' and t.deadline_at>now();
revoke all on public.gth_infra_pulse_matches_v1 from public,anon,authenticated;
grant select on public.gth_infra_pulse_matches_v1 to anon,authenticated,service_role;
create function public.gth_read_infra_pulse(p_property_ids bigint[])
returns table(property_id bigint,total_count bigint,notices jsonb)
language sql stable security invoker set search_path='' as $$
 with ranked as (
 select m.*,count(*) over(partition by m.property_id) as n,
 row_number() over(partition by m.property_id order by m.deadline_at,m.tender_id) as position
 from public.gth_infra_pulse_matches_v1 m
 where cardinality(p_property_ids) between 1 and 24 and m.property_id=any(p_property_ids)
 ) select r.property_id,max(r.n),jsonb_agg(jsonb_build_object('id',r.tender_id,'title',r.title,'authority',r.authority,
 'deadline',r.deadline_at,'scope',r.match_scope,'region',r.region) order by r.deadline_at,r.tender_id)
 from ranked r where r.position<=5 group by r.property_id;
$$;
revoke all on function public.gth_read_infra_pulse(bigint[]) from public,anon,authenticated;
grant execute on function public.gth_read_infra_pulse(bigint[]) to anon,authenticated,service_role;
create index gth_infra_region_deadline_idx on public.tenders(country_code,public.gth_geo_key(region),deadline_at)
 where status='published' and is_public and source_verified and sector='works';
-- No existing role policy is weakened; contacts are service-only.
create table public.gth_intelligence_leads(
 id bigint generated always as identity primary key,
 request_id uuid not null unique,payload_hash char(64) not null check(payload_hash ~ '^[0-9a-f]{64}$'),
 lead_kind text not null check(lead_kind in ('infra','hospitality')),
 target_key varchar(100) not null check(target_key ~ '^(property:[1-9][0-9]*|stadium:[a-z0-9-]+|osm:(node|way|relation)-[1-9][0-9]*|attraction:Q[1-9][0-9]*)$'),
 property_id bigint references public.properties(id),
 currency char(3) not null check(currency in ('INR','USD','AED','GBP','EUR','SGD')),
 full_name varchar(150) not null check(length(btrim(full_name))>=2 and full_name !~ '[<>[:cntrl:]]'),
 email varchar(150) not null check(email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 phone_e164 varchar(16) not null check(phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
 services text[] not null check(cardinality(services) between 1 and 3 and services <@ array['investor_dossier','corporate_hospitality','group_transport','hotel_blocks']::text[]),
 group_size integer check(group_size between 1 and 5000),notes varchar(1000) not null default '' check(notes !~ '[<>[:cntrl:]]'),
 tender_ids uuid[] not null default '{}' check(cardinality(tender_ids)<=5),
 whatsapp_message varchar(2000) not null,
 consent_at timestamptz not null default now(),created_at timestamptz not null default now(),
 check((lead_kind='infra' and property_id is not null and services=array['investor_dossier']::text[]) or (lead_kind='hospitality' and property_id is null and not ('investor_dossier'=any(services))))
);
alter table public.gth_intelligence_leads enable row level security;
revoke all on public.gth_intelligence_leads from public,anon,authenticated;
revoke all on sequence public.gth_intelligence_leads_id_seq from public,anon,authenticated;
grant select,insert on public.gth_intelligence_leads to service_role;
grant usage,select on sequence public.gth_intelligence_leads_id_seq to service_role;
-- Compact, private staging. No raw source JSON, photos, payloads or public stub pages.
create table public.gth_official_registry_records(
 country_code char(2) not null check(country_code in ('IN','AE','GB')),
 authority varchar(24) not null check(authority in ('MAHARERA','DUBAI_DLD','HM_LAND_REGISTRY')),
 record_id varchar(80) not null check(record_id !~ '[<>[:cntrl:]]'),
 record_kind varchar(24) not null check(record_kind in ('project','sale_transaction')),
 project_name varchar(140) not null,district varchar(80),taluka varchar(80),locality varchar(120),postal_code varchar(16),
 source_url varchar(512) not null check(source_url ~ '^https://(www[.])?(maharera[.]maharashtra[.]gov[.]in|maharera[.]mahaonline[.]gov[.]in|dubailand[.]gov[.]ae|dubaipulse[.]gov[.]ae|gov[.]uk|landregistry[.]data[.]gov[.]uk|publicdata[.]landregistry[.]gov[.]uk)(/|$)'),
 license varchar(32) not null check(license in ('CC0-1.0','OGL-UK-3.0','ODC-BY-1.0','unconfirmed')),locality_evidence varchar(512),
 locality_verified boolean not null default false,rights_confirmed boolean not null default false,
 source_status varchar(32) not null check(source_status in ('historical_unverified','official_dataset')),
 indexable boolean generated always as (locality_verified and rights_confirmed and locality is not null and locality_evidence is not null and source_status='official_dataset') stored,
 imported_at timestamptz not null default now(),
 primary key(country_code,authority,record_id),
 check((project_name||coalesce(district,'')||coalesce(taluka,'')||coalesce(locality,'')||coalesce(postal_code,'')) !~ '[<>[:cntrl:]]'),
 check(not locality_verified or (rights_confirmed and license<>'unconfirmed' and source_status='official_dataset' and locality is not null and locality_evidence is not null)),
 check(source_status<>'historical_unverified' or (not locality_verified and not rights_confirmed)),
 check(octet_length(project_name||coalesce(district,'')||coalesce(taluka,'')||coalesce(locality,'')||coalesce(postal_code,'')||source_url||coalesce(locality_evidence,''))<=1400),
 check((authority='MAHARERA' and country_code='IN' and record_kind='project') or (authority='DUBAI_DLD' and country_code='AE' and record_kind='project') or (authority='HM_LAND_REGISTRY' and country_code='GB' and record_kind='sale_transaction'))
);
alter table public.gth_official_registry_records enable row level security;
revoke all on public.gth_official_registry_records from public,anon,authenticated;
grant select,insert on public.gth_official_registry_records to service_role;
create function public.gth_guard_registry_capacity() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(721804812);
 if pg_database_size(current_database())+octet_length(row_to_json(new)::text)*8>475000000 then
 raise exception 'Registry capacity reserve exceeded' using errcode='54000';end if;
 return new;
end;
$$;
revoke all on function public.gth_guard_registry_capacity() from public,anon,authenticated;
grant execute on function public.gth_guard_registry_capacity() to service_role;
create trigger gth_registry_capacity before insert on public.gth_official_registry_records for each row execute function public.gth_guard_registry_capacity();
-- The old unused contact skeleton has no public submission path in this repository.
do $$begin if to_regclass('public.contact_inquiries') is not null then
 revoke all on public.contact_inquiries from anon;
 end if;end;$$;
notify pgrst,'reload schema';
commit;
