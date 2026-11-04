# GTH PRO Android release acceptance — isolated native app

## Scope and production guard
- App sources: `apps/gth-mobile/`; this is **not** the original GTH PRO website or its PWA.
- Work stays in **draft PR #153**, without merging or deploying to Vercel, until owner approval.
- Website, global CSS, Supabase/RLS, supplier APIs, importers and production domains are never edited by app release QA.
- App only reads existing public GTH PRO APIs. Payment/booking and privileged workflows stay on original websites after explicit user consent.

## Automated acceptance gates
1. Compare PR with `main` to prove website and deployment files are unchanged.
2. Generated theme matches `src/app/globals.css` tokens (dark and light).
3. TypeScript, security/routing/source adapter tests and Android JS export pass.
4. 320, 360, 390, 428 px web-rendered screenshots and key native navigation pass.
5. Android release-variant **QA** APK builds, has bundled Hermes JavaScript, and APK signature verifies.
6. **Test-only** Android AAB builds. It is not Play Store-signed.
7. Android emulator installs the QA APK and proves native Home appears without Metro.
8. Record the exact PR commit SHA and GitHub Actions run for all evidence.

## Owner device acceptance: NOT replaced by CI
On a physical Android phone, install the matching standalone QA APK **from the exact tested commit**. Check all of the following and capture any failure:
- Clean install, launch, 5-minute foreground run, force-stop/relaunch, Android back navigation.
- Day and night themes; no clipped text/cards on small screen or unusual device font scale.
- Home / Discover / Research Desk / Services navigation and accurate service labels.
- Searches for hotels, properties, tenders and tours; empty/loading/error/retry behavior when data is missing or network is disabled.
- Tender location explicitly switches between India and Worldwide; server returns the selected scope, never a guessed GPS region.
- Save, revisit, remove and share a genuine source record; stored bookmarks remain local after restart.
- External booking/tender handoff requires an affirmative Continue action and launches the existing GTH PRO URL.
- Bus journeys and Train journeys open the existing branded planners; no app-owned fares, direct supplier secrets or new booking engine.
- With device storage blocked/full, saved records and recent searches stay usable for the session, a persistence notice appears, and a later successful write recovers.
- Check that results reflect real source records; never claim instant booking, offers, eligibility or verified pricing unless the original service confirms it.
- Network failure/reconnection on mobile data, background/foreground, and accessibility labels/touch targets.

## Play Store / production signing gate
This repo intentionally contains **no** production keystore, passwords, service credentials or upload tokens.
- Confirm permanent `com.gthpro.mobile` app ID ownership and app listing name first. The package ID is provisional until approved.
- Generate and back up a **separate** production upload key securely; place signing material in protected secrets or a managed signing service, never in source, build logs, screenshots, or downloadable QA artifacts.
- Sign the production AAB with the protected upload key, test Play App Signing compatibility, then use a controlled internal testing track before public release.
- Confirm `android.versionCode` advances for each successive submission.
- Complete Play Console identity, privacy policy, data-safety declarations, screenshots, store assets, content rating and required permissions review.
- Require explicit owner approval for any Play upload, GitHub PR merge or live-site deployment.

## Honest status
Passing CI proves **build and automated testing only**. It does not prove physical device compatibility, real supplier booking/payments, or a published Play Store app. Keep the status **release candidate** until all checks above are documented.
