# GTH PRO — Canonical Version Register and Safe Consolidation

Audited: **2026-10-13**. GitHub: `p13780811-debug/GTH-tour-travels-booking`. This file records **observed source commits**, not claims of a released site.

## Immutable approved Real Estate UI baseline

**USER-APPROVED exact Vercel alias:** https://gth-pro-git-gth-inventory-onboarding-v1-etios-profession.vercel.app/real-estate

**APPROVED DEPLOYMENT COMMIT: `fdb66acb7f6160f53f30d4223a9154a49ef53572`** (Vercel deployment `dpl_EmDxyJxCS43psz4GfC4dxstAfvdW`, state READY). A branch name is **not** an immutable release pointer.

`gth-inventory-onboarding-v1` currently points to `6992e8571a4fb864edeca912100561481abe00f7`, FIVE commits after the approved deployment. Those 5 commits changed `RealEstateHero.tsx`, `Listing.module.css`, `OwnerProjectAds.tsx` and removed `property-story.jpg` and `property-story.mp4`. **Do not substitute the branch head for the approved design.** These post-preview updates require visual review before adoption.

**Hard protection for this candidate:** its ancestry begins at the exact approved deployment SHA. All files under `src/app/real-estate/`, `src/components/real-estate/`, `src/lib/real-estate/`, `src/app/api/real-estate/`, `src/app/api/admin/`, root `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, approved brand video assets and renderer are source-identical to `fdb66acb7f6160f53f30d4223a9154a49ef53572`, **except** the specifically documented *Python MahaRERA importer update* (not a UI file).

## Known branch/register map (checked on 2026-10-13)

| Branch / reference | Checked SHA | Role / disposition |
| --- | --- | --- |
| `main` | `09270c81` | Deployed production source; not comprehensive |
| approved Real Estate DEPLOYMENT | `fdb66ac` | **Visual truth; baseline for consolidation** |
| `gth-inventory-onboarding-v1` | `6992e857` | Five commits newer than approved preview, HOLD visual changes for review |
| `gth-homepage-v1.3` | `643032cb` | Ecosystem homepage PR #1, inspect separately; not the Real Estate URL |
| `gth-production-hardening` | `decfd01d` | Security work PR #2 merged; baseline history present |
| `gth-global-ecosystem-ui` | `56119b15` | Earlier UI branch PR #3; do not overwrite approved design |
| `gth-real-estate-production` | `8ab20b53` | Earlier Real Estate PR |
| `gth-real-estate-market-finish` | `a189ae5f` | Real Estate feature pass PR #4, now source history |
| `gth-maharera-csv-import` | `09270c81` | Latest MahaRERA importer and safe scheduler; PR #5 |
| `gth-travel-phase-b` | `80ad0cc9` | Travel API hardening PR #7 |
| `gth-travel-flights-v1` | `d33845e3` | Flights PR #8 |
| `gth-travel-hotels-v1` | `67b39ef` | Hotels PR #9 |
| `gth-travel-tours-v1` | `a879dc9d` | Tours and activities PR #10 |
| `gth-travel-editorial-v1` | `7fdc64de` | Blogs and guides PR #11 |
| `gth-travel-destinations-v1` | `fd7d8a44` | Destinations PR #12 |
| `gth-travel-transport-v1` | `70872b4b` | Bus/train/transfers PR #13 |
| `gth-hotel-catalog-ingestion-v1` | `9ca9848` | Secure OSM hotel catalog PR #14 |
| `gth-travel-global-release-v1` | `3a4487e` | Isolated newest Travel UI and tests PR #15 |
| `gth-pro-consolidation-candidate-v1` | *see Git history* | This controlled preview/integration candidate |

## Integration precedence, non-destructive

1. **Real Estate presentation and workflows:** exact approved deployment `fdb66acb7f6160f53f30d4223a9154a49ef53572`, immutable protected paths.
2. **Travel features:** only the 69 changed Travel files isolated in `main...gth-travel-global-release-v1`, not its inherited Real Estate history. This includes separate `/travel` landing page and its module links.
3. **Registry supply:** explicitly carry over the two latest non-UI main-branch MahaRERA CSV importer files `src/app/real-estate/services/rera_csv_import.py` and `tests/test_rera_csv_import.py`. These are the only exceptions under protected namespace.
4. **Root homepage:** do not swap `src/app/page.tsx` or root layout. Existing component `GTHHomeV13.tsx` receives only Travel-navigation updates; approved Real Estate `/real-estate` route is independently rendered by its own EstateHeader.
5. **Tenders:** no production-ready tender site has been verified. Do not invent an operational Tenders module or claim readiness.

## Release gates

The candidate is **not production-ready solely because TypeScript or build succeeds**. Required checks: SHA-level approved Real Estate file-integrity gate, Python registry importer tests, travel tests, application-wide security tests, lint, production build and browser smoke across Real Estate and Travel. Check actual partner credentials, full licensed hotel import, public verified inventory, SEO robots/canonical, partner attribution and backend RLS before public live release.

Observed data on connected Supabase project during audit: `hotels=331`, `tours=110`, `hotel_catalog=0`, all 331+110 records `is_public=false` (no verified live inventory). DO NOT change their publish flags merely to populate the marketplace.

**Do not merge into main or promote to production without explicit release validation and authorization.** Preserve old branches and historic commits.
