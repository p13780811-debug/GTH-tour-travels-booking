set role anon;
do $$
declare n bigint; notices jsonb;
begin
 select total_count,r.notices into n,notices from public.gth_read_infra_pulse(array[1]::bigint[]) r;
 if n<>2 then raise exception 'Wrong exact geography/active/source/sector count: %',n;end if;
 if exists(select 1 from jsonb_array_elements(notices) e where e->>'id'='33333333-3333-4333-8333-333333333333') then raise exception 'Hardcoded legacy city matched';end if;
 if exists(select 1 from public.gth_read_infra_pulse(array[3]::bigint[])) then raise exception 'View bypassed property RLS';end if;
 if has_table_privilege('anon','public.gth_intelligence_leads','SELECT') or has_table_privilege('authenticated','public.gth_intelligence_leads','INSERT') then raise exception 'Contact grant leaked';end if;
 if has_table_privilege('anon','public.gth_official_registry_records','SELECT') then raise exception 'Private stub grant leaked';end if;
 if has_sequence_privilege('anon','public.gth_intelligence_leads_id_seq','USAGE') then raise exception 'Contact sequence leaked';end if;
end $$;
reset role;
do $$
begin
 if exists(select 1 from pg_proc where proname='gth_read_infra_pulse' and prosecdef) then raise exception 'Privileged read function';end if;
 if (select count(*) from pg_class where relname in ('gth_intelligence_leads','gth_official_registry_records') and relrowsecurity)<>2 then raise exception 'Missing RLS';end if;
end $$;
set role service_role;
insert into public.gth_official_registry_records(country_code,authority,record_id,record_kind,project_name,source_url,license,source_status)
values('IN','MAHARERA','P00000000001','project','Disposable test record','https://maharera.maharashtra.gov.in/','unconfirmed','historical_unverified');
do $$
begin
 if exists(select 1 from public.gth_official_registry_records where indexable) then raise exception 'Unverified stub became indexable';end if;
 begin
  insert into public.gth_intelligence_leads(request_id,payload_hash,lead_kind,target_key,property_id,currency,full_name,email,phone_e164,services,whatsapp_message)
  values('11111111-1111-4111-8111-111111111111',repeat('a',64),'infra','property:1',1,'INR','Test person','test@example.invalid','+919999999999',array['investor_dossier'],'Disposable test message');
 exception when others then raise exception 'Service-only lead insert failed';end;
end $$;
reset role;
