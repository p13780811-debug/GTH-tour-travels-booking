# Nuitee free-content integration and cost boundary

Verified scope: 9 November 2026. The owner confirmed completed Production activation, DNS, and the Active & Verified custom White Label at **https://hotel.gthproglobal.com** (singular `hotel`). Account activation is complete; it is separate from providing a server-side REST credential to Vercel.

## Documentation reviewed

The owner supplied the current official [API Pricing & Usage Costs](https://docs.liteapi.travel/reference/api-pricing-usage-costs) text. The official `liteapi-node-sdk` **4.3.2** package was downloaded from npm into an isolated `/tmp` review directory; its repository is https://github.com/liteapi-travel/nodejs-sdk . No package/dependency was added to GTH.

| Endpoint/category | Published standard price/condition | This implementation |
| --- | --- | --- |
| Places search/lookup | $0.01/request | Never called by GTH's REST integration |
| Price Index | $0.05/request | Never called |
| Hotel content and other non-priced metadata | Free under ToS/reasonable use | Only fixed GET `/v3.0/data/currencies` and `/v3.0/data/hotels` enabled |
| Rates → Prebook → Book | Free under ToS and reasonable look-to-book ratio | Existing public SDK and provider checkout retained; no new direct REST workflow |
| Flights search/ticketing/modification | Separate surcharges/fees described by the pricing page | No integration change |
| Paid seats/AI Insights/logs/reports | Optional recurring add-ons | None activated |

SDK source confirmed `X-API-Key` authentication, currency response `data[]` with `code`/`currency`, and hotel content parameters `countryCode`, `cityName`, `limit`, `offset`, plus hotel ID/name/address/photo/country/city/coordinates/stars fields. Countries, cities, facilities, types, chains, IATA and hotel-detail endpoints were also reviewed; duplicate dictionary requests or a replacement booking engine are unnecessary for this release.

The workspace's direct documentation/SDK HTTP requests returned 403 even after network permission. Pricing provenance is the owner's supplied official text; endpoint/auth/schema provenance is the downloaded official Node SDK. No authenticated live probe or chargeable supplier call was performed.

## Implemented free scope

- Worldwide SearchBar, real supplier HotelsList photographs/links, hotel details/amenities/rooms and secure provider checkout remain on the existing public White Label flow.
- Nine existing booking currencies now have a visible selector. Choice survives SDK searches, supplier lists, exact hotel links, dates, rooms and child ages. Defaults remain INR for existing app callers.
- `nuitee-free-currencies.ts` is server-only and reads only the production-specific credential. It calls the one fixed free metadata GET with a 5-second timeout, redirect rejection, bounded response parsing and a 24-hour shared Next data cache. Concurrent same-worker misses coalesce. Missing key/failure retains the original nine options; failures have a five-minute worker cooldown.
- `nuitee-free-hotels.ts` calls only fixed GET `/data/hotels`, never Places or rates. Profiles cache for 24 hours by normalized country/city/page; each page fetches at most 24 records, with pages bounded to 100. Responses validate the requested country/city, IDs, photo URL, stars and coordinates. API prices, private fields and unrecognized fields are never returned or cached.
- Visitor Geo-IP city profiles come first, then country profiles, then the existing worldwide discovery. Explicit area selection overrides all inferred location. No GPS permission, raw visitor IP or exact visitor-coordinate persistence.
- Inferred responses and partial failures are private/no-store. Explicit complete area responses alone qualify for shared CDN caching. Only public property snapshots are shared; personalized ordering is performed after reading them.
- No Supabase query/table/write is added by these features. The existing directory and its source/provenance rules remain separate.

## Request protection and credentials

Only `NUITEE_PRODUCTION_API_KEY` is read, on the server. Old Preview-only sandbox keys/mode flags are not read. No credential value was requested in chat, copied, created or modified by this work. Set that variable securely in **Vercel Production** to activate the direct free-content source if it is not already configured. The public White Label remains functional independently; without the key, currencies retain a local fallback and nearby content returns an honest unavailable state, never fabricated local hotels.

Cache fills alone consume the new `hotel_content` scope in the existing Upstash limiter: shared 30/minute and 1,000/day per environment. All prior limiter policies/code remain byte-identical after removing that one type/policy addition. If Redis is absent, the fallback is 10/minute and 200/day **per worker**, not an account-wide/fleet-wide quota guarantee. Configured limiter failure stops cold supplier reads. Hotel-content failures have a two-minute worker cooldown; successful warm reads consume no new upstream request or budget.

These caps/cache policies bound ordinary use. Standard free endpoints remain subject to the supplier's ToS, fair usage and commercial agreement; this is not a claim of unlimited free account activity. Supplier SDK behavior/fees remain governed by the White Label agreement.

`tests/nuitee-free-usage-boundary.test.mjs` permits private REST access only in the two reviewed server modules at their exact free URLs. All other production source is checked for private supplier REST hosts and credential lookups. Tests also verify no-key/no-budget paths make zero upstream calls, warm/concurrent reads coalesce, paid/path-injection requests are rejected, and private keys do not appear in public output.
