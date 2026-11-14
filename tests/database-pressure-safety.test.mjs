import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("paused attraction backend cannot silently resume or waste scheduled full downloads", () => {
 const flow=source(".github/workflows/gth-osm-attractions-sync.yml");
 const edge=source("supabase/functions/gth-osm-attractions-ingest/index.ts");
 assert.match(flow,/github\.event_name == 'workflow_dispatch'/);
 assert.match(flow,/default: dry-run/);
 assert.match(edge,/GTH_OSM_ATTRACTIONS_WRITES_ENABLED/);
 assert.match(edge,/writes_disabled:true/);
 assert.match(edge,/jwtVerify/);
});

test("hotel importer is paced and does not overwrite source-enriched images on repeat runs", () => {
 const flow=source(".github/workflows/gth-osm-bulk-hotels.yml");
 const importer=source("scripts/import_osm_hotels.py");
 const edge=source("supabase/functions/gth-hotel-ingest/index.ts");
 assert.match(flow,/MAX_RECORDS=6000/);
 assert.match(importer,/if args\.edge_url and not args\.dry_run:\s*time\.sleep\(2\.0\)/);
 assert.match(edge,/resolution=ignore-duplicates,return=minimal/);
 assert.match(edge,/Catalog backend temporarily unavailable/);
 assert.match(edge,/status:503/);
 assert.match(edge,/payload\.workflow_ref!==WORKFLOW/);
 assert.doesNotMatch(edge,/resolution=merge-duplicates/);
});

test("tender ingestion throttles uploads and stops further sources on protected DB outage", () => {
 const py=source("scripts/tenders/official_publication.py");
 const global=source("scripts/tenders/global_ingestion.py");
 const edge=source("supabase/functions/gth-tender-ingest/index.ts");
 assert.match(py,/range\(0, len\(records\), 20\)/);
 assert.match(py,/time\.sleep\(1\.0\)/);
 assert.match(global,/HTTPError/);
 assert.match(global,/exc\.code in \(502, 503, 504\)/);
 assert.match(global,/remaining sources not submitted/);
 assert.match(edge,/Tender backend temporarily unavailable/);
 assert.match(edge,/status: 503/);
 assert.match(edge,/EXPECTED_AUDIENCE/);
});

test("SEO count cache is scoped per public kind and outages never create fake sitemap entries", () => {
 const seo=source("src/lib/seo/large-sitemaps.ts");
 const root=source("src/app/sitemap-index.xml/route.ts");
 assert.match(seo,/unstable_cache\(/);
 assert.match(seo,/\{revalidate:3600\}/);
 assert.match(seo,/SEO_KINDS\.map\(async kind/);
 assert.match(seo,/SEO count unavailable/);
 assert.match(seo,/count:"exact"/);
 assert.match(root,/status:503/);
 assert.doesNotMatch(root,/fallback[^\n]*<sitemapindex/);
});
