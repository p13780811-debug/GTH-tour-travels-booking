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


## Owner submissions and moderation

Prepared listing_submissions schema with typed checked fields, ownership defaults, owner/admin read access and column-level INSERT grants. Caller cannot supply publication/moderation fields. No direct UPDATE/DELETE grants. Admin review RPC validates app_metadata role, locks pending row and atomically publishes a new listing then updates queue status. No verified badge or approved images assigned by approval. RPC uses empty search_path, fully-qualified names, explicit EXECUTE grant, and no service-role in browser/API. New listing primary-key generation and properties insert constraints must be confirmed in live schema before applying/testing; information_schema column_default does not establish identity configuration. Migration NOT executed. Existing property policies unchanged. Form/admin UI/APIs are implemented, but return unavailable until migration/configuration/access are available. No claim of live publication. No owner edit/media/price workflow is enabled by this first review submission release.

## Registry write safety (current behavior)

Registry imports now insert new RERA IDs only, using ON CONFLICT DO NOTHING. Existing listings are skipped entirely; source changes need a separate reviewed update process. This supersedes the earlier re-import update behavior described above. New payloads whitelist title, RERA ID, developer and location, with India/Maharashtra source metadata and deterministic slugs. Primary keys, prices, photos, ratings and scoring fields cannot be copied from incoming records. Registration does not establish a GTH verified claim. All records in a batch are validated before that batch writes; separate batches are not a single transaction. A failure after earlier batches have committed can leave a partial run; rerunning safely skips existing IDs.

Collection pagination and ingestion checks run without external services in CI. Current portal endpoints, table column mapping and live Supabase insert access remain unverified; do not run the browser importer until portal mapping is confirmed. Owner supplied SQL execution and object existence evidence for listing_submissions and review_listing_submission; this does not establish end-to-end publication success. Both Redis variable names are present for Preview; runtime connectivity is still unverified.

## Listing discovery and component upgrade

Main listing search now performs a bounded database text search using the same URL filters and pagination as browsing; it no longer sends a zero budget or requires AI configuration. Category actions map to actual listing_type/property_type fields and synchronize the filter form. Reset clears both text search and filters. Out-of-order inventory requests cannot replace newer results; request failures clear stale inventory. Browser history changes refresh the inventory. Numeric budget search remains unavailable pending normalized prices.

RealEstateHero and PropertyCardPro use the existing global theme tokens and classes. Removed fabricated suggestions, unsupported hero tabs, external location lookup, broken voice submission and unsupported sidebar shortcuts. Featured listings are explicitly labeled as stored featured inventory, not AI-personalized picks. Cards use semantic links and separate save/enquiry actions; enquiries lead to the existing validated detail form. Unused add/boost/dashboard modal flows are removed from the listing entry page. No global CSS rewrite or property-photo approvals were added. Browser visual and live database E2E verification remain pending.

## Project storytelling layout

Replaced duplicated slug-route presentation with one detail journey: identity and stored price, approved media gallery, overview and reported measurements, project records, stored-coordinate location and enquiry. Removed the route's default AI score 92, rupee prefix applied to arbitrary text prices, unsupported premium boost promotion and duplicated recommendation blocks. Related properties are bounded database results filtered by the recorded city, not a claim of AI personalization. Gallery accepts only exact listing media approvals and labels architectural renders. Missing coordinates never receive an approximate pin. Map and listing assistant load on demand; no permanent client detail cache or recent-view storage parsing remains. Shared CSS module adds only layout and button dimensions while retaining global classes and tokens. No main-homepage cinematic effects or global CSS changes were introduced. Live data and browser visual validation remain pending.

## Discovery usability

Discovery now has consistent local navigation for saved/compare, submission and account, a 24-record page size, explicit list/map views and useful reset/retry/end-of-results states. Current page is stored in the URL; new searches and filters restart at page one. Realtime refresh preserves that URL page. The listing request starts independently of auth lookup. Map loads only when requested and displays current-page records with actual stored coordinates. Removed heavy sidebar, duplicate featured display and intrusive discovery AI popup; the contextual detail assistant remains available. Mobile navigation links directly to Explore, Search, List, Saved and Account and uses global theme values, with safe-area padding. Submission page owns the sign-in requirement, avoiding a second broken mobile posting modal. No total inventory counts, coverage or availability verification are implied by page counts. Full browser and live-flow verification remain pending.

## Account and sign-in usability

Sign-in uses a native modal dialog with focus containment, Escape close, scroll lock and restored opener focus; email form supports Enter, labels, bounded input and announced outcomes. Global theme tokens replace hardcoded authentication gradients and promotional claims. Successful API request wording does not assert email delivery. Email redirect returns to the current real-estate path; Supabase redirect allowlists and actual mail delivery remain live configuration checks.

