# GTH PRO — Hotel owner listing and photo review

## Free owner workflow
1. Visit `/hotels/list-your-property`.
2. Sign in through the existing Supabase email OTP flow.
3. Supply hotel name, city, ISO country code, address, accommodation category, description, owner/contact identity and (optionally) public hotel website.
4. Confirm owner/manager authority and the right to display each original hotel photograph.
5. Upload 1–6 original JPEG/PNG/WebP photos (up to 3 MB each). The server converts each to WebP, strips metadata and places it in **private** Supabase Storage.
6. Submission stays `pending`; owner can view status and retry remaining uploads, not publish directly.

## Administrator workflow
1. `/admin/hotels` requires a signed-in Supabase user whose **verified app_metadata.role is `admin`**. The public page shows no private submissions without that role.
2. Independently verify hotel identity, claim to manage the property and publication rights to all photos. These are manual responsibilities; checkboxes do not themselves verify claims.
3. Approve only with at least one photo; the protected server route copies reviewed WebP files into the public media bucket, publishes a non-priced, non-bookable hotel directory entry in the existing `hotels` table, and makes its gallery available with RLS.
4. Existing `/api/hotels` country/category search and `/hotels/stay/{id}` detail page include reviewed, published owner hotels. Approved owner listings may appear in the hourly search sitemap.
5. Reject when claims or images cannot be verified. Rejected submissions remain private.

## Security
- Apply `supabase/migrations/20261017021000_hotel_partner_owner_onboarding.sql` exactly once to the GTH PRO Supabase project.
- Existing `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and **server-only** `SUPABASE_SERVICE_ROLE_KEY` must be present. Do **not** expose the service role key through NEXT_PUBLIC or the browser. The service key is read only after checking the user's session and (for publication) verified admin permission.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` must be configured, or uploads/submissions fail closed.
- Set Auth Email Redirect URL allowlist to include `https://www.gthproglobal.com/hotels/list-your-property` and `https://www.gthproglobal.com/admin/hotels`, if not already covered by configured site redirects.
- Private photos are never publicly readable before administrator confirmation and copying. The public gallery is RLS-gated by both `is_public` and `media_rights_verified`.
- Admin permissions **must** be provisioned securely in Supabase user `app_metadata` by an authorized identity administrator. Do not self-assign via clients, user_metadata or unverified email comparisons.
- Photo and email storage usage are subject to **Supabase quotas**. Google Maps Platform billing is **not required**; optional Google Places module stays off.
- Do not claim actual rates, live inventory, booked rooms or verified reviews without separate authorized supply feeds.

## Releases
Only merge production-build-verified PRs to main. Vercel should use its existing GitHub automatic deployment. Do not manually force deploy, redeploy or promote: its Hobby deployment quota has previously been reached.
