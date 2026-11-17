-- Disposable local PG17 test after the existing GTH Hybrid security fixtures.
reset role;
insert into public.global_registry_projects(
 country_code,region_state,city,registry_authority,registration_id,project_name,submitted_by)
values
 ('IN','MH','Mumbai','MAHARERA','P51800012345','Registry One','11111111-1111-4111-8111-111111111111'),
 ('US','California','Los Angeles','COUNTY_ASSESSOR','APN-123','Registry Two','22222222-2222-4222-8222-222222222222');

do $$begin
 if not exists(select 1 from pg_class where oid='public.global_registry_projects'::regclass and relrowsecurity) then raise exception 'GLOBAL_REGISTRY_RLS_DISABLED';end if;
 if has_table_privilege('anon','public.global_registry_projects','SELECT')
   or has_table_privilege('authenticated','public.global_registry_projects','INSERT')
   or has_table_privilege('authenticated','public.global_registry_projects','UPDATE')
   or has_table_privilege('authenticated','public.global_registry_projects','DELETE')
   then raise exception 'REGISTRY_UNTRUSTED_PERMISSION';end if;
 if not has_table_privilege('service_role','public.global_registry_projects','INSERT') then raise exception 'SERVER_ONLY_GRANT_MISSING';end if;
 if not has_column_privilege('authenticated','public.listing_submissions','global_registry_id','INSERT') then raise exception 'OWNER_ATTACH_COLUMN_MISSING';end if;
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
do $$begin
 if (select count(*) from public.global_registry_projects)<>1 then raise exception 'REGISTRY_OWNER_PRIVATE_READ_BROKEN';end if;
 if exists(select 1 from public.global_registry_projects where country_code='US') then raise exception 'CROSS_OWNER_STUB_LEAK';end if;
 begin
   insert into public.global_registry_projects(
    country_code,region_state,city,registry_authority,registration_id,project_name)
   values('IN','MH','Mumbai','GLOBAL_UNLISTED','PERMIT-345','Unauthorized row');
   raise exception 'CLIENT_CAN_INSERT_REGISTRY';
 exception when insufficient_privilege then null;end;
 begin
   update public.global_registry_projects set verification_status='verified' where country_code='IN';
   raise exception 'CLIENT_CAN_FAKE_VERIFICATION';
 exception when insufficient_privilege then null;end;
end $$;
insert into public.listing_submissions(title,country,city,location,description,property_type,listing_type,global_registry_id)
values('My worldwide submission','India','Mumbai','Andheri','A factual description for approved independent moderation',
 'Apartment','buy',1);
do $$begin
 if not exists(select 1 from public.listing_submissions where global_registry_id=1 and owner_id=auth.uid() and status='review') then raise exception 'OWNER_STUB_LINK_FAILED';end if;
 begin
   insert into public.listing_submissions(title,country,city,location,description,property_type,listing_type,global_registry_id)
   values('Wrong worldwide submission','US','Los Angeles','Other place','A factual description for separate independent moderation',
   'Apartment','buy',2);
   raise exception 'CROSS_OWNER_LINK_ALLOWED';
 exception when insufficient_privilege or check_violation then null;end;
end $$;
reset role;
do $$begin
 if (select count(*) from public.global_registry_projects where verification_status='pending_global_review')<>2 then raise exception 'PENDING_VERIFICATION_STATE_CHANGED';end if;
 if (select count(*) from public.listing_submissions where global_registry_id=2 and owner_id='11111111-1111-4111-8111-111111111111')<>0 then raise exception 'CROSS_OWNER_SUBMISSION_WRITTEN';end if;
end $$;
