-- Append to the migration in a transaction, ALWAYS ROLLBACK. No fixture survives.
select set_config('estate_test.buyer',gen_random_uuid()::text,true),set_config('estate_test.seller',gen_random_uuid()::text,true),set_config('estate_test.stranger',gen_random_uuid()::text,true),set_config('estate_test.admin',gen_random_uuid()::text,true),set_config('estate_test.project',(-1000000000-floor(random()*1000000000))::bigint::text,true),set_config('estate_test.submission',gen_random_uuid()::text,true),set_config('estate_test.unit',gen_random_uuid()::text,true);
insert into auth.users(id,email,aud,role) select current_setting('estate_test.'||who)::uuid,current_setting('estate_test.'||who)||'@example.invalid','authenticated','authenticated' from unnest(array['buyer','seller','stranger','admin']) who;
insert into public.properties(id,title,slug,city,country,source_type,status,lat,lng) overriding system value values(current_setting('estate_test.project')::bigint,'Rollback evidence fixture','rollback-'||current_setting('estate_test.unit'),'Mumbai','India','owner','listed',19.05,72.9);
insert into public.listing_submissions(id,owner_id,title,country,city,location,description,property_type,listing_type,submitter_role,status,property_id,price_amount,currency,media_urls,media_rights_confirmed)
 values(current_setting('estate_test.submission')::uuid,current_setting('estate_test.seller')::uuid,'Rollback evidence fixture','India','Mumbai','Andheri','Rollback-only documented property submission fixture','Apartment','buy','owner','approved',current_setting('estate_test.project')::bigint,100,'INR','["https://example.supabase.co/storage/v1/object/public/property-images/properties/rollback.webp"]',true);
insert into public.property_inventory(id,project_id,owner_id,source_submission_id,listing_type,property_type,status,price_amount,currency,area_sqft,area_basis)
 values(current_setting('estate_test.unit')::uuid,current_setting('estate_test.project')::bigint,current_setting('estate_test.seller')::uuid,current_setting('estate_test.submission')::uuid,'buy','Apartment','published',100,'INR',100,'carpet');
do $$begin if exists(select 1 from public.property_price_events where inventory_id=current_setting('estate_test.unit')::uuid) then raise exception 'PRICE_BEFORE_APPROVED_PHOTO';end if;end$$;
insert into public.property_published_media(project_id,source_submission_id,submission_media_index,media_type,published_by,publication_notes)
 values(current_setting('estate_test.project')::bigint,current_setting('estate_test.submission')::uuid,0,'photo',current_setting('estate_test.admin')::uuid,'Rollback only: independent permission and project reference fixture');
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('estate_test.buyer'),true),set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('estate_test.buyer'),'role','authenticated','app_metadata','{}'::jsonb)::text,true);
insert into public.property_search_alerts(name,country,city,currency,listing_type,event_type) values('Rollback price drop','India','Mumbai','INR','buy','price_drop');
insert into public.property_offers(inventory_id,amount,currency,message,expires_at) values(current_setting('estate_test.unit')::uuid,80,'INR','Private offer fixture for rollback checks',now()+interval '1 day');
do $$begin
 if (select seller_id from public.property_offers where inventory_id=current_setting('estate_test.unit')::uuid)<>current_setting('estate_test.seller')::uuid then raise exception 'SELLER_NOT_DERIVED';end if;
 begin insert into public.property_offers(inventory_id,amount,currency,message,expires_at,seller_id) values(current_setting('estate_test.unit')::uuid,80,'INR','Spoofing seller should fail',now()+interval '1 day',current_setting('estate_test.stranger')::uuid);raise exception 'SPOOF_SELLER';exception when insufficient_privilege then null;end;
 begin update public.property_offers set status='countered',counter_amount=70,version=2 where inventory_id=current_setting('estate_test.unit')::uuid;raise exception 'BUYER_COUNTERED';exception when others then if sqlerrm='BUYER_COUNTERED' then raise;end if;end;
 begin insert into public.property_notifications(owner_id,title,href) values(current_setting('estate_test.stranger')::uuid,'Forged update','/real-estate/workspace');raise exception 'FORGED_NOTIFICATION';exception when insufficient_privilege then null;end;
