import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const read=p=>readFileSync(resolve(root,p),"utf8");
const page=read("src/app/mega-aggregator/page.tsx");
const hub=read("src/app/mega-aggregator/EcosystemHub.tsx");
const search=read("src/app/mega-aggregator/EcosystemUnifiedSearch.tsx");
test("One mobile-compact hero and one first-party search on the page only",()=>{
 assert.match(page,/<HeroSlider \/>/);
 assert.match(page,/hidden xl:block/);
 const mobileHero=read("src/app/mega-aggregator/EcosystemHeroCarousel.tsx");
 assert.match(page,/<EcosystemHeroCarousel \/>/);
 assert.match(mobileHero,/Your world\. One connected gateway\./);
 assert.match(mobileHero,/aspect-\[2\/1\]/);
 assert.match(mobileHero,/setInterval/);
 assert.match(mobileHero,/onTouchStart/);
 assert.doesNotMatch(page,/gth-master-intro/);
 assert.match(page,/<EcosystemUnifiedSearch \/>/);
 assert.match(page,/<EcosystemPillars \/>/);
 assert.match(page,/<EcosystemHub \/>/);
 assert.match(search,/action="\/search" method="get"/);
 assert.doesNotMatch(search,/12Go|Klook|GetYourGuide/);
});
test("One directory provides all service routes without three duplicate menus",()=>{
 assert.match(hub,/useState<Selection>\("all"\)/);
 assert.match(hub,/value=\{serviceQuery\}/);
 assert.match(hub,/aria-pressed=\{active === filter.key\}/);
 assert.match(hub,/visibleServices\.map/);
 assert.match(hub,/View all \{availableServices\.length\} services/);
 assert.match(hub,/grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8/);
 assert.doesNotMatch(hub,/id="ecosystem-highlights"|id="ecosystem-links"|<details|<nav aria-label="Ecosystem pillars"/);
 assert.doesNotMatch(search,/<nav aria-label="Open a service directly"/);
 assert.doesNotMatch(page,/id="travel-services"|aria-label="Additional travel services"/);
});
test("Main directory covers 32 implemented routes including real estate and tenders",()=>{
 const source=hub.split("const services = [")[1]?.split("] as const;")[0]||"";
 const paths=[...source.matchAll(/href: "(\/[^"]+)"/g)].map(x=>x[1]);
 assert.equal(paths.length,32);
 assert.equal(new Set(paths).size,paths.length);
 for(const route of paths)assert.ok(existsSync(resolve(root,"src/app"+route+"/page.tsx")),route);
 for(const expected of ["/stadiums","/bus","/train","/flights","/hotels","/destinations","/real-estate","/tender","/partners"])
   assert.ok(paths.includes(expected),expected);
 assert.match(hub,/primaryServiceHrefs/);
 assert.match(hub,/setShowAll\(true\)/);
});
test("No hardcoded black backgrounds or manual dark overlays in Mega page",()=>{
 assert.doesNotMatch(page,/bg-black|from-black|via-black|to-black|bg-slate|bg-gradient|text-amber|border-white/);
 assert.match(page,/gth-glass/);
 assert.match(page,/className="w-full transition-colors/);
 assert.doesNotMatch(page,/className="gth-master-home/);
 assert.doesNotMatch(page,/gth-master-home w-full bg-/);
 assert.doesNotMatch(page,/gth-master-intro[^"]*bg-/);
 assert.doesNotMatch(search,/scroll-mt-24[^"]*bg-\[/);
 assert.match(search,/gth-glass scroll-mt-24/);

 assert.match(page,/var\(--text\)/);
 assert.match(page,/var\(--gold\)/);
 assert.match(page,/GTHNetwork partners=\{partners\} discoveryOnly/);
});
