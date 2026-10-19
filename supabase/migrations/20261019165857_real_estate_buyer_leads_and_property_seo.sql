-- Additive buyer capture. Browser roles cannot insert/read private contact records.
begin;
alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads add constraint leads_source_check check(source in
 ('property_enquiry','partner_referral','manual','registry_project_interest','inventory_enquiry'));

create table public.property_leads (
 id bigint generated always as identity primary key,
 legacy_lead_id bigint unique references public.leads(id) on delete set null,
 property_id bigint not null references public.properties(id),
 project_name varchar(255) not null,
 full_name varchar(150) not null check(char_length(btrim(full_name)) between 2 and 150),
 phone varchar(20) not null check(phone ~ '^[6-9][0-9]{9}$'),
 email varchar(150),
 preferred_unit varchar(50) not null default '2 BHK' check(preferred_unit in ('Not decided','1 BHK','2 BHK','3 BHK','4 BHK','5+ BHK','Commercial')),
 budget_range varchar(50),
 intent_type varchar(30) not null check(intent_type in ('brochure_download','site_visit','pricing_enquiry')),
 status varchar(30) not null default 'new' check(status in ('new','contacted','qualified','viewing','closed_won','closed_lost','spam')),
 request_id uuid not null unique,
 consent_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create index property_leads_property_idx on public.property_leads(property_id);
create index property_leads_phone_idx on public.property_leads(phone);
create index property_leads_created_idx on public.property_leads(created_at desc);
alter table public.property_leads enable row level security;
revoke all on public.property_leads from public,anon,authenticated;
grant select on public.property_leads to authenticated;
grant select,insert,update on public.property_leads to service_role;
revoke all on sequence public.property_leads_id_seq from public,anon,authenticated;
grant usage,select on sequence public.property_leads_id_seq to service_role;
create policy "Administrator reads buyer enquiries" on public.property_leads for select to authenticated
 using (((select auth.jwt())->'app_metadata'->>'role')='admin');

create table public.property_documents (
 id bigint generated always as identity primary key,
 property_id bigint not null references public.properties(id),
 kind text not null check(kind in ('brochure','floor_plan')),
 title varchar(150) not null check(char_length(btrim(title)) between 3 and 150),
 url text not null check(url ~* '^https://[^ /?#]+/[^#]*\.pdf([?][^#]*)?$' and char_length(url)<=2048),
 source_url text not null check(source_url ~* '^https://[^ /?#]+' and char_length(source_url)<=2048),
 permission_reference text not null check(char_length(btrim(permission_reference)) between 5 and 500),
 rights_verified boolean not null default false,
 is_public boolean not null default false,
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 check(not is_public or (rights_verified and reviewed_at is not null))
);
create index property_documents_project_idx on public.property_documents(property_id) where is_public and rights_verified;
alter table public.property_documents enable row level security;
revoke all on public.property_documents from public,anon,authenticated;
grant select(id,property_id,kind,title,url,source_url,rights_verified,is_public,reviewed_at,created_at) on public.property_documents to anon,authenticated;
grant insert,update,delete on public.property_documents to authenticated;
grant all on public.property_documents to service_role;
revoke all on sequence public.property_documents_id_seq from public,anon,authenticated;
grant usage,select on sequence public.property_documents_id_seq to authenticated,service_role;
create policy "Read approved project PDFs" on public.property_documents for select to anon,authenticated
 using (is_public and rights_verified and reviewed_at is not null);
create policy "Administrator manages project PDFs" on public.property_documents for all to authenticated
 using (((select auth.jwt())->'app_metadata'->>'role')='admin')
 with check (((select auth.jwt())->'app_metadata'->>'role')='admin');

create function public.gth_capture_property_lead(
 p_property_id bigint,p_full_name text,p_phone text,p_email text,p_preferred_unit text,
 p_budget_range text,p_intent_type text,p_request_id uuid
) returns table(result_id bigint,created boolean)
language plpgsql security invoker set search_path='' as $$
declare project_title text; project_source text; new_id bigint; crm_id bigint; previous public.property_leads%rowtype;
begin
 if p_property_id is null or p_request_id is null or p_phone is null or p_phone !~ '^[6-9][0-9]{9}$'
  or p_full_name is null or char_length(btrim(p_full_name)) not between 2 and 150 or p_full_name ~ '[<>[:cntrl:]]'
  or (p_email is not null and (char_length(p_email)>150 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'))
  or p_preferred_unit is null or p_preferred_unit not in ('Not decided','1 BHK','2 BHK','3 BHK','4 BHK','5+ BHK','Commercial')
  or (p_budget_range is not null and p_budget_range not in ('Not decided','Under ₹50 lakh','₹50 lakh–₹1 crore','₹1–₹2 crore','₹2–₹5 crore','Above ₹5 crore'))
  or p_intent_type is null or p_intent_type not in ('brochure_download','site_visit','pricing_enquiry')
 then raise exception 'Invalid buyer enquiry' using errcode='22023'; end if;
 select left(p.title,255),case when p.rera_id is not null then 'registry_project_interest' else 'property_enquiry' end
 into project_title,project_source from public.properties p
 where p.id=p_property_id and p.status is distinct from 'archived';
 if not found then raise exception 'Project unavailable' using errcode='P0002'; end if;
 insert into public.property_leads(property_id,project_name,full_name,phone,email,preferred_unit,budget_range,intent_type,request_id)
 values(p_property_id,project_title,btrim(p_full_name),p_phone,p_email,p_preferred_unit,p_budget_range,p_intent_type,p_request_id)
 on conflict(request_id) do nothing returning id into new_id;
 if new_id is null then
  select * into previous from public.property_leads where request_id=p_request_id;
  if previous.property_id is distinct from p_property_id or previous.phone is distinct from p_phone
   or previous.intent_type is distinct from p_intent_type then
   raise exception 'Conflicting request' using errcode='22023';
  end if;
  return query select previous.id,false; return;
 end if;
 insert into public.leads(property_id,phone,source,status,consent_at)
 values(p_property_id,p_phone,project_source,'new',now()) returning id into crm_id;
 update public.property_leads set legacy_lead_id=crm_id where id=new_id;
 return query select new_id,true;
end;
$$;
revoke all on function public.gth_capture_property_lead(bigint,text,text,text,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.gth_capture_property_lead(bigint,text,text,text,text,text,text,uuid) to service_role;

-- Registered project profiles can be indexed without claiming available inventory.
create view public.gth_seo_properties_v1 with(security_invoker=true) as
 select id,title,slug,city,district,rera_id,official_source_url,source_type,status,created_at
 from public.properties
 where status is distinct from 'archived' and char_length(btrim(title))>=3
  and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug)<=160
  and rera_id ~ '^P[0-9]{11}$'
  and official_source_url ~* '^https://(www\.)?(maharera\.maharashtra\.gov\.in|maharera\.mahaonline\.gov\.in)(/|$)';
revoke all on public.gth_seo_properties_v1 from public,anon,authenticated;
grant select on public.gth_seo_properties_v1 to anon,authenticated;
commit;
