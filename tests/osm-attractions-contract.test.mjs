import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Source ODbL table only exposes community directory with RLS",()=>{
 const sql=read("supabase/migrations/20261017183000_osm_open_attractions.sql");
 assert.match(sql,/source_id text PRIMARY KEY/);
 assert.match(sql,/is_community_directory boolean NOT NULL DEFAULT true/);
 assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
 assert.match(sql,/is_public=true AND is_community_directory=true/);
 assert.match(sql,/REVOKE ALL ON public.gth_osm_attractions FROM PUBLIC,anon,authenticated/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public.gth_upsert_osm_attractions\(jsonb\) TO service_role/);
 assert.doesNotMatch(sql,/affiliate_link|price_numeric|rating/);
});
test("Cloud sync uses six India Geofabrik source zones and fixed official HTTPS",()=>{
 const wf=read(".github/workflows/gth-osm-attractions-sync.yml");
 for(const zone of ["western","northern","southern","eastern","central","north-eastern"])assert.ok(wf.includes("asia/india/"+zone+"-zone"));
 assert.match(wf,/download.geofabrik.de\/\$REGION-latest.osm.pbf/);
 assert.match(wf,/osmium tags-filter/);
 assert.match(wf,/--geometry-types=point,polygon/);
 assert.match(wf,/id-token: write/);
 assert.match(wf,/GTH_OSM_ATTRACTIONS_OIDC_TOKEN/);
 assert.doesNotMatch(wf,/SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_SERVICE/);
});
test("OIDC endpoint verifies exact repository identity and rejects source surprises",()=>{
 const fn=read("supabase/functions/gth-osm-attractions-ingest/index.ts");
 assert.match(fn,/createRemoteJWKSet/);
 assert.match(fn,/jwtVerify/);
 assert.match(fn,/payload.workflow_ref!==WORKFLOW/);
 assert.match(fn,/String\(payload.repository_id\)!=="1169920747"/);
 assert.match(fn,/gth_upsert_osm_attractions/);
 assert.match(fn,/rows.length>100/);
 assert.match(fn,/source_url/);
});
test("Tours index, API and directory include ODbL attribution; no false tickets",()=>{
 const api=read("src/app/api/travel/osm-attractions/route.ts");
 const page=read("src/app/attractions/page.tsx");
 const rail=read("src/components/travel/OSMAttractionsRail.tsx");
 const tours=read("src/app/tours/page.tsx");
 for(const s of [api,page,rail])assert.match(s,/OpenStreetMap/);
 assert.match(api,/verified_tickets:false/);
 assert.match(api,/photo_url:null/);
 assert.match(page,/robots:\{index:false,follow:true\}/);
 assert.match(page,/snap-x snap-mandatory/);
 assert.match(rail,/h-64 w-60 shrink-0 snap-start/);
 assert.match(tours,/OSMAttractionsRail/);
 assert.doesNotMatch(rail,/Math\.random|price_numeric|affiliate_link/);
});
