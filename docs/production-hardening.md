# Production hardening status

This branch is a reviewable hardening pass, not a declaration that production security is complete.

## Changes

- TypeScript 5-compatible deprecation setting restores CI typechecking.
- JSON endpoints reject malformed/non-object input and enforce streamed payload limits.
- Chat/history and AI suggestion inputs are bounded. AI providers have timeouts, output limits, safe error messages, and parsed response validation.
- Dates reject calendar rollover; integer validators reject unsafe numbers.
- Uploads verify the bearer session with Supabase getUser before parsing. Storage writes use the caller's JWT, not service-role privileges. Multipart bytes and decoded pixels are bounded. Paths are properties/<user-id>/<uuid>.webp.
- Upload UI forwards its session and stops when an upload fails.
- Remaining browser Pexels key references are removed. The image endpoint retains the key server-side.
- Hotel results use database listings instead of invented hotels, random ratings and random prices.
- Public tour/destination queries are bounded and do not expose database errors.
- Hooks linting is enabled; GTHNetwork no longer invokes hooks conditionally.
- CI includes security regressions and lint, with read-only repository permissions.

## Database checks required before release

Actual policies and grants are not in this repository and have not been verified against the deployed database. Do not disable RLS to make these flows work.

Inspect pg_policies and table grants for properties, leads, bookings, destinations, tours, hotels, and storage.objects. With an anonymous client and two ordinary users, verify:

- Anonymous callers cannot update/delete listings, read private leads/bookings, or upload storage objects.
- Owners can modify only their own listings; ownership comes from auth.uid(), not an unchecked client-supplied field.
- Admin/moderation privileges use trusted app_metadata or a protected role table. Never trust user_metadata for admin authorization.
- Storage INSERT permits only the property-images bucket and paths whose first folder is properties and second folder equals auth.uid()::text. Review UPDATE/DELETE and every existing permissive policy as well: policies combine with OR.
- Public booking INSERT remains subject to a deliberate RLS policy; insert must not require public SELECT of all customer records. The route returns only a success acknowledgement and does not request customer records after insert.
- Client-side propertyService mutation methods are not authorization boundaries. RLS must prevent forged updates, status verification, and deletes regardless of UI visibility.

The public /admin page currently disables administrative controls. This pass does not enable it or introduce a service-role key.

## Remaining deployment gates

- Configure and exercise the new Redis-backed limits against a real store before release. Missing/failed Redis returns 503, with no per-process fallback. Direct Supabase calls are outside this HTTP limiter and must be blocked/scoped with RLS and grants.
- Verify real provider credentials and provider responses in preview. Set only PEXELS_API_KEY, never NEXT_PUBLIC_PEXELS_API_KEY. If the old public key was deployed, rotate it with the provider.
- Verify login, owner property creation, upload ownership, booking access, and anonymous denial with the deployed RLS policies.
- Review remaining legacy lint suppressions independently; passing lint does not mean all recommended rules are enabled.
- Placeholder Supabase environment values used for builds establish compilation only, not live data or database access.


## Second pass

- Shared Upstash Redis counters protect AI, images, bookings and uploads. AI routes share one budget. Caller and global minute/day counters are checked and incremented in one Lua EVAL. No unbounded provider call is made when the limiter denies or fails. Invalid requests are rejected before provider calls; upload sessions are verified before user quotas.
- Limits are windows starting with the first accepted request, not sliding windows. Defaults: AI 20/minute and 100/day per caller, 100/minute and 1000/day globally; images 60/500 per caller and 300/5000 globally; bookings 3/10 per caller and 60/1000 globally; uploads 10/100 per verified user and 200/5000 globally.
- Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN server-side. GTH_RATE_LIMIT_NAMESPACE defaults to gth-pro; VERCEL_ENV separates production and preview counters. Use a separate preview store where possible. Deployments on the same environment share quotas; this is deliberate. Keys contain HMACs rather than raw user IDs/IPs. EVAL keys share a Redis hash tag.
- Trust x-vercel-forwarded-for only on Vercel. Other hosting and missing/malformed IPs share one bucket; they cannot bypass protection through arbitrary headers. Review trusted proxy configuration before changing this behavior. Global request caps bound application requests, not a currency-denominated bill; provider spend caps and edge/bot protection remain required.
- /api/admin/leads verifies the bearer session and app_metadata.role=admin, projects only needed fields, returns at most 100 rows and sets private/no-store. It still uses the caller JWT and relies on RLS; no service-role bypass is introduced. The dashboard no longer queries all leads directly or invents revenue from the lead count.
- Public boosts and automated verification writes are disabled. PropertyService.add defaults to review; transformed verification badges depend on stored verified status rather than a heuristic fraud score. Public paid-boost buttons clearly state they are unavailable.
- The standalone post-property form no longer reports success without a database write. It remains visibly unavailable until a validated owner submission API and ownership policies are ready.
- /api/flights/search reuses the validated handler, which has a provider timeout. Existing TRAVELPAYOUTS_API_TOKEN deployment naming is accepted as a server-only alias.
- AI interfaces show safe retry/unavailable messages, recover loading state and do not store failed replies in chat history.
- CI uses Node 24, matching the Vercel project runtime observed during this pass.
- supabase/audits/production-access.sql is a read-only catalog report covering expected tables, RLS, all storage policies, effective grants, ownership columns, public functions and views. It has not been run against the deployed database. Run it in the Supabase SQL editor, review the results, then test anonymous and cross-owner denial before designing a migration. Do not blindly replace existing policies.

