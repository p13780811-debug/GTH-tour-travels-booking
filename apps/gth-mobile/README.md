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
- Bus and global rail entries reuse the existing GTH PRO `/bus` and `/train` planners after the same explicit website-handoff confirmation as other booking services.
- Failed local storage reads/writes produce an in-app notice; later saves and history clears recover in order without an unhandled promise rejection.
- Isolated CI compiles an installable, self-contained Android QA APK and a test-only AAB; emulator launch smoke and phone-width visual QA are automated.
- See [RELEASE_QA.md](./RELEASE_QA.md) for the physical-device and Play Store release gates.

## Local development
```bash
cd apps/gth-mobile
npm ci
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
- No service-role key or provider secrets. Native code reads existing public APIs.
- Original booking, payment, seller contact, official tender eligibility and
  private workflows remain on the original service, with explicit customer approval.
- A **QA APK** can be built and package-signature verified in GitHub Actions. The output is not Play Store signed; the separate AAB is test-only.
- Physical-device QA, Play signing with an owner's protected upload key and Play Console publishing remain unverified and must not be claimed complete.
- The provisional Android application ID in `app.json` must be checked for
  ownership before publishing. Avoid changing it casually after release.
- App changes remain in **one PR** until the owner reviews the full native build.
