# GTH PRO Five-Feature Suite — Stacked Staging Release

Do not merge this feature branch to main. PR base: release/gth-one-shot-pending-20261020 (#121).
Feature branch includes its own Vercel deploymentEnabled=false guard. When approved,
merge this feature PR into PR #121's release branch; perform ONE final release from
#121 to main after resolving migrations and manual verification. No API keys added.

## Scope & evidence labels
1. Contextual property -> flights points to the EXISTING Aviasales White Label
   /flights#flight-search. User selects departure city, date and guests.
   No cached fare API and no fictional lowest live prices.
   Tours/destinations -> existing Real Estate city filters, preserving registry/inventory distinction.
2. Smart search extends /search using a local deterministic intent parser and
   rate-limited /api/smart-search. No external AI cost, false semantic results, or
   speculative hotel proximity. Queries like "2BHK near metro in Andheri under
   1.5 Cr" map city=Mumbai, query=andheri, bedrooms=2, INR maxPrice=15000000.
   Full proximity understanding requires trustworthy place geo-data before launch.
3. Locality evidence preserves existing record-coverage score as DATA COMPLETENESS.
   RERA references and source link are presented as recorded, not "100% verified".
   Airport travel time and metro proximity remain unmeasured until trustworthy
   geospatial+route data is available. No synthetic figures.
4. Property/tour dossiers are browser-print pages including rights-approved
   photos (where published), source fields, disclaimers and official@gthproglobal.com.
   The export action uses the browser's Print/Save as PDF dialog, not a native
   direct-file PDF download. WhatsApp is user-initiated via wa.me text share.
   Trip saving is device-only, with an explicit limit.
5. Existing manifest, installer, mobile routes remain intact. Improve motion and
   swipe-to-close property filters; service-worker caches hashed public static
   assets only, never APIs, accounts, booking results, private photos, or HTML.
   Offline navigation shows an informational fallback, not stale bookings.

## Release gates
- [ ] TypeScript and Next production build pass for the exact SHA.
- [ ] Existing Real Estate, Tour, Hotel, Flight, PWA and source trust tests pass.
- [ ] Test 2BHK+INR, hotel-in-Paris, city travel->property links, mobile filters on Android/iOS.
- [ ] Test print preview, source-backed images, link share and screen reader controls.
- [ ] Verify Aviasales white-label still renders supplier search and results.
- [ ] Resolve all PR #121 migrations/storage/media blockers before final deployment.
- [ ] Obtain owner approval to merge into release branch and later main.
