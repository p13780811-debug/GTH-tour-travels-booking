import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Licensed Wikimedia media lives in a separate public-read/private-write table",()=>{
 const sql=read("supabase/migrations/20261017062000_hotel_wikimedia_media_overlay.sql");
 assert.match(sql,/create table if not exists public.hotel_catalog_media/);
 assert.match(sql,/foreign key\(source,source_id\)/);
 assert.match(sql,/references public\.hotel_catalog\(source,source_id\)/);
 assert.match(sql,/image_url text not null/);
 assert.match(sql,/author text not null/);
 assert.match(sql,/license_name text not null/);
 assert.match(sql,/commons_page text not null/);
 assert.match(sql,/enable row level security/);
 assert.match(sql,/grant select on public\.hotel_catalog_media to anon,authenticated/);
 assert.doesNotMatch(sql,/grant (insert|update|delete) on public\.hotel_catalog_media to anon/i);
});

test("GitHub identity and media source are verified server-side without public credentials",()=>{
 const edge=read("supabase/functions/gth-hotel-wikimedia/index.ts");
 assert.match(edge,/createRemoteJWKSet/);
 assert.match(edge,/jwtVerify\(authorization\.slice\(7\),JWKS/);
 assert.match(edge,/payload\.workflow_ref!==WORKFLOW/);
 assert.match(edge,/payload\.repository!==REPO/);
 assert.match(edge,/media batch/i);
 assert.match(edge,/upload\.wikimedia\.org/);
 assert.match(edge,/commons\.wikimedia\.org/);
 assert.match(edge,/LICENSES\.get\(license\)!==licenseUrl\.toString\(\)/);
 assert.match(edge,/SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(edge,/Object\.keys\(record\)\.some\(k=>!\[/);
 assert.doesNotMatch(edge,/NEXT_PUBLIC_.*SERVICE_ROLE|google\.com\/maps\/search/);
});

test("Hotel catalog cards and details show actual Commons author/file/license, not fake photos",()=>{
 const api=read("src/app/api/hotels/route.ts");
 const list=read("src/app/hotels/page.tsx");
 const detail=read("src/app/hotels/stay/[id]/page.tsx");
 assert.match(api,/hotel_catalog_media/);
 assert.match(api,/\.in\("source_id",candidates\.slice\(0,24\)\)/);
 assert.match(api,/image_attribution/);
 assert.match(list,/hotel\.image_attribution\.commons_page/);
 assert.match(list,/hotel\.image_attribution\.license_url/);
 assert.match(detail,/hotel\.imageCredit\.commonsPage/);
 assert.match(detail,/hotel\.imageCredit\.licenseUrl/);
 assert.match(detail,/\.from\("hotel_catalog_media"\)/);
 assert.doesNotMatch(api,/Math\.random/);
});

test("Free photos run inside existing scheduled OSM OIDC ingestion, not by Google Places scraping",()=>{
 const workflow=read(".github/workflows/gth-osm-bulk-hotels.yml");
 const script=read("scripts/hotels/enrich_wikimedia_photos.py");
 assert.match(workflow,/id-token: write/);
 assert.match(workflow,/GTH_HOTEL_OIDC_TOKEN/);
 assert.match(workflow,/enrich_wikimedia_photos\.py/);
 assert.match(workflow,/--limit 20 --rotation-slot/);
 assert.match(workflow,/gth-hotel-wikimedia/);
 assert.match(script,/P625/);
 assert.match(script,/P18/);
 assert.match(script,/QID\.fullmatch\(raw_qid\)/);
 assert.match(script,/explicitly_tagged_commons_file/);
 assert.match(script,/method = "osm_commons_file"/);
 assert.match(script,/method = "wikidata_p18"/);
 assert.match(script,/LICENCES/);
 assert.match(script,/--dry-run/);
 assert.doesNotMatch(script,/GOOGLE_PLACES_API_KEY|RAPIDAPI_KEY|AMADEUS_API_KEY/);
});
