# GTH PRO Android release acceptance — isolated native app

## Scope and production guard
- App sources: `apps/gth-mobile/`; this is **not** the original GTH PRO website or its PWA.
- The original native app and OSM SEO shipped together in **PR #153**. Android release hardening and the native workspace upgrades are in **PR #182**.
- The Android release branch disables its Vercel preview. Website routes, global CSS, Supabase/RLS, supplier APIs, importers and production domains remain outside the Android release scope.
- Native research reads existing public GTH PRO APIs. Live services open the canonical website in the OS in-app browser after explicit consent; all booking, authentication and private workflows retain the existing website controls.

## Automated acceptance gates
1. Compare PR with `main` to prove website and deployment files are unchanged.
2. Generated theme matches `src/app/globals.css` tokens (dark and light).
3. TypeScript, security/routing/source adapter tests and Android JS export pass.
4. 320, 360, 390, 428 px web-rendered screenshots and key native navigation pass.
5. Android release-variant **QA** APK builds, has bundled Hermes JavaScript, and APK signature verifies.
6. An **unsigned** Play candidate passes bundletool validation, application ID and version checks, the API 36 minimum, Android manifest privacy checks and 16 KB packaging and ELF alignment checks.
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
- Confirm Home shortcuts and the live hub open the canonical website URLs in
  the system in-app browser, preserving affiliate or signed parameters. Android
  Back returns to GTH PRO.
- Load two source pages and background/foreground the app. Source request count
  must stay flat until manual refresh. On refresh, changed and removed records
  must update without losing pagination or private notes. Verify stale notices
  on failure and successful recovery on retry.
- Open all three workspaces with no search term, save a search and compare
  two saved records offline. These actions must complete without API requests.
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

1. In Play Console, check the owner account and existing app record for `com.gthpro.mobile`. Confirm the next unused version code there. For the first upload, use `1` if it is available. Keep the registered upload key if one already exists.
2. Run **GTH Independent Native Mobile — isolated CI** from the reviewed Android release branch or `main` with the `play_version_code` input. Download `gth-pro-play-unsigned-<commit>` from the successful run and retain its commit and artifact digest alongside the device acceptance evidence.
3. On an owner-controlled signing machine, use the upload keystore and alias registered for this Play Console app. For a first release with no upload key, create and securely back up a separate key and register its public certificate during Play App Signing setup. Enter the signing password at the prompt. Keep keys and passwords out of GitHub and chat.

   ```bash
   jarsigner -keystore /path/to/upload.jks -signedjar gth-pro-play.aab gth-pro-unsigned.aab YOUR_UPLOAD_ALIAS
   (
     read -rs -p 'Upload keystore password: ' GTH_UPLOAD_STOREPASS && printf '\n'
     export GTH_UPLOAD_STOREPASS
     jarsigner -verify -strict -keystore /path/to/upload.jks -storepass:env GTH_UPLOAD_STOREPASS gth-pro-play.aab YOUR_UPLOAD_ALIAS
   )
   keytool -printcert -jarfile gth-pro-play.aab
   ```

   Match the certificate SHA-256 against Play Console's **Upload key certificate** before upload. Google Play signs the device installs with its app signing key.
4. Complete Play Console app access, content rating, ads and Data safety using the actual app and its web handoffs. Use `https://www.gthproglobal.com/privacy-policy` as the policy candidate and verify that the published text covers Android behavior. Native search sends queries to GTH PRO over HTTPS. The app stores saved records, private notes and history on-device, with Android cloud backup disabled. GTH PRO pages and booking suppliers have separate online flows. Review their integration and each dependency before declaring collection or sharing.
5. Upload to the appropriate testing track, install the Play-distributed build on a physical phone, and complete the device and supplier handoff checks above. Submit to Production once Play Console eligibility, the listing, and acceptance checks are complete.

### Store listing draft

- App name: **GTH PRO**
- Short description: **Explore travel, real estate and public tenders in one app.**
- Full description: **Discover flights, stays, experiences and ground transport. Research property records and explore public tenders. Save records and add private notes to revisit your research. When you continue to a booking or other online service, the relevant website opens. Availability, prices and booking terms are shown by the service provider.**
- Screenshots: Capture Home, Discover, Saved and Services from the accepted Android build. Use real app screens and omit personal records, private notes and account information.

## Honest status
Passing CI proves **build and automated testing only**. It does not prove physical device compatibility, real supplier booking/payments, or a published Play Store app. Keep the status **release candidate** until all checks above are documented.
