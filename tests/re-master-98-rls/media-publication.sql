-- Disposable isolated PG17 fixture only; run after RE-05/06 assertions and RE-07/09 migration.
\set ON_ERROR_STOP on
set role anon;
do $$
begin
 if exists(select 1 from public.property_published_media) then
   raise exception 'UNREVIEWED_MEDIA_PUBLIC';
 end if;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claims','{"app_metadata":{"role":"user"}}',false);
do $$
declare media_id uuid;
begin
 select id into media_id from public.property_claim_media limit 1;
 begin
   perform public.manage_property_media_publication(media_id,'publish',
      'Attempt by uploader to self-publish exact property media');
   raise exception 'UPLOADER_PUBLISHED';
 exception when others then
   if sqlerrm='UPLOADER_PUBLISHED' then raise; end if;
 end;
 if exists(select 1 from public.property_published_media) then
   raise exception 'UNAUTHORIZED_PUBLICATION_ROW';
 end if;
end $$;
-- Only a separate admin may import supplier candidate references.
do $$
begin
 begin
 insert into public.property_media_candidates
  (source_key,external_reference,project_id,rera_reference,source_url,media_type,
   rights_basis,agreement_reference,permission_reference)
 values('builder_a','photo-00001',42,'P51800002057',
 'https://example.org/authorized-photo.webp','photo','documented_license',
 'Independent signed supplier agreement dated and stored',
 'Image redistribution agreement stored for review');
 raise exception 'PUBLIC_CANDIDATE_IMPORT';
 exception when others then
 if sqlerrm='PUBLIC_CANDIDATE_IMPORT' then raise; end if;
 end;
end $$;

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
select set_config('request.jwt.claims','{"app_metadata":{"role":"admin"}}',false);
insert into public.property_media_candidates
 (source_key,external_reference,project_id,rera_reference,source_url,media_type,
 rights_basis,agreement_reference,permission_reference)
values('builder_a','photo-00001',42,'P51800002057',
 'https://example.org/authorized-photo.webp','photo','documented_license',
 'Independent signed supplier agreement dated and stored',
 'Image redistribution agreement stored for review');
do $$
declare mid uuid; pub uuid;
begin
 select id into mid from public.property_claim_media where status='approved' limit 1;
 if mid is null then raise exception 'APPROVED_MEDIA_FIXTURE_MISSING'; end if;
 if exists(select 1 from public.property_published_media) then
   raise exception 'CANDIDATE_AUTO_PUBLISHED';
 end if;
 begin
  perform public.manage_property_media_publication(mid,'publish','too short');
  raise exception 'PUBLICATION_WITHOUT_REVIEW_EVIDENCE';
 exception when others then
  if sqlerrm='PUBLICATION_WITHOUT_REVIEW_EVIDENCE' then raise; end if;
 end;
 pub:=public.manage_property_media_publication(mid,'publish',
  'Independently confirmed supplier authorization, exact project photo and publication rights.');
 if not public.is_property_media_public(pub) then
   raise exception 'PUBLICATION_GATE_FAILED';
 end if;
 if (select count(*) from public.property_published_media)<>1 then
   raise exception 'PUBLICATION_COUNT_INVALID';
 end if;
 begin
  perform public.manage_property_media_publication(mid,'publish',
   'Attempt to republish exact media without new independent review');
  raise exception 'DUPLICATE_PUBLICATION';
 exception when others then if sqlerrm='DUPLICATE_PUBLICATION' then raise; end if; end;
end $$;

-- Check anonymous RLS sees only genuinely published metadata, not claim internals.
set role anon;
do $$
begin
 if (select count(*) from public.property_published_media)<>1 then
   raise exception 'ANON_CANNOT_READ_APPROVED_PUBLIC_METADATA';
 end if;
 begin
  perform (select count(*) from public.property_claim_media);
  raise exception 'PRIVATE_CLAIM_MEDIA_LEAK';
 exception when others then if sqlerrm='PRIVATE_CLAIM_MEDIA_LEAK' then raise; end if; end;
end $$;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
select set_config('request.jwt.claims','{"app_metadata":{"role":"admin"}}',false);
do $$
declare mid uuid; pub uuid;
begin
 select id into mid from public.property_claim_media limit 1;
 pub:=public.manage_property_media_publication(mid,'take_down',
  'Owner submitted a valid takedown request; public media rights revoked immediately.');
 if public.is_property_media_public(pub) then
   raise exception 'TAKEN_DOWN_MEDIA_STILL_PUBLIC';
 end if;
 if exists(select 1 from public.property_published_media) then
   raise exception 'TAKEDOWN_DID_NOT_CLOSE_PUBLICATION';
 end if;
end $$;
set role anon;
do $$
begin
 if exists(select 1 from public.property_published_media) then
   raise exception 'ANON_TAKEDOWN_LEAK';
 end if;
end $$;
reset role;
do $$
begin
 if (select count(*) from public.properties)<>2 then
   raise exception 'REGISTRY_MUTATED_BY_MEDIA_PIPELINE';
 end if;
 raise notice 'RE-07–09 no-auto-publication, RLS, authorization and takedown passed';
end $$;
