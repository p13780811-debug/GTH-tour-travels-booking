# GTH PRO — Search, Source and Booking Handoff Audit
**2026-11-13 · GTH PRO core: Travel, Real Estate, Tenders, Tickets**

## Root causes verified from source and user screenshots

1. GTH hotel route treated any city/destination/name query as a directory request. A Kolkata query showed 0 imported GTH records, incorrectly suggesting a lack of supplier hotels. Directory source rows have neither live room status nor a verified hotel-ID match. **Fix:** explicit `view=directory` only; booking mode default for external city/search referrals.
2. Mobile universal hotel searches sent Goa, Mumbai, Kolkata and other destinations to `/app/hotels?directory=1` or `/hotels/results?city=...`, confusing research records with supplier bookings. **Fix:** `/app/hotels?view=booking&city=...`; no fabricated Nuitee `placeId`.
3. Stadium search turned raw venue text into GetYourGuide `q=Eden Gardens stadium tour`, which surfaced unrelated **Eden, Australia** activities. **Fix:** one of eleven curated venue guides, first-party exact venue + city routing, official schedule/ticket links. Only catalog-reviewed exact supplier products receive affiliate handoffs. No generic GYG/Klook third-party text redirect from venue search.
4. Several city guides, destination pages and editorial links were labeled “Find hotels” but navigated to GTH’s unbookable source-only accommodation index. **Fix:** true WL booking mode; directory pages remain deliberately distinct with supplier-booking exit.
5. A dormant `HotelScroll` included fabricated 5-star decoration, placeholder price claims, guessed local image paths and a `YOUR_MARKER` affiliate URL. Another unused `HotelSearch` made up Klook hotel request params. Both are replaced by source-honest views and provider search paths; no global CSS added.

## Handoff audit matrix

| Pillar / task | Entry and verified local destination | Booking / official authority | Behavior and limitation |
| --- | --- | --- | --- |
| Hotels | `/hotels?view=booking&city=Kolkata`, `/app/hotels?view=booking&city=Kolkata` | Existing Nuitee SDK SearchBar → `hotel.gthproglobal.com` | Supplier `placeId` is necessary to show real Kolkata listings. Text city is a **hint only**, and user must choose Kolkata from supplier suggestions with dates/occupancy. No server-side room API is called. |
| Hotel directory | `/hotels?view=directory`, `/hotels/results?city=...` | GTH source-backed catalog, optional exact approved hotel partners | Missing GTH rows are not zero supplier rooms. Dedicated “Book a stay on Nuitee” exits are available. |
| Flights | `/flights`, `/app/flights` | Existing Aviasales / Travelpayouts WL `#tpwl-search`, `#tpwl-tickets` | Provider controls live fare, carrier and checkout. |
| Tours and activities | `/tours`, `/activities` | Existing vetted Klook/Travelpayouts search and real source cards | Generic queries are labeled searches, not product inventory, country assignment, confirmed admission or availability. |
| Cruises | `/cruises` | Reviewed exact `/go/cruises/[slug]` products or explicitly labeled Klook / GetYourGuide destination search | Never describe a broad partner search as an exact boat/cruise product or guarantee that results exist. |
| Stadiums | `/stadiums`, `/stadiums/eden-gardens`, `/tickets` | Reviewed official cricket association notice/calendar, exact reviewed partner product if present | “Eden Gardens stadium tour” routes to Kolkata stadium, not “Eden” Australia. At present the reviewed Eden entry has **no verified stadium tour supplier product**. |
| Bus, train, ferry | `/bus`, `/train`, `/ferry` | Existing `/go/transport/search` 12Go affiliate / operator search | Supplier confirms route, schedule, passenger selection and final fare; no invented seat availability. |
| Transfers | `/transfers` | Existing supplier widgets: Kiwitaxi/intui.travel; independent Welcome Pickups/GetTransfer alternatives | Klook transfer activity search is separate from Kiwitaxi/intui transfer booking; each supplier's form controls final data. |
| Car hire | `/cars` | Existing QEEQ/Localrent widgets and an explicitly labeled optional Klook car-rental search | No guaranteed specific vehicle, pickup location, deposit or price. |
| Real Estate | `/real-estate`, `/app/property` and registry | Existing protected property search & Supabase/RLS | Records, registered projects and verified live listings are distinct. No DB/RLS touched. |
| Tenders | `/tender`, `/app/tenders`, official issuing source | Existing cached public notice reader and original buyer portals | A published notice is not GTH’s approval to bid. Eligibility/EMD/deadline verified at official source. |
| Ticket discovery | `/tickets`, `/tickets/[category]` | Reviewed official sellers/venue guides | A directory is not a real-time event seat feed. The original seller determines inventory. |

## Security, performance and truthfulness

- No hardcoded secrets or new external API calls. Nuitee server-side API is **not** hit. No new edge cron, Supabase migration, service-role operation or global CSS.
- No raw user input passed as an arbitrary external URL. Affiliate builders retain fixed approved supplier origins and tracking parameters.
- No claims that a city query is a Nuitee `placeId`; no guessed Google Place IDs, hotel room quotes, event prices, stadium tour dates or official bidding awards.
- Existing protected Real Estate/Nav modules untouched. Separate public source-directory links still serve research and SEO.
- Automated tests cover route intent, venue identity, supplier ownership, safe referrals, direct vendor handoff boundaries and broad current module existence.

## Outstanding external verification

The CI suite checks application logic and production builds; it **cannot verify Nuitee’s live Kolkata inventory**, user’s exact room checkout, GetYourGuide actual partner content, 12Go operator coverage or Google indexing. Those must be assessed on supplier-controlled pages, with appropriate authorized sessions and no unsupported or paid search API requests.
