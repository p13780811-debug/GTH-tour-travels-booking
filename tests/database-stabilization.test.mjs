import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const catalog=fs.readFileSync("src/lib/tender/catalog.ts","utf8");
const edge=fs.readFileSync("supabase/functions/gth-osm-attractions-ingest/index.ts","utf8");
const phase1=fs.readFileSync("supabase/migrations/20261029013000_db_stabilization_phase1.sql","utf8");
const phase2=fs.readFileSync("supabase/migrations/20261029014000_db_stabilization_phase2.sql","utf8");

test("tender marketplace uses one aggregate RPC instead of exact-count fanout",()=>{
 assert.match(catalog,/gth_tender_market_metrics/);
 assert.doesNotMatch(catalog,/count:"exact"/);
 assert.match(catalog,/stats\?: TenderDiscoveryStats/);
});

test("attraction ingestion is default-paused and refreshes summaries only after a completed run",()=>{
 assert.match(edge,/GTH_OSM_ATTRACTIONS_WRITES_ENABLED/);
 assert.match(edge,/gth_refresh_osm_attraction_summary/);
 assert.match(edge,/summary_refreshed:true/);
});

test("summary cutover is precomputed, RLS-enabled and security-invoker",()=>{
 assert.match(phase1,/gth_osm_attraction_country_summary/);
 assert.match(phase1,/enable row level security/);
 assert.match(phase1,/gth_osm_attractions_public_city_norm_idx/);
 assert.match(phase2,/gth_refresh_osm_attraction_summary\(null\)/);
 assert.match(phase2,/security_invoker=true/);
});

test("tender hot paths have country, sector, newest and trigram indexes",()=>{
 for(const name of [
  "tenders_public_country_deadline_id_idx",
  "tenders_public_sector_deadline_id_idx",
  "tenders_public_imported_id_idx",
  "tenders_public_title_trgm_idx"
 ]) assert.match(phase1,new RegExp(name));
});
