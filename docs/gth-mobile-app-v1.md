# GTH PRO Mobile App v1 — installable web app

## Architecture and honest release label

This is a **Progressive Web App**, not a compiled or Play Store-signed Android APK or an iOS App Store binary.
It is a dedicated installable phone experience built on the existing Next.js 15 application. All three
pillars reuse their original server APIs, auth/session rules, disclosures, page routes and central CSS.
No duplicate database, hardcoded provider token, invented listing or second CSS theme.

- App launch route: `/app`, not a replacement for the approved desktop homepage.
- App identity: `/manifest.webmanifest` and generated `/app-icon/192`, `/app-icon/512` PNG assets.
- Offline: `/sw.js` caches **only** `/offline.html`. Never cache results, sessions, documents, APIs,
  admin pages or potentially personal response data. Navigation is network-first and not persisted.
- Nav: five bottom tabs; Real Estate retains its existing independent subnavigation.
- Installed scope is the same HTTPS origin as GTH PRO, so links and cookies stay on the same origin.
- Browser external booking and official tender links remain governed by existing routes and warnings.

## 1 November 2026 targeted app audit: customer navigation and reliability

This change improves the **existing** /app PWA, not a second or native app:
- All 14 dashboard services now open a route under /app first. The 9 services
  whose tools are website-only have allowlisted /app/services/[id] screens
  which transparently explain the service and require an explicit user click
  before opening the original GTH PRO website/provider handoff in a new tab.
- The five already-native app services retain their original in-app pages.
- The Recent Services row uses the same in-scope links, including direct visits.
- Optional dashboard hotel/property/tender Supabase reads have a shared 4.5 s
  abort deadline. On optional-data failure, the existing curated destinations
  and app actions remain usable instead of waiting indefinitely.
- Existing source filters, Real Estate, Tender, hotel/flight suppliers, theme
  tokens, root desktop layout, manifest identity and approved app bottom nav
  are not reimplemented or modified.
- App gateway pages do not create bookings, authenticate customers, cache
  personal data, or claim verified supplier availability. External actions
  remain explicit, not an embedded third-party checkout.

Passing CI confirms builds and source regressions, **not** full physical Android
testing, all upstream supplier availability, or signed APK/AAB publication.

## Installation and phone testing

After a passing build and approved deployment (do not assume main is deployed):
1. Open `https://<approved-deployment>/app` on Android Chrome and choose **Install GTH PRO**.
   Or Chrome menu → **Install app / Add to Home screen**. Browser support varies.
2. iOS Safari → Share → Add to Home Screen (Safari decides the final install treatment).
3. Verify standalone launch, tap targets, 320/360/390/428px portrait, tablet, landscape,
   font scaling, back navigation, swipe/scroll, keyboard, safe-area bottom padding,
   day/night, online-offline-online, and no horizontal overflow.
4. Verify Flights → result page → partner, Hotels → real details → partner only when present,
   Real Estate search and Tender source/detail views. Failures in those existing modules are
   not fixed automatically by packaging.
5. Inspect the service worker cache: only `/offline.html`; private data must not be persisted.
6. Confirm PWA manifest and icons return 200 with correct content type and verify installability
   using browser tooling on a real device.

## Release constraints

Existing desktop, homepage cinematic styling, Real Estate CSS, Tender and existing provider
integrations are unchanged. Merge/deploy only after Next.js typecheck, regression suite,
production build and real-device UI verification.

**Android Play Store APK/AAB** and **iOS App Store IPA** require separate packaging, verified
domain association, signing credentials owned by the publisher, store declarations and tests.
No app-store submission or signed binary has been produced by this change.
