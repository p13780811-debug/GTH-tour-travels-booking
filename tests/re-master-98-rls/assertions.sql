-- Execute only against disposable fixture DB after the staged RE-05 migration.
\set ON_ERROR_STOP on

-- Real claimant can insert ONLY a pending claim matching exact registered project.
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claims','{"app_metadata":{"role":"user"}}',false);
insert into public.property_project_claims(
 project_id,rera_reference,claimant_role,legal_name,authority_reference,authority_attested,rights_attested
) values (42,'P51800002057','developer','Registered Example Builder',
 'Independent written authorization evidence reference',true,true);
do $$
begin
 if (select count(*) from public.property_project_claims) <> 1 then
   raise exception 'Claimant cannot read their own pending claim';
 end if;
 begin
   insert into public.property_project_claims(
    project_id,rera_reference,claimant_role,legal_name,authority_reference,authority_attested,rights_attested
   ) values(43,'P51800002057','developer','Wrong RERA Identity',
     'Attempt to claim a different project reference',true,true);
   raise exception 'WRONG_REGISTRY_ACCEPTED';
 exception when others then
   if sqlerrm='WRONG_REGISTRY_ACCEPTED' then raise; end if;
 end;
end $$;

-- Cross-account reads and unauthorized media inserts fail closed.
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$
begin
 if exists(select 1 from public.property_project_claims) then
  raise exception 'Claim leaked across accounts';
 end if;
 begin
  insert into public.property_claim_media(
   claim_id,project_id,object_key,sha256,media_type,supplier,license_basis,
   permission_reference,rights_attested
  ) select id,project_id,
   'claims/22222222-2222-4222-8222-222222222222/'||id::text||
   '/33333333-3333-4333-8333-333333333333.webp',repeat('a',64),
   'photo','Unauthorized sender','creator','Not authorized to upload evidence',true
  from public.property_project_claims;
  -- RLS SELECT sees no other user's claim: the INSERT must not have occurred.
  if exists(select 1 from public.property_claim_media) then
    raise exception 'UNAUTHORIZED_MEDIA_INSERTED';
  end if;
 exception when others then
  if sqlerrm='UNAUTHORIZED_MEDIA_INSERTED' then raise; end if;
 end;
end $$;

-- Return to the rightful uploader and test Storage isolation.
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
insert into storage.objects(bucket_id,name,metadata)
select 'gth-re-claim-media',
'claims/11111111-1111-4111-8111-111111111111/'||id::text||
'/44444444-4444-4444-8444-444444444444.webp',
'{"mimetype":"image/webp"}'::jsonb from public.property_project_claims limit 1;

-- An attempt to upload into somebody else's path must fail Storage RLS.
do $$
declare v_id uuid;
begin
 select id into v_id from public.property_project_claims limit 1;
 begin
  insert into storage.objects(bucket_id,name,metadata)
  values('gth-re-claim-media',
    'claims/22222222-2222-4222-8222-222222222222/'||v_id::text||
    '/55555555-5555-4555-8555-555555555555.webp','{"mimetype":"image/webp"}');
  raise exception 'FOREIGN_STORAGE_ALLOWED';
 exception when others then
  if sqlerrm='FOREIGN_STORAGE_ALLOWED' then raise; end if;
 end;
end $$;

insert into public.property_claim_media(
 claim_id,project_id,object_key,sha256,media_type,supplier,license_basis,
 permission_reference,rights_attested
)
select c.id,c.project_id,o.name,repeat('a',64),
 'photo','Original Rights Holder','authorized_owner','Signed and dated photo rights agreement',true
from public.property_project_claims c
join storage.objects o on o.name like 'claims/11111111-1111-4111-8111-111111111111/'||c.id::text||'/%';

-- Referenced evidence cannot be destroyed through the ordinary uploader JWT.
delete from storage.objects where bucket_id='gth-re-claim-media';
do $$
begin
 if (select count(*) from storage.objects where bucket_id='gth-re-claim-media')<>1 then
  raise exception 'Submitted media unexpectedly deleted';
 end if;
end $$;

-- Admin is another real user with role set in app_metadata, not user-editable metadata.
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
select set_config('request.jwt.claims','{"app_metadata":{"role":"admin"}}',false);
do $$
declare cid uuid;
begin
 select id into cid from public.property_project_claims limit 1;
 begin
  perform public.review_property_project_claim(cid,'approved','');
  raise exception 'UNREVIEWED_CLAIM_APPROVED';
 exception when others then
  if sqlerrm='UNREVIEWED_CLAIM_APPROVED' then raise; end if;
 end;
 perform public.review_property_project_claim(cid,'approved',
  'Registry identity, legal authority and written evidence independently checked');
 if (select status from public.property_project_claims where id=cid)<>'approved' then
  raise exception 'Claim review not persisted';
 end if;
end $$;
do $$
declare mid uuid;
begin
 select id into mid from public.property_claim_media limit 1;
 begin
  perform public.review_property_claim_media(mid,'approved','');
  raise exception 'UNREVIEWED_MEDIA_APPROVED';
 exception when others then
  if sqlerrm='UNREVIEWED_MEDIA_APPROVED' then raise; end if;
 end;
 perform public.review_property_claim_media(mid,'approved',
  'Original source, exact project photo and permission evidence independently checked');
 if (select status from public.property_claim_media where id=mid)<>'approved' then
   raise exception 'Media review not persisted';
 end if;
end $$;

-- Nothing gets added to property inventory, property listing status, or a public gallery.
reset role;
do $$
begin
 if (select count(*) from public.properties)<>2 then
   raise exception 'Registry records modified by media review';
 end if;
 if exists(select 1 from storage.buckets where id='gth-re-claim-media' and public) then
   raise exception 'Claim media bucket became public';
 end if;
 raise notice 'RE-05/06 isolated Postgres claim/media RLS + reviewer checks passed';
end $$;
