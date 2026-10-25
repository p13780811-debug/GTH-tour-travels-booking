# Mobile travel page width and flight services — 25 October 2026

The owner reported that Flights/search results were constrained inside an extra host card and that app Flights omitted the available airport services. The attached reference shows a clean mobile search layout. Logo changes were explicitly deferred and branding assets/header are unchanged in this release.

## Changes

- Shared Aviasales White Label renders directly in a full-width page section, without the extra outer card. The supplier results mount has no horizontal host padding. Form labels and explanatory copy retain a single 16px mobile inset.
- Both /flights and /app/flights remove the second container inset. On the website's mobile results route the promotional hero is hidden, keeping results higher in the viewport. Desktop hero and approved global navigation remain.
- App Flights exposes compact airport-transfer, car-rental, flight-protection, airport-extra and tour links, and reuses the existing full category/provider chooser below the flight search. Labels, destination routes and category images share one module; partner destinations remain the existing fixed allowlist.
- /app/hotels removes a duplicate wrapper inset so its search frame has the same phone width as /hotels. The full-window phone supplier hotel-results flow is unchanged.
- No root layout, global CSS, logo, protected Real Estate code, database/auth logic or secrets are changed. No supplier results iframe or new supplier URL was introduced.

## Verification and release

488 regression tests, strict TypeScript/lint and the production build are required. Browser layout checks cover website/app flight search and result routes at 360, 390, 430, 768 and 1440px; full host results width, zero added flight iframes, route preservation, service links/category selection, day/night and matching phone hotel-form widths. Local supplier scripts are explicit layout/routing fixtures; live supplier forms are verified separately after release. No physical phone, checkout or payment claim.

Feature branch previews are disabled. Release only after exact-head applicable CI passes, through a single merge to main and the existing Git→Vercel integration. Rollback: main 4e92763c056e5c8bef3c263e9adeb31fc40719a4, deployment dpl_2XmTSh4mHGwENqb5idrfZxsZbRv9.
