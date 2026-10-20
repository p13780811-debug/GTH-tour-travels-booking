-- RE-07/08/09: dependent on 20261020091500_re_master_98_project_media_claims.sql
-- No candidate or privately reviewed image is publicly visible without a second admin publication decision.
create table if not exists public.property_media_candidates (
 id uuid primary key default gen_random_uuid(),
 source_key text not null check (source_key ~ '^[a-z][a-z0-9_-]{2,40}$'),
 external_reference text not null check (length(external_reference) between 5 and 150),
 project_id bigint not null references public.properties(id),
 rera_reference text not null check (rera_reference ~ '^P[0-9]{11}$'),
 source_url text not null check (left(source_url,8)='https://' and length(source_url)<=1200),
 media_type text not null check (media_type in ('photo','render','floor_plan')),
 rights_basis text not null check (rights_basis in ('creator','authorized_owner','documented_license')),
 agreement_reference text not null check (length(agreement_reference) between 12 and 500),
 permission_reference text not null check (length(permission_reference) between 12 and 500),
 attribution text check (attribution is null or length(attribution)<=250),
 match_method text not null default 'rera_exact' check (match_method='rera_exact'),
 status text not null default 'pending' check (status in ('pending','rejected','linked')),
 review_notes text,
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id),
 unique(source_key,external_reference)
);
create index if not exists property_media_candidates_project_idx on public.property_media_candidates(project_id,created_at);
alter table public.property_media_candidates enable row level security;
revoke all on public.property_media_candidates from public, anon, authenticated;
grant select,insert on public.property_media_candidates to authenticated;
grant all on public.property_media_candidates to service_role;
create policy "admins see media candidates" on public.property_media_candidates for select to authenticated
 using ((select auth.jwt()->'app_metadata'->>'role')='admin');
create policy "admins stage media candidates" on public.property_media_candidates for insert to authenticated
 with check ((select auth.jwt()->'app_metadata'->>'role')='admin' and status='pending'
 and exists (select 1 from public.properties p where p.id=project_id
 and p.rera_id=rera_reference and p.source_type='registry'));

-- Metadata only; the image bytes stay in the private RE-05 bucket.
-- Enforced via publication RPC and public RLS, not by a URL or uploader assertion.
create table if not exists public.property_published_media (
 id uuid primary key default gen_random_uuid(),
 claim_media_id uuid not null unique references public.property_claim_media(id) on delete restrict,
 project_id bigint not null references public.properties(id) on delete restrict,
 media_type text not null check(media_type in ('photo','render','floor_plan')),
 attribution text,
 status text not null default 'published' check(status in ('published','taken_down')),
 is_primary boolean not null default false,
 published_by uuid not null references auth.users(id),
 published_at timestamptz not null default now(),
 publication_notes text not null check(length(btrim(publication_notes))>=20),
 takedown_by uuid references auth.users(id),
 taken_down_at timestamptz,
 takedown_notes text,
 check(status <> 'published' or (taken_down_at is null and takedown_by is null)),
 check(status <> 'taken_down' or (taken_down_at is not null and takedown_by is not null))
);
create index if not exists property_published_media_project_idx
 on public.property_published_media(project_id,published_at desc) where status='published';
create unique index if not exists property_published_media_one_cover
 on public.property_published_media(project_id) where status='published' and is_primary=true;
alter table public.property_published_media enable row level security;
revoke all on public.property_published_media from public,anon,authenticated;
grant select(id,project_id,media_type,attribution,is_primary,published_at) on public.property_published_media to anon,authenticated;
grant all on public.property_published_media to service_role;
-- Definer predicate is required because private claim evidence is not SELECTable by anon.
-- Never grant direct public access to the private claim/media tables.
create or replace function public.is_property_media_public(p_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists (
   select 1 from public.property_published_media p
   join public.property_claim_media m on m.id=p.claim_media_id
   join public.property_project_claims c on c.id=m.claim_id
   join public.properties project on project.id=p.project_id
   where p.id=p_id and p.status='published'
     and m.status='approved' and c.status='approved'
     and m.project_id=p.project_id and c.project_id=p.project_id
     and project.rera_id=c.rera_reference and project.source_type='registry'
     and m.reviewed_by is not null and m.reviewed_at is not null
     and m.reviewed_by<>m.uploader_id
 );
$$;
revoke all on function public.is_property_media_public(uuid) from public;
grant execute on function public.is_property_media_public(uuid) to anon,authenticated,service_role;
create policy "public may see independently approved media metadata" on public.property_published_media
 for select to anon,authenticated
 using (public.is_property_media_public(id));

-- Only the reviewer can publish, after claim AND media were independently approved.
create or replace function public.manage_property_media_publication(
 p_media uuid, p_action text, p_notes text
) returns uuid language plpgsql security definer set search_path='' as $$
declare m public.property_claim_media; c public.property_project_claims;
  existing_id uuid; published_id uuid;
begin
 if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'role','') <> 'admin'
   or p_action not in ('publish','take_down')
   or char_length(btrim(coalesce(p_notes,''))) < 20 then
   raise exception 'Publication review and administrator authorization required';
 end if;
 select * into m from public.property_claim_media where id=p_media for update;
 if not found then raise exception 'Unknown media'; end if;
 select * into c from public.property_project_claims where id=m.claim_id for update;
 if not found or m.project_id is distinct from c.project_id then
   raise exception 'Project match failed';
 end if;
 perform pg_advisory_xact_lock(m.project_id);
 select id into existing_id from public.property_published_media where claim_media_id=m.id for update;
 if p_action='publish' then
   if existing_id is not null or m.status<>'approved' or c.status<>'approved'
     or not m.rights_attested or m.reviewed_by is null or m.reviewed_at is null
     or m.reviewed_by=m.uploader_id or c.reviewed_by is null
     or c.claimant_id=m.uploader_id and c.status<>'approved'
     or not exists (select 1 from storage.objects o
       where o.bucket_id='gth-re-claim-media' and o.name=m.object_key
       and o.metadata->>'mimetype'='image/webp') then
     raise exception 'Media lacks independent publication prerequisites';
   end if;
   insert into public.property_published_media
    (claim_media_id,project_id,media_type,attribution,is_primary,published_by,publication_notes)
   values (m.id,m.project_id,m.media_type,m.attribution,
     m.media_type <> 'floor_plan' and not exists (
       select 1 from public.property_published_media p
       where p.project_id=m.project_id and p.status='published' and p.is_primary
     ),auth.uid(),left(p_notes,1000)) returning id into published_id;
   return published_id;
 end if;
 if existing_id is null then raise exception 'Media is not published'; end if;
 update public.property_published_media
 set status='taken_down',is_primary=false,taken_down_at=now(),
     takedown_by=auth.uid(),takedown_notes=left(p_notes,1000)
 where id=existing_id and status='published' returning id into published_id;
 if published_id is null then raise exception 'Already taken down'; end if;
 return published_id;
end; $$;
revoke all on function public.manage_property_media_publication(uuid,text,text)
 from public,anon;
grant execute on function public.manage_property_media_publication(uuid,text,text) to authenticated;
comment on table public.property_published_media is
 'Publication requires separate admin action after independently reviewed exact project ownership and media rights. Takedown blocks future access.';
