# GTH PRO RE MASTER #98 — RE-04, RE-05, RE-06 execution ledger
Date: 2026-10-20. Canonical inventory: https://github.com/p13780811-debug/GTH-tour-travels-booking/issues/98

## Release protection
This is one existing GTH PRO ecosystem, not a new property website. The scoped feature branch `feat/re-master-98-rights-safe-claims-20261020` is held back from Git deployment in `vercel.json`. Do **not** independently merge or deploy; stage with open PR #97 and the parallel SEO owner for a final consolidated one-shot release. No production schema or stored media was changed by this PR. Main GTH global CSS, Navbar, footer, pricing, listing approval, CRM, and the published public photos are untouched.

## Correct production data model (read-only verification)
Verified 2026-10-20 against production Supabase `dqprqjmhxjnrllczqyhz`:
- `public.properties` — **12,587 registry/discovery records** in the base table, of which **11,747** have `source_type='registry'`. Remaining records are not automatically active sale/rent units.
- `public.property_inventory` — **0 unit inventory records** in this observation; this is a separate optional authorized marketplace table linked to `properties.id` via `project_id`. Zero inventory rows do **not** mean that the `properties` table is empty or corrupted.
- `public.property_leads` — **0 buyer-enquiry rows**, separate from base registry and inventory. `gth_capture_property_lead` writes a `property_leads` row and links its `legacy_lead_id` to `public.leads` in the same database transaction.
- `public.leads` — **0 legacy/admin CRM rows** in this observation; it also has optional `inventory_id` referencing `property_inventory.id`.
These are **four different measures**. Do not infer live sale/rent availability, lead conversions or site health simply from record counts. No code/data migration or production mutation was performed for these counts. RE-03 (#101) remains under the parallel chat.

## RE-04 / Issue #102 — technical audit; dependent / blocked
- Existing property sitemap: `src/app/sitemap.ts`, `src/app/sitemap-index.xml/route.ts` and `src/app/seo-sitemaps/[kind]/[page]/route.ts`; `src/lib/seo/large-sitemaps.ts` contains the `properties` config and 1,000-URL shards.
- Property metadata and canonical: `src/app/real-estate/[slug]/page.tsx` and `src/lib/real-estate/property-seo.ts`. Canonical uses the configured public-origin helper and detail-page robots gate uses `isIndexableProperty` + `isPublicLaunch`.
- Current eligibility requires a RERA ID, valid slug/title and an official MahaRERA HTTPS URL. **It does not require a useful original project description, current authorized media, published unit inventory, or independent verification.** The title template says “Floor Plans, Price” even where none is available; this needs an evidence-backed review by the separate SEO work owner rather than a conflicting patch.
- Master creation audit: 12,587 base properties, only 33 description strings >=150 chars, 0 nonempty galleries. This is not evidence of indexing or Google clicks.
- **BLOCKER**: #99 Search Console domain property exports for 28d/90d, URL inspection and canonical/index coverage, and #101 data-provenance baseline are being handled in another chat. No 100-URL SEO crawl, genuine GSC click/impression baseline or postrelease indexing verification has been performed here. Keep #102 open. Give the SEO owner the risks above and ask them to append verified fixes/evidence to #102, not duplicate their PR.

## RE-05 / Issue #103 — rights-safe schema staged
Migration: `supabase/migrations/20261020091500_re_master_98_project_media_claims.sql`.
- New exact project `property_project_claims` linked to existing `properties.id` and `rera_id`, enforcing `source_type='registry'` at insert. No claim auto-confers legal ownership or unit inventory authorization.
- New `property_claim_media` carries claim/project link, private object key, SHA-256 duplicate guard, supplier, attribution, photo vs render vs plan, source URL, license basis, permission reference, upload attestation, independent reviewer/time/status and review notes.
- New **private** `gth-re-claim-media` bucket (5 MB processed WebP only). The **existing public** `property-images` bucket is not used for new claims. Storage RLS allows only owner-scoped authenticated uploads/reads or app-metadata admin review reads.
- Per-table RLS, restricted column-level insert grants, no direct client UPDATE/DELETE, default `pending`, admin-only review RPC. Reviewers cannot self-approve their own claim or media. Media review checks previously approved matching claim and existing private object.
- Neither candidate nor approved media appears on live property cards. RE-07/08 and RE-09 must finish independent rights verification, media moderation/public-delivery, opt-in image SEO and takedown workflow **before publication**. Existing legacy image URL flow has not been retroactively audited for every permission. Do not treat the old URL field or public storage path as a rights certificate.

## RE-06 / Issue #104 — authenticated claim/media UX staged
Routes: `/real-estate/claim-project`, `/real-estate/claims-review`, `/api/property-claims`, `/api/property-claims/media`, `/api/admin/project-claims`, and `/api/admin/project-claims/preview`.
- Claimant signs in using the existing Supabase email login and references an exact Maharashtra MahaRERA project. Zero/ambiguous project matches fail closed. Agent/developer/owner status and evidence attestation are not a substitute for administrator verification.
- Server validates source inputs, signed-in JWT, shared Upstash rate limits, MIME and actual image decoder, 30MP cap, animated file rejection and re-encodes to bounded 1,800px WebP. New media are *private candidate uploads only*, never auto-published.
- Signed moderator previews expire after 60 seconds. Admin review is private with evidence and separate decisions. The protected existing post-property/admin routes were restored byte-identically to main to pass the ecosystem integrity guard. The new claimant onboarding link is added to the independent /partners page; admin queue is at /real-estate/claims-review. No existing handler is replaced.
- **Outstanding before issue closure**: CI and full production build, private-bucket integration test in an isolated non-production database, actual authenticated end-to-end submit/upload/independent review including negative permissions; external malware scanning/rights documentary checks; storage orphan cleanup/takedown and user-facing claim status revalidation; postrelease smoke at the final production SHA. Sharp decoding and sanitization alone are NOT an antivirus/rights verification system.
- Unsupported world registries are intentionally directed to the existing partner application, not deceptively treated as MahaRERA IDs.

## Regression / release checklist
1. Run `node --test tests/re-master-98-project-claims.test.mjs`, then full `npm run test:security`, `npm run lint`, `npx tsc --noEmit`, `npm run build`. Review the GitHub Actions jobs against the exact PR head SHA.
2. Validate migration on isolated database/transaction before consolidated production rollout; verify RLS denied to anon/unauthorized JWT, admin separation, the private bucket and full no-publish behavior. No direct production writes while work is incomplete.
3. Review permissions, copied evidence provenance, claimant identity, license documents, issue audit and media takedown; get approval before any photo is exposed.
4. Resolve potential Vercel deployment-config diff conflicts with PR #97, preserve that styling PR unchanged; merge only one final approved consolidated production release.
5. Independent security finding (not changed here): `public.cities` has RLS disabled. Treat as a separate security review; do not blindly alter shared cities/Travel lookup permissions in a media workflow.

Rollback (if rollout is later explicitly approved): disable claimant routes first, retain evidence/legal review logs under access control, revoke reviewer grants as needed and coordinate a migration rollback; never DROP private evidence with pending legal/takedown obligations.

Status note: This document is technical code/design evidence, NOT an assertion of production readiness or completion of #102/#103/#104.
