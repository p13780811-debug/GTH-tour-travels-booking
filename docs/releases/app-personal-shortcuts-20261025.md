# GTH PRO app shortcuts upgrade — 25 October 2026

App home now supports up to eight pinned favourites, ordered first within the selected service category. Separate Pin/Unpin controls retain ordinary service links. The last four used services appear in a clearable recent row. App routes opened directly or through navigation also record their allowlisted service ID.

Versioned device storage holds only fixed service IDs, never search terms, route parameters, bookings or customer details. Invalid entries are discarded. Other tabs synchronize preferences. Blocked storage keeps dashboard pin changes usable for the current session.

Promotions fade between slides with reduced-motion support. Explicit Play resumes rotation while focused. Horizontal swipe changes slides; vertical scroll does not.

This release remains an installable PWA. It does not deliver a native APK or claim physical-phone QA, app-store publication, authenticated admin testing or live payment testing.

Validation: 496 JavaScript/TypeScript regressions, full lint, strict TypeScript and 138-page production build. Browser interaction verification covers five viewport widths, persistence, recent services, cross-tab updates, denied storage, and carousel controls. Record final browser and remote CI results in the release PR before merge.

Release path: disabled feature-branch deployment, reviewed exact-head CI, one Git merge to main, then verify Vercel READY and production aliases. Owner instruction authorizes this upgrade and release; do not represent it as a submitted GitHub review.

Rollback baseline: main d17e0d7219d83175a91d739d2de9560ab8c6a812, deployment dpl_92aVLByDna1KVwoQuBDG259v4SwX. Revert this release through Git if required.
