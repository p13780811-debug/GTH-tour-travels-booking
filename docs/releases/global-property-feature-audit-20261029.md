# Global property gateway — competitor review and release scope

Reviewed 29 October 2026 against the current Magicbricks, 99acres, Zillow, JamesEdition and SquareYards public product descriptions. This is a capability audit, not a claim to reproduce their inventory, proprietary data, subscriptions or third-party services.

## Sources

- Magicbricks: https://www.magicbricks.com/help/ — search, seller services, price/locality research.
- 99acres publisher listing: https://play.google.com/store/apps/details?id=com.nnacres.app — listing discovery, locality reviews, transaction/price insights.
- Zillow: https://www.zillow.com/learn/zillow-advanced-search/ — map regions, advanced filters, alerts, co-shopping, comparisons and affordability.
- JamesEdition: https://help.jamesedition.com/en/what-does-the-listing-page-look-like — media, building/agent details, price per area, related/recent listings, virtual tours.
- JamesEdition professional product: https://www.jamesedition.com/professional_seller/real_estate — CRM feeds, lead management, translation and seller performance.
- SquareYards: https://www.squareyards.com/cost-of-living-calculator — rent/buy housing and living-cost planning.

## Capability map

| Capability | GTH PRO implementation / actual limit |
| --- | --- |
| Buy, rent, new launches, commercial, plots | Existing search modes preserved |
| City, country, bedroom, price and possession filters | Existing validated server parser and approved inventory RPC; no hidden FX |
| Worldwide country entry and market gateway | Added `/real-estate/worldwide`, actual country/city search with six existing asking-price currencies |
| Buyer/owner/developer/channel partner gateway | Added role links to existing listing, claims and seller workflows; existing role validation remains authoritative |
| Shareable personal buying brief | Added JSON download from validated search parameters; no seller submission is implied |
| Grid/map, saved listings, side-by-side comparison | Existing approved-listing flows preserved; pins require stored coordinates |
| Recently viewed | Added real successful detail views only, 12 entries/30 days on this browser, clear control; no invented photos or live availability |
| Seller submission and photo review | Existing specs, pricing, rights evidence, submission review and approved published media pipelines preserved |
| Registry research and comparison | Existing MahaRERA directory stays separate from available sale/rent offers |
| Enquiries / site visit requests | Existing server validated leads; a request does not mean a confirmed booking |
| EMI, affordability, ownership expenses, rental yield | Existing planning studio preserved |
| Rent versus buy | Added equal-monthly-budget comparison, opportunity cost of upfront cash, rent growth, investment return, appreciation, selling costs, yearly table and CSV |
| Loan prepayment | Added monthly extra payment plus immediate lump sum, duration/interest comparison; excludes lender fees and penalties |
| Net sale proceeds | Added sale price minus actual user-entered debt, taxes and fees, preserving negative results |
| Currency display | Decision scenarios support 12 currency labels; neither scenarios nor search pretend to perform FX conversion |
| Area units / carpet versus built-up | Existing unit converter and documented ratio requirement preserved |
| Private research, document checklist, calendar reminder | Existing local notes and downloadable personal calendar remain; no account sync or confirmed seller appointment is implied |
| Source-backed locality intelligence and dossier | Existing approved recorded/source-backed flows preserved; no fabricated travel times or ratings |
| SEO / approved media / listing schema | Existing truthful metadata and approved-media-only listing schema preserved; gateway gets its own canonical metadata |
| Portal links to Travel and Tender | Existing ecosystem navigation retained; worldwide gateway linked from header/footer |
| Hero and promotion slides | Images/cards rotate and swipe without visible arrow/count rows or technical captions; keyboard pause is retained on focus |
| Mobile AI Send / Travel category speed / app isolation | PR #147 includes shrink-safe Send, bounded source reads/cache/loading UI and full-document reset at app/site boundary |

## Still dependent on real data, integrations or separate implementation

These are **not implemented by this release** and must not be marketed as working: drawn map region search, school boundaries/ratings, verified resident reviews, transaction-derived locality price trends, automated valuations, actual sold-price history, cross-device shortlist synchronization, instant email/push property alerts, co-buyer accounts/chat, open-house booking confirmations, lender pre-approval, rent payments, e-signing/escrow, professional legal/interior/moving service fulfillment, CRM/XML feeds, seller impression/lead analytics, multilingual listing translations, approved 3D tour provider embeds, and non-Maharashtra official registry connectors.

Many require licensed/source-backed coverage, seller consent, delivery configuration, specialist review or provider agreements. A worldwide search gateway does not establish those relationships. No review, price chart, inventory, lead, approval, broker partnership, advertised return or geography total is fabricated.

## Review corrections and verification

PR #147 initially introduced fixed blue/white badge colours against the owner's semantic-theme rule and removed keyboard pause when controls were hidden. The review restores the existing theme-aware badge class and supplies a focus-only pause control; the requested normal view remains image-only. Registry/workspace spacing is slightly reduced without moving or deleting actions.

No CSS file, database schema/policy, importer, credentials or paid service changes are needed. Financial calculations are local mathematical scenarios using explicit inputs, never market rates or advice. Tests cover hand-calculated zero-rate cases, equal-budget opportunity costs, prepayment, negative equity, invalid assumptions and bounded/sanitized real viewing history. Physical Android testing is not claimed by automated CI.
