# GTH PRO — Independent native mobile app

This is a **separate Expo/React Native app**, not a WebView wrapper for
`https://www.gthproglobal.com/app`. Native UI lives entirely in this
directory under one feature branch/PR. It does not edit the main GTH PRO
website, its existing PWA, APIs, layouts, hotel/property/tender integrations,
Supabase policies, importers, or global CSS.

## What is implemented
- Native React Native Home, Discover, Research Desk and Services tabs.
- Premium photography from existing GTH PRO editorial assets, not fake listings.
- User-controlled native hotel/property/tender/tour search against the **existing**
  public HTTPS endpoints; no new database or API.
- Read-only source-derived records with manual handoff to original verified
  hotel/property/tender detail pages and booking/provider flows.
- Saved exact record IDs on the phone via AsyncStorage (not synced to user accounts).
- Device day/night appearance based on **generated tokens from the existing**
  `src/app/globals.css`; the website theme remains the source of truth.
- 11-second network cancellation and retry UI; no fabricated records or prices.
- Explicit Tender country selector (India, US, UK, UAE, Singapore, Australia) and opt-in Worldwide search; no GPS inference.
- Bus, global rail and ferry entries reuse the existing GTH PRO `/bus`, `/train` and `/ferry` planners after the same explicit website-handoff confirmation as other booking services.
- Failed local storage reads/writes produce an in-app notice; later saves and history clears recover in order without an unhandled promise rejection.
- Complete source pagination uses the existing API cursors/count headers; failed next pages retain records and retry the same cursor. Search survives tab navigation and stale cancelled responses cannot overwrite a newer search.
- Native settings persist device/day/night appearance, expose confirmed local-only data clearing and connect privacy, terms and support. Unread local data is never overwritten after a failed storage read.
- A native, accessible confirmation dialog handles website handoffs, cancellation, failures and rapid taps on Android and the test preview.
- A searchable Services hub organizes 28 existing GTH PRO services into Travel,
  Real Estate and Tenders. Service-specific icons and explicit in-app/website
  labels make the next action clear. Cruises, deals, attractions, registry,
  listing/workspace and tender-assistant routes reuse the released website.
- Explicit flight/bus/train/ferry/cruise/transfer/car/eSIM search intents open
  the correct existing planner after confirmation, without querying unrelated
  property/hotel inventories or inventing route/date identifiers.
- Research Desk category filters, 600-character private notes and four personal
  review checks per saved record work on device, including offline. Notes/checks
  survive restart and record refresh; public sharing excludes this private data.
- Source details include published facts. Reviewed hotel UUIDs resolve to their
  real detail route; only an API-confirmed booking match exposes the existing
  server-verified exact-hotel handoff, which checks the mapping again on click.
- Native Hotels also offers a direct room/rate search through the existing
  Nuitée White Label entry, including when a directory record has no exact
  partner match. The booking URL stays separate from directory query parameters;
  destination, dates and guests are selected in the existing booking form.
- Partial-source retries preserve successful pages and retry the failed cursor.
  Hotel/tender pagination respects the actual API limit, and unknown property
  totals are not displayed as exact inventory counts. Long result lists use
  React Native virtualization.
- Day/night action text uses readable central-theme colors; gold button fills
  and the approved brand remain. Licensed image credits survive bookmarking;
  missing/failed photos have an accessible fallback.
- Functional preview QA uses explicit test-only API fixtures; Android emulator QA also exercises tabs, settings, cancelled handoff, Android Back and force-stop/relaunch. Fixture outcomes do not certify supplier bookings.
- Isolated CI compiles an installable, self-contained Android QA APK and a test-only AAB; emulator launch smoke and phone-width visual QA are automated.
- See [RELEASE_QA.md](./RELEASE_QA.md) for the physical-device and Play Store release gates.

## Local development
```bash
cd apps/gth-mobile
npm ci
node scripts/check-isolation.mjs
npm run theme:check
npm run typecheck
npm test
npx expo start
```
Use Expo Go or a development build appropriate for the SDK. The native app needs
internet access to search the established GTH PRO APIs.

To refresh native colors **without editing the website**:
```bash
npm run theme:sync
```

## Security and limits
- This continuation adds no dependency, paid API, subscription, duplicate
  database or server job. Local service filtering, notes and checklists make
  no network requests. Existing hosting, public API and supplier/affiliate
  commercial terms still apply; this is not a promise of unlimited free hosting.
- No service-role key or provider secrets. Native code reads existing public APIs.
- Original booking, payment, seller contact, official tender eligibility and
  private workflows remain on the original service, with explicit customer approval.
- A **QA APK** can be built and package-signature verified in GitHub Actions. The output is not Play Store signed; the separate AAB is test-only.
- Physical-device QA, Play signing with an owner's protected upload key and Play Console publishing remain unverified and must not be claimed complete.
- The provisional Android application ID in `app.json` must be checked for
  ownership before publishing. Avoid changing it casually after release.
- App changes remain in **one PR** until the owner reviews the full native build.
