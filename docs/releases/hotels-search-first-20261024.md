# Hotels search-first layout — 24 October 2026

The live `/hotels` booking view put Signature destinations before the actual Nuitee search controls. A visitor on a narrow phone had to scroll through destination cards before selecting a destination, dates or guests.

## Integration

Continue from released PR #126 (`e68792fd2a93fd75cabf1d30cdbd33bdedbd14c9`). The saved `BengalRoute_Stage8_Mobile_First_Royal_Standalone.html` reference places search before its quick links and Signature destinations. Reuse that ordering in the existing hotel page, while retaining GTH's real supplier component, existing city photographs, navigation, directory, central CSS and theme.

- Render `HotelBookingExperience` before Signature destinations in DOM order on every screen size.
- Keep the mobile hero compact and show both booking/directory mode controls on one row.
- Put supporting occupancy/provider notes and the full-window booking link after the search controls. Retain the accessible occupancy description, provider disclosures, failure recovery and valid restored-stay flow.
- Preserve the existing supplier SDK, callback, currency/date/occupancy validation, exact hotel routing and approved partner mappings. No database, API, booking/payment or Real Estate change.
- Do not import the standalone reference's theme, synthetic destination artwork, data or scripts. `globals.css` is unchanged.

## Verification and release

Run strict TypeScript, full lint, the existing 488 regressions, the central CSS guard, and a production build. Browser acceptance: 360, 390, 430, 768 and 1440 pixel layouts, search before destination cards, visible mobile search action above bottom navigation, keyboard guest controls, day/night propagation into the SDK frame, and switching between booking and directory without duplicate widgets. The official downloaded SDK bytes may be served locally for reproducible layout testing when the workspace proxy blocks browser TLS; this does not prove supplier API availability or a completed reservation.

Keep this feature branch's automatic Vercel previews disabled. After final checks, make one authorized merge into `main` and let the existing Git integration deploy. Verify READY on that merge SHA and the actual custom-domain hotel page; do not manually deploy production or merge unrelated staging branches. Update Master #127 with the resulting evidence and retain the wider GTH-01/GTH-04 tasks until all of their acceptance criteria are verified.

### Local evidence

- All 488 regression tests, lint, strict TypeScript/build validation, central CSS guard and `git diff --check` pass (exit 0). Production build generates 138 static pages with placeholder Supabase configuration; production credentials are not pulled or changed.
- Chromium production-browser checks pass at 360×740, 390×844, 430×844, 768×1000 and 1440×1000. At the three phone widths the search button's bottom is at 665, 666 and 643 CSS pixels; destination cards start at 995, 951 and 929 respectively.
- No horizontal overflow or uncaught page errors in tested views. Keyboard guest popup, increasing adults, day/night synchronization and booking/directory switching pass; returning to booking mounts exactly one widget.
- Layout checks use actual downloaded official SDK bytes served through the local test transport. They do not claim an authenticated supplier checkout or physical phone test.
