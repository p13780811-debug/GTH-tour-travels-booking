import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../../../",import.meta.url));
const git=(...args)=>execFileSync("git",args,{cwd:root,encoding:"utf8"});
const paths=[git("diff","--name-only","origin/main...HEAD"),git("diff","--name-only","HEAD"),git("ls-files","--others","--exclude-standard")]
 .flatMap(text=>text.trim().split("\n").filter(Boolean));
// Owner expanded PR #153 on 9 Nov 2026 to ship the finished app and OSM
// place SEO together in one release. Keep an exact website allowlist; all
// booking engines, homepage, shared CSS, DB and deployment files stay protected.
const approvedOsmSeo=new Set([
 "src/lib/travel/osm-place.ts","src/lib/travel/osm-place-reader.ts","src/lib/seo/osm-sitemaps.ts",
 "src/app/(mapped-places)/attractions/osm/[id]/page.tsx","src/app/(mapped-places)/attractions/osm/[id]/error.tsx",
 "src/app/attractions/sitemap.xml/route.ts","src/app/attractions/sitemaps/[country]/[page]/route.ts",
 "src/app/attractions/page.tsx","src/components/travel/OSMAttractionsRail.tsx","src/app/robots.ts",
 "tests/osm-place-seo.test.mjs","tests/osm-place-cache.test.mjs",
 "src/lib/travel/cachedDiscovery.ts","tests/osm-attractions-contract.test.mjs",
 "tests/travel-guide-contract.test.mjs","tests/travel-tab-navigation-performance.test.mjs",
 "scripts/monitor-seo.mjs",
 "scripts/qa-osm-place-seo.mjs","docs/releases/osm-places-seo-20261109.md",
]);
const unexpected=[...new Set(paths)].filter(path=>!path.startsWith("apps/gth-mobile/")&&
 path!==".github/workflows/gth-independent-native-ci.yml"&&path!=="tsconfig.json"&&!approvedOsmSeo.has(path));
if(unexpected.length)throw Error("Consolidated app/OSM PR changes protected files:\n"+unexpected.join("\n"));
const baseline=git("show","origin/main:tsconfig.json");
const current=readFileSync(new URL("../../../tsconfig.json",import.meta.url),"utf8");
const allowed=baseline.includes('"apps/gth-mobile/**"')?baseline:
 baseline.replace('"supabase/functions/**"','"supabase/functions/**",\n    "apps/gth-mobile/**"');
if(current!==allowed)throw Error("Only the isolated native-folder exclusion may differ in website tsconfig.json");
console.log("PASS: only native app and exact owner-approved OSM SEO files differ; homepage, booking engines, shared CSS, database and deployment files match main.");
