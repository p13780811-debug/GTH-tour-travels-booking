-- Disposable database regression; fixtures never touch production.
reset role;
set role anon;
do $$begin
 if (select count(*) from public.cities)<>1 then raise exception 'CITY_READ_BROKEN';end if;
 if has_table_privilege('public.cities','INSERT') or has_table_privilege('public.cities','UPDATE')
  or has_table_privilege('public.cities','DELETE') or has_table_privilege('public.cities','TRUNCATE') then raise exception 'ANON_CITY_WRITE';end if;
 if has_any_column_privilege('public.listing_submissions','INSERT') then raise exception 'ANON_SUBMISSION_WRITE';end if;
end $$;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claims','{"app_metadata":{"role":"user"}}',false);
insert into public.listing_submissions(title,country,city,location,description,property_type,listing_type,
 target_project_id,registry_reference,price_amount,currency,bedrooms,bathrooms,area_sqft,submitter_role,
 media_urls,possession_status,is_new_launch,agent_registration,media_rights_confirmed,area_basis)
values('Owner permission regression','India','Mumbai','Andheri','Owner-submitted facts awaiting administrator review',
 'Apartment','buy',42,'P51800002057',10000000,'INR',2,2,750,'owner','[]','under_construction',true,null,false,'carpet');
do $$begin
 if not exists(select 1 from public.listing_submissions where title='Owner permission regression' and owner_id=auth.uid() and status='review' and property_id is null and reviewed_at is null) then raise exception 'OWNER_SUBMISSION_MISSING';end if;
 if has_table_privilege('public.cities','INSERT') or has_table_privilege('public.cities','UPDATE') or has_table_privilege('public.cities','DELETE') or has_table_privilege('public.cities','TRUNCATE') then raise exception 'SIGNED_IN_CITY_WRITE';end if;
 if has_column_privilege('public.listing_submissions','owner_id','INSERT') or has_column_privilege('public.listing_submissions','status','INSERT') or has_column_privilege('public.listing_submissions','property_id','INSERT') or has_column_privilege('public.listing_submissions','reviewed_at','INSERT') then raise exception 'MODERATION_FIELDS_WRITABLE';end if;
 begin
  insert into public.listing_submissions(title,status) values('Forbidden publication','approved');
  raise exception 'SELF_PUBLISH_ALLOWED';
 exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$begin
 if exists(select 1 from public.listing_submissions where title='Owner permission regression') then raise exception 'CROSS_OWNER_SUBMISSION_LEAK';end if;
end $$;
reset role;
do $$begin
 if not exists(select 1 from pg_class where oid='public.cities'::regclass and relrowsecurity) then raise exception 'CITY_RLS_OFF';end if;
 if not has_table_privilege('service_role','public.cities','INSERT') or not has_table_privilege('service_role','public.cities','UPDATE') then raise exception 'TRUSTED_PIPELINE_GRANT_LOST';end if;
 if (select with_check from pg_policies where schemaname='public' and tablename='property_claim_media' and policyname='owned media pending review only') like '%c.project_id = c.project_id%' then raise exception 'UNBOUND_PROJECT_POLICY';end if;
end $$;
