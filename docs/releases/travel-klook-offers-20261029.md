# GTH PRO editorial Deals & Offers — source-safe draft
- Site destination: `/travel/deals` with mobile-friendly region discovery (UK, India, Japan, UAE, Singapore, Canada).
- All destination cards use the pre-existing GTH PRO tracked Klook search handoff `/api/travel/partner-search`, preserving campaign 137 / marker 417668 / p 4110 / trs 504342.
- "See Klook's current deals" opens `/api/travel/klook-deals`, a fixed no-input redirect that wraps Klook's officially observed `https://www.klook.com/deals/` in the same affiliate tracker. This must be approved/verified in the owner's Travelpayouts Link Builder before promotion as a commission-earning link: campaign parameters alone do not prove conversion attribution.
- No Klook marks/logos, copied promotional creatives, scraped coupon codes, invented percentages/prices, live inventory or unsupported guarantees.
- Affiliate programmes can forbid discount-code promotion unless codes are issued through the programme. `approvedKlookPromos` starts empty and checks issuer plus future expiry. An approved campaign needs verified conditions and a unique source reference before populating it.
- Page includes direct-provider disclosures, GTH visual assets, tap-ready region chips, Tours/Activities navigation entry, Travel home card, mobile app promotion.
- NO external widgets or scripts, no database migrations, no CSS changes, and no modification to Real Estate or supplier importer.
- Draft/no auto Vercel preview until exact-head CI and manual affiliate Link Builder verification; single deployment after approval.
