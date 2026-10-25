import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read = (p) => readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("Tours loading renders useful, source-honest route-level feedback",()=>{
 const s=read("src/app/tours/loading.tsx");
 assert.match(s,/export default function ToursLoading/);
 assert.match(s,/role="status"/);
 assert.match(s,/aria-live="polite"/);
 assert.match(s,/<TourSearchHero basePath="\/tours"/);
 const hero=read("src/components/tours/TourSearchHero.tsx");
 assert.match(hero,/role="search"/);
 assert.match(hero,/mode.action/);
 assert.doesNotMatch(s,/\$\d|available tickets today|confirmed booking/);
});
test("Tenders loading is accessible and doesn't fabricate public opportunities",()=>{
 const s=read("src/app/tender/loading.tsx");
 assert.match(s,/export default function TenderLoading/);
 assert.match(s,/role="status"/);
 assert.match(s,/aria-live="polite"/);
 assert.match(s,/original issuing authorities/);
 assert.match(s,/href="\/tender\/assistant"/);
 assert.match(s,/animate-pulse/);
 assert.doesNotMatch(s,/123|10000 tenders|live now/);
});
test("existing Tours/Tenders forms and source-backed result engines preserved",()=>{
 const tours=read("src/components/tours/ToursExplorer.tsx");
 const tender=read("src/app/tender/page.tsx");
 assert.match(tours,/searchTours\(/);
 assert.match(tours,/method="GET"/);
 assert.match(tender,/searchPublicTenders\(searchFilters\)/);
 assert.match(tender,/getTenderDiscoveryStats\(searchFilters\)/);
});
