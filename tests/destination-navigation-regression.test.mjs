import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const directory=read("src/app/destinations/page.tsx");
const geo=read("src/components/destination/GeoCityIntro.tsx");
const detail=read("src/app/destinations/[slug]/page.tsx");
const reset=read("src/components/destination/DestinationPageScroll.tsx");
test("three GET search forms navigate visibly to destination results, not the previous scroll position",()=>{
 assert.match(directory,/role="search" action="\/destinations#discover" method="get"/);
 assert.match(directory,/method="get" action="\/destinations#discover"/);
 assert.match(geo,/action="\/destinations#discover" role="search"/);
 assert.match(directory,/<section id="discover"/);
 assert.match(directory,/showMappedCities=!search&&!hasCountry&&!region&&requestedPage===1/);
 assert.match(directory,/showBrowse=!search&&!hasCountry&&!region&&page===1/);
 assert.match(directory,/showBrowse&&rails\.length>0/);
 assert.match(directory,/showBrowse&&<MappedCityDiscovery/);
});
test("Goa guide scroll restoration is local to destination detail route",()=>{
 assert.match(detail,/<DestinationPageScroll\/>/);
 assert.match(reset,/useLayoutEffect/);
 assert.match(reset,/window\.scrollTo/);
 assert.match(reset,/window\.location\.hash/);
 assert.doesNotMatch(reset,/localStorage|document\.body\.style|service_role|\.module\.css/);
});
test("metadata identity is deduplicated and city/tour reads overlap without DB mutation",()=>{
 assert.match(detail,/cache\(async function getDestination/);
 assert.match(detail,/Promise\.all\(\[destinationTask,cityTask,tourTask\]\)/);
 assert.match(detail,/const availableTours = availableTourRows\.slice\(0, 6\)/);
 assert.match(detail,/resolveCityContext\(db,\{ slug \}\)/);
 assert.match(detail,/getTours\(\{ city: slug \}\)/);
 assert.doesNotMatch(detail,/\.insert\(|\.upsert\(|\.delete\(|\.update\(/);
});
