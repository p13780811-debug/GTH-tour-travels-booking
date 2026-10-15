import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const f=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Six-hour hotel sync uses GitHub OIDC, not stored ingestion secrets",()=>{
 const yaml=f(".github/workflows/gth-osm-bulk-hotels.yml");
 assert.match(yaml,/id-token: write/);
 assert.match(yaml,/GTH_HOTEL_OIDC_TOKEN/);
 assert.match(yaml,/gth-hotel-ingest/);
 assert.match(yaml,/on:\s*\n\s*schedule:/);
 assert.doesNotMatch(yaml,/secrets\.(GTH_SUPABASE|SUPABASE_INGESTION)/);
});
test("Global importer accepts source-country metadata while avoiding made-up hotel IDs",()=>{
 const code=f("scripts/import_osm_hotels.py");
 assert.match(code,/--country-code/);
 assert.match(code,/--edge-url/);
 assert.match(code,/GTH_HOTEL_OIDC_TOKEN/);
 assert.match(code,/node\|way\|relation/);
});
test("Edge gateway restricts GitHub claims and source row fields",()=>{
 const edge=f("supabase/functions/gth-hotel-ingest/index.ts");
 assert.match(edge,/jwtVerify\(bearer\.slice\(7\),JWKS/);
 assert.match(edge,/payload\.workflow_ref!==WORKFLOW/);
 assert.match(edge,/source_license:"ODbL-1\.0"/);
 assert.match(edge,/SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(edge,/Object\.keys\(raw\)\.some\(k=>!KEYS\.has\(k\)\)/);
 assert.match(edge,/authorized|Unauthorized/);
});
test("Legacy public hotel CRUD is disabled and ODbL data attribution remains",()=>{
 const sql=f("supabase/migrations/20261015203000_hotel_public_read_hardening.sql");
 assert.match(sql,/drop policy if exists "Allow public insert hotels"/);
 assert.match(sql,/drop policy if exists "Allow update hotels"/);
 assert.match(sql,/drop policy if exists "Allow delete hotels"/);
 assert.match(sql,/media_rights_verified is true/);
 assert.match(sql,/revoke all on public\.hotels from public,anon,authenticated/);
});
test("Catalog API uses country, category, safe links and no fabricated ratings or prices",()=>{
 const api=f("src/app/api/hotels/route.ts");
 assert.match(api,/x-vercel-ip-country/);
 assert.match(api,/catalogCountQuery\.eq\("category",category\)/);
 assert.match(api,/source_license: "ODbL-1\.0"/);
 assert.match(api,/affiliate_link: null/);
 assert.match(api,/media_rights_verified/);
 assert.doesNotMatch(api,/Math\.random|generateHotels\(/);
});
test("Hotel pages offer source-backed details and country-first filter without inventing bookings",()=>{
 const page=f("src/app/hotels/page.tsx");
 const details=f("src/app/hotels/stay/[id]/page.tsx");
 assert.match(page,/HotelCatalogPulse/);
 assert.match(page,/setCategory/);
 assert.match(page,/View hotel details/);
 assert.match(details,/Hotel directory/);
 assert.match(details,/room offer/);
 assert.match(details,/source_url/);
 assert.match(details,/source:"OpenStreetMap"/);
});
