import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync(new URL("../src/app/destinations/page.tsx",import.meta.url),"utf8");

test("featured destination rail follows the complete hero, not a hero grid column",()=>{
  const heroEnd=page.indexOf('      </section>\n\n      {featuredDestinations.length>0&&<section');
  const featuredStart=page.indexOf('aria-labelledby="featured-destinations-heading"');
  const featuredRail=page.indexOf('aria-label="Featured destinations horizontal rail"');
  const directoryStart=page.indexOf('<section id="discover"');
  assert.ok(heroEnd>0,"Standalone hero must be closed before featured rails");
  assert.ok(featuredStart>heroEnd&&featuredRail>featuredStart);
  assert.ok(directoryStart>featuredRail);
  assert.doesNotMatch(page,/lg:grid-cols-\[1\.05fr_\.95fr\]/);
  assert.match(page,/className="mx-auto max-w-7xl min-w-0 px-4 pb-4 pt-8/);
});

test("all destination cards and existing directory pagination remain functional",()=>{
  assert.match(page,/featuredDestinations\.map\(\(destination\)=><DestinationCard/);
  assert.match(page,/snap-x snap-mandatory gap-4 overflow-x-auto/);
  assert.match(page,/visible\.filter/);
  assert.match(page,/pageLink\(search, page \+ 1, country, region, sort\)/);
  assert.match(page,/action="\/destinations" method="get"/);
});
