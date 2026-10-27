-- Preserve public city discovery; only trusted backend roles may write city data.
alter table public.cities enable row level security;
revoke all on table public.cities from public, anon, authenticated;
grant select on table public.cities to anon, authenticated;
drop policy if exists "public city discovery" on public.cities;
create policy "public city discovery" on public.cities
 for select to anon, authenticated using (true);

-- Existing owner/status RLS remains authoritative. Grant only the exact form
-- fields, including the inventory additions, never ownership/moderation fields.
grant insert (
 title,country,city,location,description,property_type,listing_type,
 target_project_id,registry_reference,price_amount,currency,bedrooms,bathrooms,
 area_sqft,submitter_role,media_urls,possession_status,is_new_launch,
 agent_registration,media_rights_confirmed,area_basis
) on table public.listing_submissions to authenticated;

-- Explicit outer-table qualification avoids a self-comparison of the claim's
-- project ID. The existing exact-project validation trigger remains unchanged.
drop policy if exists "owned media pending review only" on public.property_claim_media;
create policy "owned media pending review only" on public.property_claim_media
 for insert to authenticated with check (
  uploader_id=(select auth.uid()) and status='pending' and primary_image=false
  and reviewed_at is null and reviewed_by is null and rights_attested
  and exists (
   select 1 from public.property_project_claims c
   where c.id=property_claim_media.claim_id and c.claimant_id=(select auth.uid())
    and c.project_id=property_claim_media.project_id and c.status in ('pending','approved')
  )
 );
notify pgrst,'reload schema';
