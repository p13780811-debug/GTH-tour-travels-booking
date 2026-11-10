# GTH PRO — zero-fee Android access and protected APK publication

## Actual state, 11 November 2026

- **Public install method now prepared:** `https://www.gthproglobal.com/get-app` (only live after this PR's deployment). The `/app` route is the existing installable PWA, not a new application or WebView booking engine.
- **Native QA:** GitHub Actions run [42530216006](https://github.com/p13780811-debug/GTH-tour-travels-booking/actions/runs/42530216006) built an installable Android QA APK, a test AAB and emulator evidence. APK artifact `gth-pro-native-standalone-qa-apk-not-play-store` expires on **2026-11-15**. GitHub sign-in is required to download the workflow artifact.
- QA APK signature verification and an owner's reported Google Play Protect scan are useful security signals but **not a Play Store certification, production signing, stable signing identity or vulnerability audit**.
- Do **not** upload debug/QA-key-signed APKs for permanent public distribution. A future production-signed APK may need to replace the QA app after local records are backed up, because signature changes prevent an in-place update.

## Permanent free public native APK — owner-held signing required

This repository adds a **manual-only** GitHub Actions workflow:
`.github/workflows/gth-android-public-apk.yml`.
It never runs on schedule or every PR. It requires:
1. An organization-controlled signing/upload keystore generated and backed up **outside GitHub**. Protect the key, passwords and recovery copy. Never put them into issues, chat, source, screenshots, public artifacts or `NEXT_PUBLIC_*` variables.
2. The restricted GitHub environment `android-apk-publication` with required human reviewers where available.
3. These four **environment secrets**: `GTH_ANDROID_KEYSTORE_B64` (base64 of encrypted/private keystore file), `GTH_ANDROID_STORE_PASSWORD`, `GTH_ANDROID_KEY_ALIAS`, `GTH_ANDROID_KEY_PASSWORD`. The base64 content is secret even though it is encoded.
4. The **environment variables** (not secrets) `GTH_SIGNED_ANDROID_RELEASE_ENABLED=true` and `GTH_ANDROID_SIGNER_CERT_SHA256` (owner-recorded SHA-256 signing-certificate fingerprint from `keytool -list -v`). Both are absent/disabled by default.
5. Owner-approved final package ID `com.gthpro.mobile`, version `0.1.0` and app integrity/real-device acceptance. Do not change package ID after public release; increment `android.versionCode` for each update.
6. Launch workflow from **main** with a unique tag such as `android-v0.1.0-rc.1`. The workflow validates tag format, re-tests app, prebuilds Android, injects environment-based stable signing, checks package/cert/JS bundle, produces SHA256SUMS and publishes a **GitHub prerelease**. It refuses to overwrite an existing release tag.
7. When a specific approved release asset is available, set the server-side Vercel env var `GTH_ANDROID_PUBLIC_APK_URL` to exactly its trusted official GitHub Releases asset URL; do a controlled redeploy and verify the resulting public link. The `/get-app` page fails closed until then.

**No Google Play Console account or $25 registration fee is required for standalone Android APK or PWA distribution.** GitHub and Vercel fair-use limits, network/data fees and platform policies still apply; zero guaranteed operational cost is not claimed.

## Device acceptance before public distribution

- Install on a phone, check Play Protect, record OS/version and crash behavior.
- Confirm Home, Discover, Research Desk, Services and normal Android Back behavior; test night/day, keyboard and accessibility.
- Verify hotel/travel/property/tender handoffs and cancellation; do not falsely claim a successful external booking or payment from a navigation-only check.
- Check offline local notes, private bookmarks, device restart, network reconnection, version code and update signature continuity.
- Confirm that older QA APKs with different signing certs do **not** silently overwrite an installed app. Back up local-only research before any uninstall.

## No security or architecture changes

No changes to Supabase/RLS, secrets, source imagery/licensing, supplier API integrations, attraction on-demand SEO, importers, global CSS or production website workflows. Public install page uses existing centralized site design tokens and cached/static content, with no new database calls, paid APIs or tracking SDKs.
