import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("Destination pages link their hotel section and marketplace to destination slugs",()=>{
 const page=read("src/app/destinations/[slug]/page.tsx");
 assert.match(page,/<HotelResults city=\{destination\.name\} destination=\{slug\} compactRail/);
 assert.match(page,/\/hotels\?destination=/);
});
test("Master hotel API validates destination slugs, resolves real active source name and queries source regions",()=>{
 const api=read("src/app/api/hotels/route.ts");
 assert.match(api,/const destination = searchParams\.get\("destination"\)/);
 assert.match(api,/\.eq\("slug",destination\)\.eq\("is_active",true\)/);
 assert.match(api,/city\.ilike\."\+cityLike\+",region\.ilike\."\+cityLike/);
 assert.match(api,/X-GTH-Total/);
 assert.match(api,/affiliate_link: null/);
 assert.doesNotMatch(api,/generateHotels|Math\.random/);
});
test("No synthetic hotels or borrowed property photos when matching destination unavailable",()=>{
 const ui=read("src/app/hotels/results/HotelResults.tsx");
 assert.match(ui,/not imported yet/);
 assert.match(ui,/No verified property photo/);
 assert.match(ui,/Partner booking link not available/);
 assert.match(ui,/rel="noopener noreferrer sponsored"/);
 assert.match(ui,/\/hotels\/stay\//);
 assert.match(ui,/hasMore|setMore/);
});
test("Destination context survives filters and main hotel search",()=>{
 const ui=read("src/app/hotels/page.tsx");
 assert.match(ui,/initialDestination/);
 assert.match(ui,/requestedDestination/);
 assert.match(ui,/destination:requestedDestination/);
 assert.match(ui,/hotelParamsFor\(nextPage\)/);
});
test("Region source can be used for large destination regions only when original OSM tags contain it",()=>{
 const script=read("scripts/import_osm_hotels.py");
 const edge=read("supabase/functions/gth-hotel-ingest/index.ts");
 const sql=read("supabase/migrations/20261015211800_hotel_destination_region_source.sql");
 assert.match(script,/addr:state/);
 assert.match(script,/"region": region/);
 assert.match(edge,/region:string\(raw\.region,100\)/);
 assert.match(sql,/add column if not exists region text/);
 assert.match(sql,/never infer location from download boundaries/i);
});
test("OSM hotel identifiers are path-safe and hotel details resolve stable OSM IDs",()=>{
 const api=read("src/app/api/hotels/route.ts");
 const page=read("src/app/hotels/stay/[id]/page.tsx");
 assert.match(api,/hotel\.source_id\.replace\("\/",\s*"-"\)/);
 assert.match(page,/sourceId=id\.slice\(4\)\.replace\("-","\/"\)/);
});
test("Priority India six-zone coverage and global scheduled licensed extracts are bounded",()=>{
 const workflow=read(".github/workflows/gth-osm-bulk-hotels.yml");
 assert.match(workflow,/india\/eastern-zone/);
 assert.match(workflow,/india\/western-zone/);
 assert.match(workflow,/india\/southern-zone/);
 assert.match(workflow,/python3 scripts\/hotels\/resolve_region\.py/);
 assert.match(workflow,/MAX_RECORDS=25000/);
 assert.match(workflow,/id-token: write/);
 assert.doesNotMatch(workflow,/secrets\.GTH_SUPABASE_INGESTION_KEY/);
});
