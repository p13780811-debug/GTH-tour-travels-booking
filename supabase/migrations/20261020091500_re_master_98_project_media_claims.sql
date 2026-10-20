-- RE MASTER #98 / RE-05, RE-06. STAGED ONLY: do not apply outside the consolidated release.
-- Claim metadata and media bytes are private. An approved claim or media review
-- never by itself grants publication, ownership certification, or marketplace status.
create schema if not exists gth_re_private;
revoke all on schema gth_re_private from public, anon, authenticated;

create table if not exists public.property_project_claims (
  id uuid primary key default gen_random_uuid(),
  claimant_id uuid not null default auth.uid() references auth.users(id),
  project_id bigint not null references public.properties(id) on delete restrict,
  rera_reference text not null check (rera_reference ~ '^P[0-9]{11}$'),
  claimant_role text not null check (claimant_role in ('developer','owner','agent')),
  legal_name text not null check (char_length(legal_name) between 3 and 150),
  organization_name text check (organization_name is null or char_length(organization_name) between 2 and 160),
  authority_reference text not null check (char_length(authority_reference) between 12 and 500),
  authority_attested boolean not null default false check (authority_attested = true),
  rights_attested boolean not null default false check (rights_attested = true),
  status text not null default 'pending' check (status in ('pending','approved','rejected','revoked')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_notes text check (review_notes is null or char_length(review_notes) <= 1000),
  created_at timestamptz not null default now()
);
create unique index if not exists property_project_claim_one_pending
  on public.property_project_claims(claimant_id,project_id) where status='pending';
create index if not exists property_project_claims_review_idx
  on public.property_project_claims(status,created_at);
alter table public.property_project_claims enable row level security;
revoke all on public.property_project_claims from public,anon,authenticated;
grant select on public.property_project_claims to authenticated;
grant insert (project_id,rera_reference,claimant_role,legal_name,organization_name,authority_reference,authority_attested,rights_attested)
  on public.property_project_claims to authenticated;
create policy "claim owner and admin view" on public.property_project_claims
  for select to authenticated using (
    claimant_id=(select auth.uid()) or
    (select auth.jwt()->'app_metadata'->>'role')='admin'
  );
create policy "claimant can request exact project review" on public.property_project_claims
  for insert to authenticated with check (
    claimant_id=(select auth.uid()) and status='pending'
    and reviewed_at is null and reviewed_by is null
    and authority_attested and rights_attested
  );

-- Enforce ID + registry identity inside the database. Client-side lookup alone is not authorization.
create or replace function gth_re_private.validate_project_claim() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or new.claimant_id is distinct from auth.uid()
    or not exists (
      select 1 from public.properties p
      where p.id=new.project_id and p.rera_id=new.rera_reference and p.source_type='registry'
    )
  then raise exception 'Project identity or claimant is invalid'; end if;
  return new;
end; $$;
revoke all on function gth_re_private.validate_project_claim() from public,anon,authenticated;
drop trigger if exists trg_validate_project_claim on public.property_project_claims;
create trigger trg_validate_project_claim before insert on public.property_project_claims
  for each row execute function gth_re_private.validate_project_claim();

create table if not exists public.property_claim_media (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.property_project_claims(id) on delete restrict,
  project_id bigint not null references public.properties(id) on delete restrict,
  uploader_id uuid not null default auth.uid() references auth.users(id),
  object_key text not null unique check (char_length(object_key) <= 250),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  media_type text not null check (media_type in ('photo','render','floor_plan')),
  supplier text not null check (char_length(supplier) between 2 and 160),
  original_url text check (original_url is null or char_length(original_url) <= 800),
  attribution text check (attribution is null or char_length(attribution) <= 250),
  license_basis text not null check (license_basis in ('creator','authorized_owner','documented_license')),
  permission_reference text not null check (char_length(permission_reference) between 12 and 500),
  rights_attested boolean not null default false check (rights_attested = true),
  status text not null default 'pending' check (status in ('pending','approved','rejected','taken_down')),
  primary_image boolean not null default false,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_notes text check (review_notes is null or char_length(review_notes) <= 1000),
  created_at timestamptz not null default now(),
  unique(project_id,sha256)
);
create index if not exists property_claim_media_review_idx
  on public.property_claim_media(status,created_at);
create index if not exists property_claim_media_claim_idx
  on public.property_claim_media(claim_id,created_at);
alter table public.property_claim_media enable row level security;
revoke all on public.property_claim_media from public,anon,authenticated;
grant select on public.property_claim_media to authenticated;
grant insert (claim_id,project_id,object_key,sha256,media_type,supplier,original_url,attribution,license_basis,permission_reference,rights_attested)
  on public.property_claim_media to authenticated;
create policy "media uploader and admin view" on public.property_claim_media
  for select to authenticated using (
    uploader_id=(select auth.uid()) or
    (select auth.jwt()->'app_metadata'->>'role')='admin'
  );
create policy "owned media pending review only" on public.property_claim_media
  for insert to authenticated with check (
    uploader_id=(select auth.uid()) and status='pending' and primary_image=false
    and reviewed_at is null and reviewed_by is null and rights_attested
    and exists (
      select 1 from public.property_project_claims c
      where c.id=claim_id and c.claimant_id=(select auth.uid())
        and c.project_id=project_id and c.status in ('pending','approved')
    )
  );

-- Definer runs validation under an authenticated, nonprivileged caller and never publishes media.
create or replace function gth_re_private.validate_claim_media() returns trigger
language plpgsql security definer set search_path='' as $$
declare owner_id uuid; linked_project bigint; claim_status text; existing integer;
begin
  if auth.uid() is null or new.uploader_id is distinct from auth.uid() then
    raise exception 'Uploader identity invalid';
  end if;
  select claimant_id,project_id,status into owner_id,linked_project,claim_status
  from public.property_project_claims where id=new.claim_id for update;
  if owner_id is distinct from auth.uid() or linked_project is distinct from new.project_id
     or claim_status not in ('pending','approved') then
     raise exception 'Claim not eligible for upload';
  end if;
  if new.object_key not like 'claims/' || auth.uid()::text || '/' || new.claim_id::text || '/%'
     or new.object_key !~ '^claims/[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}[.]webp$' then
     raise exception 'Unexpected private object path';
  end if;
  select count(*) into existing from public.property_claim_media where claim_id=new.claim_id;
  if existing >= 8 then raise exception 'Maximum eight media files per claim'; end if;
  return new;
end; $$;
revoke all on function gth_re_private.validate_claim_media() from public,anon,authenticated;
drop trigger if exists trg_validate_claim_media on public.property_claim_media;
create trigger trg_validate_claim_media before insert on public.property_claim_media
  for each row execute function gth_re_private.validate_claim_media();

-- Private, non-enumerable review bucket. Never reuse public property-images for claims.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('gth-re-claim-media','gth-re-claim-media',false,5242880,array['image/webp']::text[])
on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/webp']::text[];

drop policy if exists "re claim private image inserts" on storage.objects;
create policy "re claim private image inserts" on storage.objects
  for insert to authenticated
  with check (
    bucket_id='gth-re-claim-media'
    and (storage.foldername(name))[1]='claims'
    and (storage.foldername(name))[2]=(select auth.uid())::text
    and name ~ '^claims/[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}[.]webp$'
  );
drop policy if exists "re claim private image review downloads" on storage.objects;
create policy "re claim private image review downloads" on storage.objects
  for select to authenticated
  using (
    bucket_id='gth-re-claim-media'
    and (
      (storage.foldername(name))[2]=(select auth.uid())::text
      or (select auth.jwt()->'app_metadata'->>'role')='admin'
    )
  );

-- Only a separate administrator can review; review does not imply publication.
create or replace function public.review_property_project_claim(p_id uuid,p_decision text,p_notes text default null)
returns void language plpgsql security definer set search_path='' as $$
declare item public.property_project_claims;
begin
  if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'role','')<>'admin'
     or p_decision not in ('approved','rejected') then
    raise exception 'Not authorized';
  end if;
  select * into item from public.property_project_claims where id=p_id for update;
  if not found or item.status<>'pending' or item.claimant_id=auth.uid() then
    raise exception 'Claim not eligible for independent review';
  end if;
  if p_decision='approved' and not exists (
    select 1 from public.properties p where p.id=item.project_id
    and p.rera_id=item.rera_reference and p.source_type='registry'
  ) then raise exception 'Registry identity changed'; end if;
  update public.property_project_claims set status=p_decision,reviewed_at=now(),
    reviewed_by=auth.uid(),review_notes=left(coalesce(p_notes,''),1000) where id=p_id;