Account workspace loads up to 50 authenticated submission statuses through the server endpoint, with loading, unavailable, refresh and empty states. Sign-out is guarded while pending. The history endpoint explicitly filters owner_id by the verified caller even when the caller is an administrator, rather than relying solely on the broader admin RLS read policy. Owner-filter and no-store behavior have a regression test. No live sign-in, mail send, submission or moderation test was performed by this pass.

## Shortlist and submission finishing

Saved/compare has approved-media previews, refresh and empty states, accessible comparison headers and a focusable horizontally scrollable table. Removed or unavailable listings are pruned from comparison selection so they cannot consume the four-listing cap. Device reads load five records concurrently at a time rather than fifty. Storage errors clear stale results and are surfaced. Missing listing reads are described as unavailable, not proof of deletion. Account sync remains unavailable.

Submission form now provides field-level guidance, required lengths, description character count, disabled fields during requests and separate success/error outcomes. FormData is captured before disabling fields and before asynchronous auth lookup. Failed requests retain current entries; success resets the form and links to account review status. No draft is persisted in browser storage; opening an email link in another tab does not transfer an unsaved draft. Pricing and media collection remain unsupported by this basic submission workflow. These UI changes do not establish live submission success.

## Review workspace finishing

Admin workspace now distinguishes auth loading, signed-out, ordinary-account and administrator states. Server authorization remains authoritative. Pending queue errors clear stale rows, and auth changes invalidate outstanding reads. Publication/rejection requires a second explicit inline confirmation describing the actual effect; cancel makes no request. Mutating decisions disable duplicate actions. Successful decision messages are separate from queue refresh errors; uncertain responses instruct the reviewer to refresh before deciding again. Publication does not mark properties verified or approve media. No actual decision, publication or privilege assignment was performed during this UI pass.

## Related APIs and legacy entry points

Similar and legacy ai-recommend endpoints now share bounded related-record queries with explicit public projection, excluding raw_json and created_by. Current listing lookup uses only id, city and property_type; the current slug is excluded from returned results. A recorded city drives related results, with recorded type as fallback; missing relationship fields return no unrelated suggestions. Lookup/database failures give safe unavailable responses rather than empty success. Legacy POST accepts bounded input but browsing history does not become a source of recommendations or ownership data. API compatibility name does not establish AI generation. The alternate real-estate-new landing redirects to the main maintained real-estate page, removing a second hardcoded theme and unsupported navigation from public access.


### Property map usability and data integrity

- Replaced narrow wrapping markers with fixed-width, single-line labels using existing global theme tokens. Full stored price remains visible in the popup.
- Marker content uses DOM textContent instead of interpolated HTML. Removed synthetic uniform heat intensity.
- Only finite numeric coordinates within geographic bounds are mapped, including zero and negative coordinates. Viewport fits actual available coordinates; wheel zoom does not capture page scrolling.
- Stored price text keeps its supplied currency. Missing prices show Price on request; numeric values do not imply INR. Tile failures display a recoverable notice.
- Validation: TypeScript, ESLint, all 39 security tests, and production build passed with placeholder build-only Supabase configuration. Protected preview browser verification and live data checks remain pending.


### Consolidated real-estate presentation and journey pass

Reviewed discovery, project detail, saved/compare, submission, account and existing admin review flows together. Reworked discovery around property search instead of a marketing journey sidebar. Added compact expandable filters, visible/removable URL filter chips, selected-category state and loading skeletons that prevent stale results being shown during a new search. Filter application/reset clears pagination.

Cards now use a consistent property-first hierarchy: available type/purpose, title, location, supplied price, reported specifications and detail/enquiry actions. Reduced nested glass boxes and kept approved-photo gating. No stock photos, global coverage totals or inferred verification claims were introduced. Detail verification guidance now asks for source-document confirmation.

Added shared workspace navigation across detail, saved, submission and account routes, plus a real-estate route layout with metadata and a theme-token footer linking existing policies and the ecosystem home. Changed the outer layout wrapper to a div so individual page main landmarks are not nested. New layout styling uses existing global colors/buttons and responsive CSS modules.

Release gates still outstanding: protected-preview day/night desktop/mobile visual inspection; authentic inventory/media population and approval; live Supabase policy/role audit; real email login, enquiry, moderation and rate-limit flow verification; current MahaRERA portal adapter validation. These cannot be certified by a local build with placeholder Supabase environment values. No live enquiry, import or moderation action was performed in this pass. This is a consolidated code/design pass, not certification that the entire international product is finished.
