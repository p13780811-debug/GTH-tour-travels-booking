# GTH PRO Real Estate production upgrade

This upgrade runs within the existing Next.js App Router application. Global navigation, Real Estate header/footer, policy routes, global CSS, account workflows and property publication are preserved. It uses the existing public marketplace search, shortlist, comparison, registry facts, published inventory, map, assistant, partners intake and administrator CRM.

## Setup

Use Node 24 and the committed dependency lockfile:

```bash
npm ci --legacy-peer-deps
cp .env.example .env.local
npm run dev
```

Configure these through your local environment or deployment provider; never commit real values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
UPSTASH_REDIS_REST_URL=https://YOUR_REDIS_ENDPOINT
UPSTASH_REDIS_REST_TOKEN=YOUR_SERVER_ONLY_TOKEN
# Optional approved public referral URL. No bank affiliation is assumed.
NEXT_PUBLIC_HOME_LOAN_AFFILIATE_URL=
```

`SUPABASE_URL` can optionally override the server database URL. The service role is imported only through `server-only`. Missing database or shared Redis configuration makes lead submission return a safe 503; it never pretends to save a lead. Existing Redis enquiry limits remain in effect (per-client and global quotas).

Apply **only** `supabase/migrations/20261019165857_real_estate_buyer_leads_and_property_seo.sql` to the intended project using the normal reviewed migration process. Do not blindly push unrelated pending historical migrations. This additive migration creates the private buyer table, approved PDF catalogue, service-only atomic capture function and read-only project SEO view. It also expands the legacy CRM source constraint to accept the source values already used by the existing quick enquiry route.

## Modules

- `src/lib/propertyImages.ts`: deterministic commercial / high-rise / township stock imagery and source credits.
- `src/components/real-estate/PropertyImage.tsx`: approved project photos first, labelled stock fallback, responsive images, blur-up, secondary-image fallback and graceful network failure.
- `src/components/property/PropertyGallery.tsx`: reviewed gallery or three clearly labelled exterior / sample interior / aerial inspiration photographs. Stock photographs do not establish this project's location, finishes, amenities or floor plans. Generic blueprints are deliberately not presented as project plans.
- `src/components/property/LeadModal.tsx`: pricing, brochure and visit requests; explicit contact consent, accessible native modal, retry reference and confirmed-success state.
- `src/app/api/property/lead/route.ts`: bounded same-origin request, strict validation, shared rate limiter, private writer and approved document projection. No raw contact logging or external notification webhook.
- `src/lib/real-estate/buyer-leads.ts`: shared phone normalization and field validation; safe PDF link parsing.
- `src/components/property/HomeLoanCalculator.tsx` and `src/lib/real-estate/emi.ts`: local fixed-rate EMI illustration, including zero interest. Only an explicitly configured HTTPS referral link activates the sponsored CTA; there are no bank or pre-approval claims.
- `src/components/property/PartnerHandshake.tsx`: developer/broker onboarding through the existing private partners application API. RERA authority is reviewed before any partnership or lead handoff.
- `src/lib/real-estate/property-seo.ts`, dynamic project page, `src/lib/seo/large-sitemaps.ts`: source-linked project metadata and weekly project sitemap shards.

## Buyer data and admin workflow

The browser cannot read or insert `property_leads`, or execute `gth_capture_property_lead`. The backend validates a 10-digit Indian mobile number, name, optional email, enumerated unit/budget/intent, project ID, explicit consent, honeypot and UUID request reference. The project title comes from the database, not the client.

One database transaction writes the detailed buyer record and an existing `leads` CRM entry, joined by `legacy_lead_id`. Replaying the same request reference does not duplicate either record. Reuse with a different project, phone or intent is rejected. A failed document lookup after capture still returns a successful saved enquiry with no PDF links.

The existing admin endpoint verifies the user with Supabase Auth, requires `app_metadata.role=admin`, and joins buyer details through administrator-only RLS. Contact information is never included in public property responses or sitemaps. The existing CRM `leads.status` remains the operational pipeline status; `property_leads.status` is its intake snapshot. Restrict access and retention through your established CRM administration process.

## Approved project PDFs and photos

No brochures or floor plans are fabricated or seeded. Add a PDF only after reviewing its project binding and publication rights. The private `permission_reference`, source URL and review timestamp record the approval evidence. Publish using an authorized service/admin process with `rights_verified=true`, `is_public=true` and `reviewed_at` set. Browser reads are limited to the public metadata columns; approval notes remain private. Only safe HTTPS `.pdf` URLs are returned to enquiries. A missing PDF records a follow-up request instead of promising an instant download.

Actual property photographs retain the existing exact listing / asset permission checks in `src/lib/real-estate/approved-media.ts`. Stock inspiration is never written to property source data or counted as verified project evidence.

The curated source-page URLs live alongside each image in `PROPERTY_VISUAL_BANK`. Pexels photographs use the [Pexels License](https://www.pexels.com/license/) (commercial use allowed; review its restrictions before replacing assets). Review date: 2026-10-19. All 11 CDN assets were browser-tested successfully. The gallery provides the selected source credit. Stock imagery is illustrative, not a property advertisement photograph or evidence of a bank relationship.

## SEO and rollout

Production indexing preserves the existing `VERCEL_ENV=production` and `GTH_PUBLIC_LAUNCH_ENABLED=true` gates and canonical origin configuration. No visibility flag is switched on by this feature.

`/sitemap-index.xml` advertises every eligible project shard at `/seo-sitemaps/properties/{page}.xml` (1,000 records per shard, stable slug order). The existing `/sitemap.xml` also includes the first shard for compatibility. Project coverage is not capped at the first 1,000 records. Eligibility requires a non-archived, valid slug and title, a valid MahaRERA reference and an official MahaRERA source host. Missing source evidence is excluded. At validation, 11,745 profiles qualified across 12 shards; this is discovery coverage, not proof of search-engine indexing.

Individual metadata includes the exact project name/locality, MahaRERA reference and requests for pricing/documents, without asserting that units, prices or PDFs are available. Unknown or unsafe slugs return 404. Inventory and related-project reads run in parallel and can fail without blocking the project profile.

## Validation

```bash
npx tsc --noEmit
npm run lint
npm run test:security
npm run build
```

`tests/property-production-upgrade.test.mjs` covers malformed / oversized / cross-site requests, Indian phone normalization, consent, enum validation, private RPC errors, repeat references, document outages, admin CRM enrichment, EMI calculations, unsafe links, media mapping and project SEO eligibility. SQL validation uses a rolled-back synthetic transaction to prove atomic CRM linkage, idempotency, anonymous denials and administrator RLS visibility, leaving zero test buyer records. No external broker message, loan application or visit booking is sent by validation.