end; $$;
revoke all on function public.review_property_project_claim(uuid,text,text) from public,anon;
grant execute on function public.review_property_project_claim(uuid,text,text) to authenticated;

create or replace function public.review_property_claim_media(p_id uuid,p_decision text,p_notes text default null)
returns void language plpgsql security definer set search_path='' as $$
declare item public.property_claim_media;
begin
  if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'role','')<>'admin'
     or p_decision not in ('approved','rejected','taken_down') then
    raise exception 'Not authorized';
  end if;
  select * into item from public.property_claim_media where id=p_id for update;
  if not found or item.uploader_id=auth.uid() or item.status not in ('pending','approved') then
    raise exception 'Media not eligible for independent review';
  end if;
  if p_decision='approved' and not exists (
    select 1 from public.property_project_claims c where c.id=item.claim_id
    and c.status='approved' and c.project_id=item.project_id
  ) then raise exception 'Project authorization not approved'; end if;
  update public.property_claim_media set status=p_decision,reviewed_by=auth.uid(),
    reviewed_at=now(),review_notes=left(coalesce(p_notes,''),1000) where id=p_id;
end; $$;
revoke all on function public.review_property_claim_media(uuid,text,text) from public,anon;
grant execute on function public.review_property_claim_media(uuid,text,text) to authenticated;

comment on table public.property_claim_media is
'Private candidate evidence: approval is not publication. Requires independent rights, project match and content review before any public delivery.';
