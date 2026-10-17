import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("CC0 facts are private until review; upsert never changes publication or earlier photo approval",()=>{
 const sql=read("supabase/migrations/20261017200000_open_attractions.sql");
 assert.match(sql,/is_public boolean NOT NULL DEFAULT false/);
 assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
 assert.match(sql,/USING \(is_public=true\)/);
 assert.match(sql,/gth_upsert_open_attractions/);
 assert.match(sql,/COALESCE\(EXCLUDED.image_url,existing.image_url\)/);
 assert.doesNotMatch(sql,/is_public=EXCLUDED.is_public/);
});
test("Affiliate links start inactive with RLS-bound reviewed approvals",()=>{
 const sql=read("supabase/migrations/20261017201000_approved_tour_affiliate_links.sql");
 assert.match(sql,/approved_by_admin boolean NOT NULL DEFAULT false/);
 assert.match(sql,/is_active boolean NOT NULL DEFAULT false/);
 assert.match(sql,/p.is_public=true/);
});
test("Public API only returns RLS-published source records, no tickets/ratings",()=>{
 const api=read("src/app/api/travel/attractions/route.ts");
 for(const value of ["is_public","gth_open_attractions","gth_attraction_affiliate_links","bookable_on_gth:false","live_price:null","live_availability:null","safeAffiliateUrl"])
  assert.ok(api.includes(value),value);
 assert.doesNotMatch(api,/SUPABASE_SERVICE_ROLE_KEY|Math.random/);
});
test("City cards use same-size global theme rail and individual Commons credits",()=>{
 const ui=read("src/components/travel/OpenAttractionsRail.tsx");
 const dest=read("src/app/destinations/[slug]/page.tsx");
 assert.match(ui,/h-64 w-60 shrink-0 snap-start/);
 assert.match(ui,/snap-x snap-mandatory/);
 assert.match(ui,/commons_page/);assert.match(ui,/image_license_url/);
 assert.match(ui,/var\(--card\)/);
 assert.match(dest,/OpenAttractionsRail/);
});
test("Signed importer does not expose service keys or auto-publish community records",()=>{
 const script=read("scripts/attractions/wikidata_attractions.py");
 const edge=read("supabase/functions/gth-open-attractions-ingest/index.ts");
 const workflow=read(".github/workflows/gth-open-attractions-sync.yml");
 assert.match(script,/Retry-After/);
 assert.match(script,/GTH_ATTRACTIONS_OIDC_TOKEN/);
 assert.match(script,/--fixture/);
 assert.doesNotMatch(script,/is_public.*True|fake_price|booking_price/);
 assert.match(edge,/jwtVerify/);assert.match(edge,/payload.workflow_ref!==WORKFLOW/);
 assert.match(edge,/String\(payload.repository_id\)!=="1169920747"/);
 assert.match(workflow,/id-token: write/);
 assert.match(workflow,/scripts\/attractions\/wikidata_attractions.py/);
 assert.doesNotMatch(workflow,/SUPABASE_SERVICE_ROLE_KEY/);
});
