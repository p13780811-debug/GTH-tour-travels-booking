# Real estate market finishing pass

This pass builds on `gth-production-hardening`, preserving the approved homepage and centralized gold/blue day/night tokens. It does not certify a production release or feature parity with every portal.

## Research basis (10 October 2026)

- Property Finder: https://www.propertyfinder.ae/en — location and Buy/Rent search, property-type/beds/price filters, saved properties and buyer tools.
- Rightmove: https://faq.rightmove.co.uk/support/solutions/articles/7000048777-how-to-start-your-search-on-rightmove — location-first sale/rent search.
- Rightmove filters: https://faq.rightmove.co.uk/support/solutions/articles/7000100590-how-to-use-the-search-filters-to-find-properties-for-sale
- NoBroker: https://www.nobroker.in/ and https://www.nobroker.in/list-your-property-for-rent-sale — search, owner posting and contact journey.
- 99acres: official search-result snippets and its publisher app listing at https://apps.apple.com/us/app/99acres-property-search/id781765588 — residential/commercial/land discovery. Full website visual inspection was not completed.
- Housing.com: reliable current first-party page coverage was not obtained in this session; no full visual-review or feature-parity claim is made.

The resulting design choices are GTH PRO's own: a single property workspace header, readable property-specific typography, prominent location/intent search, recorded developer/registration information on cards, comparison, mobile enquiry action and local saved searches. No competitor imagery or code is copied.

## Implemented

| Journey | Result |
| --- | --- |
| Navigation | Single real-estate header; animated brand mark, Explore/Buy/Rent, saved/compare, tools, listing, account and shared theme toggle. Other ecosystem routes retain their header. |
| Search | Buy/Rent intent in the hero; type categories below; category changes preserve location and the other search intent; URL history and saved-search loading stay connected. |
| Typography | Real-estate scope uses the existing sans font, restrained heading sizes and global colors. Homepage/global CSS not rewritten. |
| Listing records | Cards show recorded developer and registration reference when supplied; comparison includes developer and listing purpose. |
| Detail | Existing gallery, registry, location and enquiry retained; mobile enquiry bar added. |
| Saved searches | Maximum 10 device-local searches; bounded/deduplicated records and allowlisted query fields; no email alerts or account-sync claim. |
| Planning | Fixed-rate repayment estimator with entered figures, zero-interest support, explicit currency labels and buying checklist. No exchange-rate conversion or loan application. |
| Film quality | Building, flight and shield segments re-exported from the supplied 1280×720 source at 1280×560, CRF 18, with audio removed and fast-start MP4. Lower-right mark excluded by cropping; no upscaling. Media decode checked. |

## Validation and remaining release checks

TypeScript, lint, 43 Node regression tests and production build pass with placeholder Supabase environment values. The build logs a travel destination fetch failure against the placeholder service; it completes successfully. This is not evidence of working live database/provider flows.

Browser visual/playback tests were not performed: the supported browser-control capability is unavailable in this environment. Confirm at 360/390/768/1280/1440 widths, in day/night themes, with keyboard navigation, reduced motion, blocked autoplay and restricted storage.

The existing property-media approval map is empty. Adding only a database image URL does not enable listing photography: listing match and permission evidence must first be reviewed and added through the existing approval mechanism.

Price remains text, with no normalized numeric amount/currency contract. Budget filtering and numeric price sorting remain intentionally unavailable. A reviewed schema migration and data backfill are required before those features can work reliably across countries.

Preserve the production gates in `docs/production-hardening.md`: deployed auth/enquiry/submission/moderation, RLS/grants/storage ownership and required provider/quota environment configuration. No production variables, policies or live listings were changed in this pass.
