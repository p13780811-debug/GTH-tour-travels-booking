-- Runs after existing owner/claim/publication RLS regressions.
reset role;
update public.properties set slug='fixture-'||id,city='Mumbai',country='India',location='Andheri',status='listed';
insert into public.listing_submissions(id,owner_id,title,country,city,location,description,property_type,listing_type,
 status,property_id,price_amount,currency,bedrooms,area_sqft,submitter_role,media_urls,media_rights_confirmed,possession_status,is_new_launch,area_basis)
 values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Review fixture','India','Mumbai','Andheri','A documented listing for SQL security testing','Apartment','buy',
 'approved',42,10000000,'INR',4,1200,'owner','["https://example.supabase.co/storage/v1/object/public/property-images/properties/11111111-1111-4111-8111-111111111111/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp"]',true,'under_construction',true,'carpet');
insert into public.property_inventory(project_id,owner_id,source_submission_id,listing_type,property_type,price_amount,currency,bedrooms,area_sqft,status,possession_status,is_new_launch,area_basis)
 values(42,'11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','buy','Apartment',10000000,'INR',4,1200,'published','under_construction',true,'carpet'),
 (42,'11111111-1111-4111-8111-111111111111',null,'rent','Apartment',30000,'INR',2,600,'published','ready_to_move',false,'built_up');
set role anon;
do $$begin
 -- Existing claim-media fixture may have been taken down; no photos means no cards.
 if jsonb_array_length(public.search_hybrid_properties('{"mode":"buy"}')->'items')<>0 then raise exception 'NO_PHOTO_CARD';end if;
end $$;
reset role;
-- Uploader, including an admin uploader, cannot approve their own photographs.
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claims','{"app_metadata":{"role":"admin"}}',false);
do $$begin
 begin
 perform public.manage_submission_media_publication('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,'publish','Independent rights evidence must be checked');
 raise exception 'SELF_APPROVAL';
 exception when others then if sqlerrm='SELF_APPROVAL' then raise;end if;end;
end $$;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
select public.manage_submission_media_publication('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,'publish','Independent review of written photo permission and exact property identity');
reset role;
set role anon;
do $$declare result jsonb;begin
 result:=public.search_hybrid_properties('{"mode":"buy","bedrooms":"4+","possession":"under_construction","currency":"INR","minPrice":9000000,"maxPrice":11000000}');
 if jsonb_array_length(result->'items')<>1 then raise exception 'VALID_FILTER_MATCH_MISSING';end if;
 if (result->'items'->0->>'beds')::int<>4 then raise exception 'MATCHING_UNIT_SPECS';end if;
 if jsonb_array_length(public.search_hybrid_properties('{"mode":"rent","bedrooms":"4+"}')->'items')<>0 then raise exception 'CROSS_UNIT_FALSE_MATCH';end if;
 if jsonb_array_length(public.search_hybrid_properties('{"mode":"new_launch"}')->'items')<>1 then raise exception 'NEW_LAUNCH_MISSING';end if;
 if jsonb_array_length(public.search_hybrid_properties('{"mode":"plots"}')->'items')<>0 then raise exception 'PLOT_FALSE_MATCH';end if;
 if jsonb_array_length(public.search_hybrid_properties('{"mode":"commercial"}')->'items')<>0 then raise exception 'COMMERCIAL_FALSE_MATCH';end if;
 if jsonb_array_length(public.search_hybrid_properties('{"mode":"buy","query":"Dombivli"}')->'items')<>0 then raise exception 'LOCALITY_FILTER_FAILED';end if;
 if result::text ~ 'owner_id|source_submission_id|agent_registration|publication_notes' then raise exception 'PRIVATE_FIELD_LEAK';end if;
 begin perform public.search_hybrid_properties('{"minPrice":100}');raise exception 'MISSING_CURRENCY_ACCEPTED';exception when sqlstate '22023' then null;end;
 begin perform public.search_hybrid_properties('{"page":0}');raise exception 'INVALID_PAGE_ACCEPTED';exception when sqlstate '22023' then null;end;
end $$;
reset role;
set role authenticated;
select public.manage_submission_media_publication('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,'take_down','Owner withdrew publication permission for this exact photograph');
reset role;
set role anon;
do $$begin
 if jsonb_array_length(public.search_hybrid_properties('{"mode":"buy"}')->'items')<>0 then raise exception 'TAKEDOWN_NOT_ENFORCED';end if;
end $$;
reset role;
-- Pagination must operate on publishable inventory, not the larger registry table.
insert into public.properties(id,title,slug,source_type,status,city,country,location)
 select n,'Paged fixture '||n,'paged-fixture-'||n,'owner','listed','Mumbai','India','Andheri'
 from generate_series(1000,1025) n;
insert into public.listing_submissions(id,owner_id,title,status,property_id,media_urls,media_rights_confirmed)
 select ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'11111111-1111-4111-8111-111111111111','Paged fixture '||n,'approved',n,
 '["https://example.supabase.co/storage/v1/object/public/property-images/properties/11111111-1111-4111-8111-111111111111/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp"]'::jsonb,true from generate_series(1000,1025) n;
insert into public.property_inventory(project_id,owner_id,source_submission_id,listing_type,status,price_amount,currency,published_at)
 select n,'11111111-1111-4111-8111-111111111111',('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'buy','published',n,'INR',now() from generate_series(1000,1025) n;
insert into public.property_published_media(project_id,source_submission_id,submission_media_index,media_type,published_by,publication_notes)
 select n,('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,0,'photo','33333333-3333-4333-8333-333333333333','Independent written permission reviewed for pagination fixture' from generate_series(1000,1025) n;
set role anon;
do $$declare first_page jsonb;second_page jsonb;begin
 first_page:=public.search_hybrid_properties('{"mode":"buy","sort":"price_low","page":1}');
 second_page:=public.search_hybrid_properties('{"mode":"buy","sort":"price_low","page":2}');
 if jsonb_array_length(first_page->'items')<>24 or (first_page->>'hasNext')::boolean is not true then raise exception 'FIRST_PAGE_WRONG';end if;
 if jsonb_array_length(second_page->'items')<>2 or (second_page->>'hasNext')::boolean is not false then raise exception 'LAST_PAGE_WRONG';end if;
 if (first_page->'items'->0->>'inventory_min_price')::numeric<>1000 or (second_page->'items'->0->>'inventory_min_price')::numeric<>1024 then raise exception 'UNSTABLE_ORDER';end if;
end $$;
reset role;
