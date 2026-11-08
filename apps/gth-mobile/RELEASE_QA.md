# GTH PRO Android release acceptance — isolated native app

## Scope and production guard
- App sources: `apps/gth-mobile/`; this is **not** the original GTH PRO website or its PWA.
- Work stays in **PR #153**. On 9 November the owner authorized merging the finished app and OSM SEO together after final checks; use the existing one-shot main deployment, without a second manual promotion.
- Website, global CSS, Supabase/RLS, supplier APIs, importers and production domains are never edited by app release QA.
- Native research reads existing public GTH PRO APIs. Live services open the canonical website in the OS in-app browser after explicit consent; all booking, authentication and private workflows retain the existing website controls.

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
- Bus journeys, Train journeys and Ferry journeys open the existing branded planners; no app-owned fares, direct supplier secrets or new booking engine.
- With device storage blocked/full, saved records and recent searches stay usable for the session, a persistence notice appears, and a later successful write recovers.
- Check that results reflect real source records; never claim instant booking, offers, eligibility or verified pricing unless the original service confirms it.
- Network failure/reconnection on mobile data, background/foreground, and accessibility labels/touch targets.
- Load successive source pages; retry a failed page; return from Saved/Services without losing loaded results; confirm old searches never replace a newer query.
- Open app settings, choose day/night/device appearance and restart; cancel and confirm clearing saved records/history separately.
- Open a website handoff, cancel it, then confirm once; check browser errors have a usable retry and rapid taps do not open duplicate windows.
- In Services, search/filter all three ecosystems; confirm Cruises, Activities,
  deals, attractions, project registry, listing/workspace and tender assistant
  continue to their existing GTH PRO route. An empty service search has a reset.
- A global flight/bus/train/ferry/cruise query opens its planner confirmation;
  a notice about buses remains a tender search when tender intent is explicit.
- Save a record, add a private note and review checks, restart, then revisit
  while offline. Verify the note/checks remain, source facts stay available,
  and sharing the public record excludes private notes and check states.
- Saved category filters must not delete or hide records permanently; an empty
  category offers a return to all saved records. Clearing saved records also
  removes their personal notes/checks; history clearing asks for confirmation
  from both Home and Settings.
- Retry a failed source after another source has loaded several pages. Its
  successful pages must remain intact; failed first pages retry page one.
- Review exact hotel UUID and OSM detail links, booking-match gating, credit
  source/license links and failed-photo fallbacks. A saved booking match must
  still pass the existing server-side mapping check before supplier handoff.
- From native Hotels, open Search rooms & rates and confirm the existing
  canonical `/hotels` Nuitée booking form appears. Do not add directory mode
  filters to this booking entry. Cancel must retain
  the native hotel screen; no unverified directory record becomes bookable.
- Confirm Home shortcuts and the live hub launch current canonical website
  pages in the system in-app browser; Android Back returns to GTH PRO. Known
  public page opens use a new navigation revision, while affiliate exits and
  signed URLs retain their original parameters. A simulated website HTML v1→v2
  must appear on the next open without reinstalling the app.
- Load two source pages, change their fixtures, then background/foreground the
  app. Changed/removed records must refresh without losing pagination or private
  notes. Verify stale notices on failure and successful recovery on retry.
- Check old PWA saved paths migrate to current canonical record pages, saved
  metadata/photos refresh by exact ID, and offline snapshots remain clearly dated.
- Check selected bottom tabs, category/region filters and actions in both themes;
  text contrast must meet 4.5:1. Use enlarged Android fonts, keyboard navigation
  and screen-reader checkbox/selection labels. Confirm multiline note editing
  remains reachable above the keyboard on a physical phone.

## Continuation verification — 9 November 2026
- Native theme check, strict TypeScript and 43 native tests passed locally.
- Actual Expo web renderer passed both themes at 320/360/390/428px and the
  existing functional journey plus the new super-app service/research journey.
- Android Hermes JavaScript export passed. This export is not an installable APK.
- Website baseline regression suite: 736 passed; owner-approved OSM SEO continuation
  expands it to 746 passing local tests. Registry Python suite: 21 passed;
  website TypeScript and lint passed. The exact OSM website changes are documented
  in `docs/releases/osm-places-seo-20261109.md`; booking/database/deployment
  sources and the approved central shell remain unchanged.
- The local production-mode OSM acceptance build uses explicit local source/font
  fixtures because Google Fonts is blocked in this workspace. HTTP/browser/cache
  acceptance passed; final exact-head CI must independently pass the original
  production build before merge.
- The live-browser and freshness continuation requires APK/AAB/emulator results
  from its own final PR commit's isolated CI run. Earlier core-build artifacts
  do not validate the added native module. Use the latest commit shown in
  [PR #153 checks](https://github.com/p13780811-debug/GTH-tour-travels-booking/pull/153/checks).
- Live supplier booking/commission, physical-phone acceptance and Play Store
  production signing/publishing remain separate, unverified release gates.

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
