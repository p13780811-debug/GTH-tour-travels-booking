-- GTH PRO low-risk security/performance hardening.
-- Preserves all existing access semantics.

alter function public.gth_auto_intelligence() set search_path = pg_catalog;
alter function public.update_timestamp() set search_path = pg_catalog;

drop policy if exists "Hotel owners read their submissions" on public.hotel_partner_submissions;
create policy "Hotel owners read their submissions"
on public.hotel_partner_submissions
for select to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists "Hotel owners submit private pending inventory" on public.hotel_partner_submissions;
create policy "Hotel owners submit private pending inventory"
on public.hotel_partner_submissions
for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and status='pending'
  and published_hotel_id is null
);

drop policy if exists "Hotel owners read their photo entries" on public.hotel_partner_photos;
create policy "Hotel owners read their photo entries"
on public.hotel_partner_photos
for select to authenticated
using (
  exists (
    select 1
    from public.hotel_partner_submissions s
    where s.id = hotel_partner_photos.submission_id
      and s.owner_id = (select auth.uid())
  )
);

drop policy if exists "Admin reads partner applications" on public.partner_applications;
create policy "Admin reads partner applications"
on public.partner_applications
for select to authenticated
using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');

drop policy if exists "Admin updates partner applications" on public.partner_applications;
create policy "Admin updates partner applications"
on public.partner_applications
for update to authenticated
using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin')
with check ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');

create index if not exists listing_submissions_owner_id_idx
  on public.listing_submissions(owner_id);
create index if not exists listing_submissions_property_id_idx
  on public.listing_submissions(property_id);
create index if not exists property_claim_media_reviewed_by_idx
  on public.property_claim_media(reviewed_by);
create index if not exists property_claim_media_uploader_id_idx
  on public.property_claim_media(uploader_id);
create index if not exists property_media_candidates_reviewed_by_idx
  on public.property_media_candidates(reviewed_by);
create index if not exists property_project_claims_project_id_idx
  on public.property_project_claims(project_id);
create index if not exists property_project_claims_reviewed_by_idx
  on public.property_project_claims(reviewed_by);
create index if not exists property_published_media_published_by_idx
  on public.property_published_media(published_by);
create index if not exists property_published_media_takedown_by_idx
  on public.property_published_media(takedown_by);
create index if not exists tender_bid_workspaces_tender_id_idx
  on public.tender_bid_workspaces(tender_id);
create index if not exists hotel_partner_submissions_owner_id_idx
  on public.hotel_partner_submissions(owner_id);