end$$;
insert into public.property_offer_messages(offer_id,body) select id,'Private buyer message fixture' from public.property_offers where inventory_id=current_setting('estate_test.unit')::uuid;
insert into public.property_resident_reviews(project_id,display_name,rating,review_text,residency_reference) values(current_setting('estate_test.project')::bigint,'Resident fixture',4,'Actual private experience fixture only for a rollback security check','PRIVATE-RESIDENCY-REFERENCE');
reset role;
update public.property_inventory set price_amount=90 where id=current_setting('estate_test.unit')::uuid;
do $$begin if (select count(*) from public.property_price_events where inventory_id=current_setting('estate_test.unit')::uuid)<>2 then raise exception 'PRICE_HISTORY_COUNT';end if;
 if not exists(select 1 from public.property_notifications where owner_id=current_setting('estate_test.buyer')::uuid and price_event_id is not null) then raise exception 'MISSING_PRICE_DROP_ALERT';end if;end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('estate_test.stranger'),true),set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('estate_test.stranger'),'role','authenticated')::text,true);
do $$begin
 if exists(select 1 from public.property_offers where inventory_id=current_setting('estate_test.unit')::uuid) or exists(select 1 from public.property_offer_messages where body='Private buyer message fixture') or exists(select 1 from public.property_search_alerts where name='Rollback price drop') or exists(select 1 from public.property_notifications where owner_id=current_setting('estate_test.buyer')::uuid) or exists(select 1 from public.property_resident_reviews where project_id=current_setting('estate_test.project')::bigint) then raise exception 'UNRELATED_USER_LEAK';end if;
end$$;
select set_config('request.jwt.claim.sub',current_setting('estate_test.seller'),true),set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('estate_test.seller'),'role','authenticated')::text,true);
update public.property_offers set status='countered',counter_amount=85,version=2 where inventory_id=current_setting('estate_test.unit')::uuid;
select set_config('request.jwt.claim.sub',current_setting('estate_test.buyer'),true),set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('estate_test.buyer'),'role','authenticated')::text,true);
update public.property_offers set status='discussion_agreed',counter_amount=85,version=3 where inventory_id=current_setting('estate_test.unit')::uuid;
select set_config('request.jwt.claim.sub',current_setting('estate_test.admin'),true),set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('estate_test.admin'),'role','authenticated','app_metadata',jsonb_build_object('role','admin'))::text,true);
update public.property_resident_reviews set status='approved',residency_verified=true,reviewed_by=current_setting('estate_test.admin')::uuid,reviewed_at=now() where project_id=current_setting('estate_test.project')::bigint;
set local role anon;
select set_config('request.jwt.claim.sub','',true),set_config('request.jwt.claims','{}',true);
do $$begin
 if not exists(select 1 from public.property_review_publications where project_id=current_setting('estate_test.project')::bigint and rating=4) then raise exception 'REVIEW_PUBLICATION_MISSING';end if;
 begin perform residency_reference from public.property_resident_reviews;raise exception 'PRIVATE_RESIDENCY_PUBLIC';exception when insufficient_privilege then null;end;
 begin perform * from public.property_seller_analytics(current_setting('estate_test.seller')::uuid);raise exception 'PUBLIC_SELLER_ANALYTICS';exception when insufficient_privilege then null;end;
 if not public.property_region_valid('[[72,19],[73,19],[73,20],[72,20]]') or public.property_region_valid('[[0,0],[2,2],[0,2],[2,0]]') or not public.property_region_contains('[[179,10],[-179,10],[-179,12],[179,12]]',180,11) or public.property_region_contains('[[179,10],[-179,10],[-179,12],[179,12]]',0,11) then raise exception 'REGION_VALIDATION';end if;
end$$;
reset role;
update public.property_inventory set status='withdrawn' where id=current_setting('estate_test.unit')::uuid;
set local role anon;
do $$begin if exists(select 1 from public.property_price_events where inventory_id=current_setting('estate_test.unit')::uuid) then raise exception 'WITHDRAWN_PRICE_EXPOSED';end if;end$$;
reset role;
select true as workspace_rls_and_trigger_checks_passed;
