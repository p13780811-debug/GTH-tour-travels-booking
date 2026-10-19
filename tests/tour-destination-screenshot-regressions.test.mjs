import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync(new URL("../src/app/destinations/page.tsx",import.meta.url),"utf8");

test("compact explorer hero closes before directory and featured rails stay outside hero",()=>{
 const heroStart=page.indexOf('<h1 className=');
 const directoryStart=page.indexOf('<section id="discover"');
 const featuredStart=page.indexOf('aria-labelledby="featured-destinations-heading"');
 const featuredRail=page.indexOf('aria-label="Featured destinations horizontal rail"');
 const mapped=page.indexOf('<MappedCityDiscovery');
 assert.ok(heroStart>0&&directoryStart>heroStart);
 assert.ok(featuredStart>directoryStart&&featuredRail>featuredStart&&mapped>featuredRail);
 assert.doesNotMatch(page,/lg:grid-cols-\[1\.05fr_\.95fr\]/);
 assert.match(page,/lg:grid-cols-\[255px_minmax\(0,1fr\)\]/);
});

test("featured cards, horizontal region rails and URL-stable directory pagination remain functional",()=>{
 assert.match(page,/featuredDestinations\.map\(destination=><DestinationCard/);
 assert.match(page,/visible\.filter/);
 assert.match(page,/rail\.items\.map\(\(destination\)=><DestinationCard/);
 assert.match(page,/snap-x snap-mandatory gap-4 overflow-x-auto/);
 assert.match(page,/pageLink\(search,\s*page\s*\+\s*1,\s*country,\s*region,\s*sort,\s*view\)/);
 assert.match(page,/action="\/destinations" method="get"/);
 assert.match(page,/DestinationExplorerResults items=\{visible\}/);
});
