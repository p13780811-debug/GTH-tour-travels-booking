# GTH PRO Mobile — Distribution and Play Store readiness

## What ships now
- The installable Progressive Web App starts at \`https://gth-pro.vercel.app/app\`.
- Every app tab has a dedicated \`/app/...\` marketplace screen; app cards
  open \`/app/{section}/{id}\` details, with separate actions for original
  source/authorized provider sites.
- Mobile app-only pages reuse the existing approved GTH PRO global theme.
  Original website URLs, desktop layouts and all three ecosystems remain unchanged.
- Browser installs use the branded \`/gth-app-brand.svg\` and generated app icons
  from \`/app-icon/{192,512}\`. HTTPS and supported browser are necessary.
- No room availability, tender certification, live airfare or property verification
  is invented to make the app appear "finished".
- This is a PWA, NOT an Android APK or a Play Store-signed AAB.

## Publishing to Google Play is a separate release
A PWA installed via the browser does NOT appear in the Google Play search index.
A Play Store release requires a Google Play Console developer account controlled
by the publisher; chosen unique package name and signing credentials, an
Android App Bundle (AAB) built and signed from a reviewed Trusted Web Activity
or another approved Android shell; verified \`assetlinks.json\` (for TWA),
accurate app listing, screenshots, privacy/data-safety declarations, content
ratings, contact details, accessibility and policy checks, device testing,
app review and approved production rollout.

Never commit upload keys, passwords, Play API tokens or signing keystores.
Keep them within encrypted publishing secrets controlled by the app owner.
Do not silently convert an installable web page into "Play Store published".

Official release documentation:
https://support.google.com/googleplay/android-developer/answer/9859348
https://developer.android.com/studio/publish/upload-bundle

## Quick Android test
1. Open \`https://gth-pro.vercel.app/app\` in Chrome.
2. Use the browser menu's Install app/Add to Home screen action.
3. Launch from the GTH PRO icon and open Flights, Hotels, Property and Tenders.
4. Tap a card — details should remain under \`/app/\` until you intentionally
   select an external official source or advanced website tools.
5. Swipe a rail and use category/search/page links.
6. After an app update, fully close/reopen the standalone app. If an old icon,
   shortcut, or manifest remains cached, remove the old shortcut and install again.

Check Play Console under testing/production releases if the user later supplies
an existing package; a GitHub PWA manifest alone cannot prove Play publication.
