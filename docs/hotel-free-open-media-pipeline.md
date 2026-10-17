# GTH PRO free hotel sourcing and licensed media enrichment (October 2026)

## Enabled no-card sources
- **OpenStreetMap / Geofabrik**: existing bounded ODbL regional extracts and verified OSM element IDs; covers location directory facts, not bookable room inventory. The three-times-daily GitHub Actions OIDC importer is unchanged. Do not use public Overpass as a bulk-world backend.
- **Wikidata / Wikimedia Commons**: new secondary media overlay for OSM accommodation with an explicit `wikidata=Q...` tag. Confirm Wikidata English/other label or alias matches the actual OSM hotel name, and if Wikidata has coordinates ensure its point is within 1.2 km. Take only P18 image with reusable license/artist confirmed by the Commons imageinfo API.
- Only accept licenses `CC BY 3.0`, `CC BY 4.0`, `CC BY-SA 3.0`, `CC BY-SA 4.0`, `CC0`, `Public domain`, with a precise allowed license URL. Records without verifiable licence/author/location/name do **not** receive a photo.
- Store only the Wikimedia-hosted, per-file licensed thumbnail URL plus Commons file page, photo author, license name/URL, and source ID. **Never bulk copy Commons photo bytes**, invent photos, claim owner authority, or change any existing `hotel_catalog.image_url` on OSM refresh.
- Display visible Commons author, file-page, and license links alongside each resulting photo. Keep OSM ODbL attribution.

## Limits and operating constraints
- Existing OSM import: max 25,000 *accepted records per region/run*; not a guarantee of 25,000 new unique hotels.
- Commons enrichment: max **20 candidate OSM-linked Wikidata hotel IDs per sync** (maximum 60 per scheduled UTC day), slow serial requests, rotation by date/hour; zero if no explicit QID link, available free license or source image.
- Follow MediaWiki/Commons API User-Agent, 429 Retry-After, daily fair-use and restrictive licenses. Never call every hotel as an API request, or distribute requests across identities to evade quotas.
- Wikimedia response errors do not break existing core OSM import; job marks the media enrichment step in GitHub Actions logs.
- GitHub Actions uses the existing OIDC identity: exact `refs/heads/main`, bound workflow path, and separate signed `gth-hotel-wikimedia` audience. Supabase service-role key remains **inside Supabase Edge Functions**, not Github or browser.
- Supabase migration: `supabase/migrations/20261017062000_hotel_wikimedia_media_overlay.sql`, table `hotel_catalog_media`. Public anonymous role has SELECT but not INSERT/UPDATE/DELETE.
- Edge function: `gth-hotel-wikimedia`; deploy with `verify_jwt=false` because GitHub OIDC is explicitly RS256 verified server-side, and no Supabase JWT is sent. Only the bound GitHub workflow can write.
- CSS, global design, existing hotel cards and Real Estate unchanged except source-backed photo and attribution display. No manual Vercel deployment: only GitHub main auto-deploy.

## Sources NOT activated without authorization
- **Amadeus Self-Service**: real quotas vary by API, app, test/production access and accepted commercial agreements. Credentials are not connected. Never extrapolate thousands of valid bookable hotels from a generic “2,000 calls” estimate or keep supplier data without licensed storage rights. Only consider source-specific integration after rights and free-usage gates are confirmed.
- **Google Maps Places**: old $200 monthly credit ended March 2025. Requires a billing-enabled project for Places usage and restricts persistent store/republication of Google Maps content. User requested no card/billing. Existing Google Places feature stays OFF.
- **RapidAPI unofficial Booking.com/TripAdvisor scrapers**: a third-party “free API” subscription does not grant a license to copy competing services' hotel photos/ratings/reviews into our persistent DB. Not connected.
- **Owner-supplied original photos**: existing hotel owner onboarding and manually approved public gallery remains the preferred lawful long-term source.

## Go-live checks
1. Apply new schema migration to Supabase.
2. Deploy strictly scoped new Supabase Edge Function (not a Vercel deployment) after tests are green.
3. Merge the reviewed GitHub PR; existing `main` trigger and schedule download licensed regional extracts, run the bounded Wikimedia source check and write attributed media overlay.
4. Confirm `hotel_catalog_media` row counts and photo URL/credit fields before claiming increased coverage. Google can only index actual quality content and legally licensed photos; counts and ranks not guaranteed.

**No budget assumption:** This integration performs no paid Google/Amadeus/RapidAPI calls, but Github/Supabase quotas and Wikimedia fair-use rules still apply. Never promise unlimited zero-cost resources.
