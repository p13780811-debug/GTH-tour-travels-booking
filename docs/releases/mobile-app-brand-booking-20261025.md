# GTH PRO installable mobile app — 25 October 2026

The existing /app PWA now uses the owner's actual Library branding and the same supplier booking components as the website. This is an installable web app; signed APK/AAB/IPA builds and store publication are not part of this release.

## Result

- Compact app header uses GTH Pro Global Tech Logo.png, with the existing day/night control.
- Home uses a muted, nonblocking 3.2-second derivative of Logo.mp4. Reduced-motion and Save-Data users receive a static poster. The separate 30-second promo was not substituted for the logo animation.
- Actual branded PNG home-screen icons include 192px, 512px, maskable 512px and Apple 180px variants. App metadata is scoped through its child layout.
- /app/flights reuses the official TPWL integration and configures resultsURL to /app/flights. Website defaults remain /flights.
- /app/hotels reuses the existing worldwide destination/date/guest search. Phones and tablets retain the full-window supplier results flow from PR #129; desktop embeds remain available. Saved dates, room counts and child ages are retained.
- Hotel guides remain a separately labelled source-backed directory under /app/hotels?directory=1. Search, filters and pagination retain that mode.
- Five tabs show exactly one active destination. App tabs remain visible on tablets/landscape. Duplicate outer bottom padding is removed only for app routes.
- Direct-load hotel initialization also covers a srcDoc document that completed before hydration, with a per-document guard against duplicate SDK initialization.

## Verification

488 JavaScript/TypeScript regressions pass. The production build passes strict TypeScript and lint and generates 138 static pages. The approved global CSS and Real Estate protection checks pass; root layout, Navbar, Footer and protected Real Estate files are unchanged.

Browser checks use Chromium 153 at 360, 390, 430, 768 and 1440 CSS pixels with mobile/touch emulation below 1024px. Coverage includes app navigation, day/night switching, branding/video, install prompt/manual guidance, offline fallback, reduced motion and booking callback routing. Supplier SDKs in local callback tests are fixtures, not evidence of live supplier checkout. Offline cache remains limited to the informational offline page, without caching private/API data or stale prices.

No physical-device OS installation, authenticated admin-session quote transaction, payment, signed native binary or store submission is claimed. Existing booking-provider terms, source disclosures and account protections remain in place.

## Release

Publish through the existing Git integration only after the exact PR head passes applicable CI. Verify the resulting production deployment SHA, READY state, custom domain and live /app routes. Rollback reference: main 2cfbda514acebe567d434172099e9e5ac8c7beee, deployment dpl_Ckrhk5nZndrJKLhpw1mdHabf8jp8.
