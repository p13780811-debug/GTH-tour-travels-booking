# GTH PRO RE MASTER #98 — Rights-cleared media pipeline (RE-07/08/09)

**2026-10-20 — STAGED. Not deployed. Requires parent draft PR #116 (RE-05/06).**

## RE-07 Supplier sourcing and licensing policy

| Candidate source | Allowed basis | Decision |
| --- | --- | --- |
| Original builder/owner/agent media | Exact registered project, documented permission, verified claim | Private upload and independent review |
| Licensed builder/agency feed | Written agreement explicitly permits redistribution and commercial use for the matching project | Metadata candidate only; no downloading/publication |
| Commons/open-licensed exact-building photographs | Exact building identity plus individual commercial reuse/attribution review | Candidate only, subject to owner/rights validation |
| Generic stock photos or AI exteriors | May be labelled editorial inspiration elsewhere | NEVER presented as the actual project |
| Other portals/Google Images | Search visibility is not permission | No scraping or redistribution without explicit authorization |

Feed contracts are configured in the server-only GTH_RE_MEDIA_SOURCE_CONTRACTS environment variable. Expected JSON ARRAY of objects:

    [{"key":"approved_builder","origin":"https://media.example.org/","agreementReference":"SIGNED-SUPPLIER-AGREEMENT-REFERENCE","rightsBasis":"documented_license"}]

The example is a **shape**, not a genuine approved partner. Do not add it to production. With no signed contracts this endpoint refuses intake. POST admin-authorized candidate metadata to /api/admin/property-media-feeds, up to ten records per batch: external_reference, exact rera_reference, HTTPS source_url on configured origin, media_type, permission_reference and optional attribution. Imported candidates are admin-only and pending, never public images. Server performs no remote photo download.

## RE-08 Moderation and delivery

1. Use PR #116 secure exact-RERA project claim + private sanitized 1800px WebP upload. Each claimant must attest independently checkable authority and rights; file bytes stay private.
2. Another admin independently approves claim and media after checking original subject, supplier permission, signed agreement, attribution, identity and license restrictions. Admin review notes mandatory.
3. An explicit second-stage admin publish request is required through /api/admin/property-media-publication; authorization checked in PostgreSQL SECURITY DEFINER RPC; matching project claim and approved media required, no implicit status escalation.
4. Public gallery sees only approved metadata by exact project ID. A server-only image endpoint /api/property-media/[id] rechecks current rights/claim/publication status on every request; never returns private bucket keys or signed Storage URLs.
5. On takedown, the database public RLS policy denies metadata and image endpoint returns 404. Responses are no-store. Admin can review and revoke on /real-estate/media-review.

## RE-09 Frontend and SEO

Existing PropertyImage, ExplorerCard and PropertyGallery use exact project-ID approved media; absent approval they display a distinct title/RERA cover, not repeated misleading stock photos. Renders, floor plans and attribution are explicitly labelled. Max 1800px sanitized WebP, lazy decoding, responsive container dimensions and alt text are reused. Property detail OpenGraph and primaryImageOfPage include images only when actually published. Existing sitemap framework and global CSS are unchanged. When approved images exist, coordinate actual image-sitemap inclusion with the separate SEO owner rather than creating thin/fake entries.

## Gates before REAL completion / release

- [ ] Parent #116 migration applied during a single approved consolidated release (not now).
- [ ] Licensed builder/agency source and original rights-cleared project photos actually supplied and independently approved (no fake live claims).
- [ ] Source identity/permission manually checked for a representative real pilot before scaling.
- [ ] Actual Supabase Auth/Storage E2E and malware/rights handling verified on approved safe environment.
- [ ] CI Node, TypeScript, ESLint, protected Real Estate/platform build and isolated PostgreSQL17 RLS tests pass.
- [ ] Desktop/mobile 360/390/768/1280 and day/night browser smoke, original photograph rendering and takedown check on release SHA.

**Release**: branch feature PR #117 with previews disabled, dependent on PR #116. Preserve original global CSS, navigation/footer and separate public.properties registry vs public.property_inventory unit inventory. Do not merge or deploy independently.
