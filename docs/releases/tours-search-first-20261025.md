# Tours and Activities search-first release — 25 October 2026

Tours and Activities previously rendered the same page, used the same canonical URL, and hid search behind inventory/mapped-city loading. Both routes now use a compact server-rendered search card before destination inspiration and independent booking partners. Mobile layouts keep destination, category and the search button together near the top. The selected route has a filled switch; the other route retains the existing card tokens.

Tours focuses on guided city tours, audio walks and day trips. Activities focuses on attraction tickets, city passes and outdoor experiences. Each has a distinct title, search action, canonical URL, category choices and default public-record tag filter. Switching pages preserves the destination while clearing the previous mode's category. Explicit legacy category URLs remain usable. Generic tour API callers keep their previous unscoped contract.

Search validation, public-only/media-rights filters, pagination, currencies and supplier handoffs remain in place. No inventory is fabricated; dates, guests and final prices are selected with the provider. A read-only query confirmed the live tags column is text[] and both scoped public/media-verified catalog counts are currently zero. Existing partner links therefore remain the primary booking route. No schema, RLS, credentials, protected Real Estate UI or global CSS changes.

Search and partner content render before streamed catalog results, with functional route-loading search forms and a no-JavaScript GET fallback. Five-width browser, day/night, search round-trip, route-switch, invalid-filter and exact-head CI outcomes are recorded in the release PR before merge.

Release through one Git merge to main only; feature branch deployments disabled. Owner's continuing instruction authorizes completion and release. No submitted review, physical-phone QA, supplier payment or authenticated admin testing is claimed.

Rollback baseline: main 6d87b797da1108d78d6b643b373012f1b0b09602 and production dpl_2rCRPvNC2zyYnJKF5HCGzEwy52ij. Revert through Git if required.
