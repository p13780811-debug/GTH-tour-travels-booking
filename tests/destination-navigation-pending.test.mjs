import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const card=read("src/components/destination/DestinationCard.tsx");
const explorer=read("src/components/destination/DestinationExplorerResults.tsx");
const loader=read("src/app/destinations/[slug]/loading.tsx");
const pending=read("src/components/destination/DestinationOpeningOverlay.tsx");
const detail=read("src/app/destinations/[slug]/page.tsx");
test("all destination card routes show immediate contextual loading instead of old footer",()=>{
 assert.match(card,/onClick=\{event=>\{if\(isNormalDestinationNavigation\(event\)\)setOpening\(true\);\}\}/);
 assert.match(card,/<DestinationOpeningOverlay city=\{destination\.title\}/);
 assert.match(explorer,/onClick=\{event=>opening\(event,item\.title\)\}/);
 assert.match(explorer,/<DestinationOpeningOverlay city=\{openingCity\}/);
 assert.match(pending,/fixed inset-0 z-\[200\]/);
 assert.match(pending,/Opening \{city\}/);
 assert.match(pending,/!event\.ctrlKey/);
});
test("destination detail has request-safe loading fallback, not duplicate footer or external iframe",()=>{
 assert.match(loader,/role="status"/);
 assert.match(loader,/aria-busy="true"/);
 assert.match(loader,/<TravelSectionNav\/>/);
 assert.doesNotMatch(loader,/iframe|EcosystemFooter|window\.location|service_role/);
 assert.match(detail,/href=\{city\?"#city-spine-hub":"#destination-ecosystem"\}/);
});