## Deployment metadata observed during this pass

The Vercel gth-pro project's environment names include GEMINI_API_KEY, AVIASALES_API_TOKEN, TRAVELPAYOUTS_API_TOKEN and the two public Supabase variables. They do not include OPENAI_API_KEY, PEXELS_API_KEY, UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. The old NEXT_PUBLIC_PEXELS_API_KEY name is still present. Only names/targets were inspected; secret values and real service connectivity were not read or verified. No production variables were changed.

Before deploying, add the missing server-only settings through Vercel Settings → Environment Variables; use a freshly rotated Pexels key, remove its public variable, and run npm run check:production-env with the intended environment. Never paste secret values into a PR or commit them. Builds with CI placeholders do not satisfy this release gate.

Implementation references: Vercel request headers (https://vercel.com/docs/headers/request-headers), Upstash REST API (https://upstash.com/docs/redis/features/restapi), Redis scripting (https://redis.io/docs/latest/develop/programmability/eval-intro/), Supabase RLS (https://supabase.com/docs/guides/database/postgres/row-level-security).

The limiter/auth unit tests mock provider transport. They validate request construction, denial, failures, identity and role checks; they do not prove real Redis execution or deployed RLS.


## Real estate continuation (2026-10-10)

Reviewed real-estate routes, components, shared services, ranking/search data scripts and related API consumers. Supabase screenshots establish only that properties/leads have RLS enabled and four policies each; they do not establish policy safety or app connectivity. No database policy changed.

Implemented canonical property normalization (bedrooms/bathrooms/area_sqft), no invented amenities/dimensions/coordinates/verification or growth prediction, bounded inventory reads, database filtering/order before pagination, category query correction, auth subscription, load/error/retry/empty states, schema-compatible detail fetch, correct canonical domain and real account profile. Removed separate hardcoded mobile inventory by redirecting to responsive inventory. Fixed map async cleanup and numeric marker HTML.

Remaining completion gates: actual property price units and columns; owner/agent identifiers; insert/moderation policies; saved_properties table is absent from screenshot inventory; admin membership and lead policy rules; upload storage rules; provider/Redis configuration; live enquiry/save/publish/admin E2E verification; existing legacy component hardcoded colors and promotional claims still need cleanup under global CSS. Existing ingestion scripts and generated properties.json are not proof of real verified inventory and were not executed. Do not present this pass as complete production readiness.


Live schema supplied by owner: properties.price is text; cities has name not city; contact_inquiries only id/created_at; saved_properties absent from provided results. Text price labels are preserved without guessing units. Numeric budget filters/sorts reject rather than compare text or return misleading subsets. A normalized numeric amount/currency model is needed before these can be enabled. Enquiries now use a bounded validated server endpoint with shared quotas, existing property check and acknowledgement-only insert into leads; no service-role key or client-side RPC counter mutation. Live insert access remains unverified.


## Property image provenance

No image approvals have been established. Existing database media remain untouched, but property cards/details and property-specific social metadata cannot render them until their exact URL is reviewed in src/lib/real-estate/approved-media.ts with source and permission reference. The registry is initially empty. PropertyImage handles missing/unapproved/broken images with a text state and labels approved renders. Stock hero slider removed. SQL media inventory is read-only and has not been executed. Approval is separate from property verification and from upload validation. Do not enter credentials, private document contents or customer details in the registry. Review evidence reference should identify an internal review record without exposing it.


## Estate actions

Detail enquiries/visit requests connect to the validated enquiry endpoint, display actual HTTP outcome and never confirm appointments. Share uses native share or clipboard fallback. No saved_properties backend exists in supplied schema, so saved actions are disabled rather than simulating success. Unconditional detail/card verification labels removed; stored status drives listing label. Missing rank no longer defaults to #1. Browse pagination supports bounded 100-row pages; search still returns at most 100 matches. Mobile search navigation points to the real listing search anchor. No-price recommendations use city/type instead of zero-price comparisons. These changes do not verify live inserts or RLS.


## Ingestion-ready discovery

Added country/city, type, purpose, bedrooms and stored-rank/latest filters with URL persistence; these reflect available rows, not claimed worldwide inventory. Source details render supplied developer/registration/geography/dates without converting registry data into GTH verification. Public service projection excludes raw_json, created_by and unrelated internal ingestion fields. Realtime refresh invalidates cache; without a enabled realtime publication, reload reads new rows after cache expiry. No import was executed.

Legacy rera_mumbai_v5 importer now omits unknown city and missing price/coordinates/promotional fields from re-import payload, preserving existing values on updates. It uses registry source metadata. Its browser automation and old portal endpoints still need validation against current official portal before use; no CAPTCHA bypass or harvesting run was performed. Conflict target rera_id requires an actual unique constraint, not merely the column's existence. Owner submission/saved workflows, database rules and live access remain completion gates.

## Saved and comparison
Device-only saved slugs (maximum 50) and live-record comparison (maximum 4) are implemented. No PII or property snapshot stored in browser storage. Storage failure gives an error rather than pretending to save. Cross-tab storage events refresh saved state. Missing/deleted records remain removable. Prepared saved_properties migration restricts authenticated callers to their own rows; it has NOT been executed and account synchronization is not enabled. Existing table-name collision fails the migration rather than overwriting a pre-existing table. Device data must not be described as account data. Owner submission/moderation still require a separate reviewed schema and live validation.
