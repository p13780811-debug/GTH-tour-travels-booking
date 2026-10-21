# GTH PRO worldwide hotel booking

Hotel-only integration on main 5c2fc728. PR #122 is not merged: its older real-estate and travel alternatives remain separate.

## Booking architecture

- `/hotels` defaults to connected hotel booking. Existing city/destination/name/country links still select the public directory. Both modes retain the ecosystem header, one below-hero travel rail, footer and policies.
- Official Nuitee SearchBar v1 runs inside a disposable iframe. Its CSS and listeners do not enter the GTH document. The same compiled `globals.css` and day/night class style the search controls. No second theme, dependency or supplier credential is added.
- Destination selection, dates, rooms and child ages come from the SDK callback. SDK room counts are expanded to the documented one-entry-per-room occupancy array; counts and child ages apply to each room, as stated next to the search. Use the full booking site for different occupancies per room. `/api/hotels/booking` independently validates them and redirects only to `https://gthproglobal.nuitee.link`. Unknown parameters, guest contact data, arbitrary redirects and offer/session tokens are not forwarded.
- The hosted provider owns automated hotel photos, stars, amenities, room rates, cancellation terms and booking confirmation. Hotel directory IDs are never substituted for supplier IDs. The directory retains its approved exact-property partner mappings.
- Results can render within the GTH page. A visible full-window secure booking link preserves the original GTH search and supports browsers that block embedding. Use that site for payment. Navigation inside the cross-origin booking frame is owned by Nuitee; GTH cannot mirror subsequent changes back into its address bar.
- No supplier API calls, database migrations, production reservations, payment collection, importer changes or sandbox postbuild hooks are added.

## Configuration

The verified public GTH white-label origin is centralized in `src/lib/travel/hotel-whitelabel.ts`. It is public routing configuration, not an API credential. No environment variables or new private secrets are required for this integration.

## Validation

Run `npx tsc --noEmit`, `npm run test:security`, `npm run lint`, `npm run build`, and `python3 scripts/check-hotel-css-scope.py` after committing. The CSS guard retains every existing global CSS byte and permits only hotel-scoped appended rules. Existing real-estate/nav/footer protection remains active.

Before production promotion: verify actual worldwide autocomplete, date/guest selectors, search-to-provider results, a hotel's stars/amenities/rooms, both GTH modes and phone layout. Stop before guest/payment submission. Build/unit checks alone do not prove embedded supplier behavior.

The feature branch disables automatic Vercel previews. Use one completed candidate for release verification; do not deploy every patch.

## Booking-link routing follow-up

Customer booking buttons and result iframe now use the fixed Nuitee white-label origin directly after the existing strict stay validation. They no longer depend on the local `/api/hotels/booking` redirect endpoint being deployed or passing preview authentication. That endpoint remains available for existing valid URLs.

Supplier paths `/hotels/lp…` and `/hotels/stay/lp…` receive narrowly scoped compatibility redirects before the GTH city-guide route. Valid stay details are preserved; missing/expired stay data returns to GTH search with an explicit recovery message. City guides, OSM records, reviewed UUID listings and other ecosystem pages retain their original routes. Unknown parameters, personal details and offer/prebook tokens are discarded.

The public domain was still on PR #121 while PR #126 was a protected preview; the new booking route was not yet available on that older release. Do not confuse testing the candidate with publishing it. No paid transaction is required to verify the white-label integration.
