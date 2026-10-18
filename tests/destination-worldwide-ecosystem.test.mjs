import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const index=read("src/app/destinations/page.tsx");
const detail=read("src/app/destinations/[slug]/page.tsx");
const card=read("src/components/destination/DestinationCard.tsx");
const rail=read("src/components/destination/DestinationEcosystem.tsx");
const service=read("src/lib/destinations/ecosystem.ts");

test("index and city guide are global theme token consumers, not second CSS themes",()=>{
 for(const text of [index,detail,card,rail]){
  assert.doesNotMatch(text,/style=\{palette\}|const palette\s*=|#[0-9a-fA-F]{3,8}(?![\w])/);
  assert.match(text,/var\(--bg\)|var\(--card\)|var\(--text\)/);
 }
 assert.match(index,/gth-btn-gold/);
 assert.match(detail,/gth-btn-gold/);
 assert.doesNotMatch(index,/\.module\.css|\.css["']/);
 assert.doesNotMatch(detail,/\.module\.css|\.css["']/);
});

test("all destination, category, tour and guide cards have the same fixed geometry and scroll horizontally at every breakpoint",()=>{
 assert.match(card,/h-64 w-60 shrink-0 snap-start/);
 assert.match(rail,/h-64 w-60 shrink-0 snap-start/);
 assert.match(detail,/h-64 w-60 shrink-0 snap-start/g);
 assert.match(index,/<DestinationCard/);
 assert.match(detail,/<DestinationCard/);
 for(const text of [index,detail,rail]) assert.match(text,/snap-x snap-mandatory gap-4 overflow-x-auto/);
 assert.doesNotMatch(index,/md:grid md:grid-cols-2/);
 assert.match(card,/href=\{"\/destinations\/"\+destination\.slug\}/);
});

test("every city carries every actual GTH PRO pillar and working category links",()=>{
 for(const v of ["Travel","Real Estate","Tenders"])assert.ok(service.includes('pillar:"'+v+'"'));
 for(const entry of [
  "hotels","flights","tours","activities","transfers","cars","bus","train",
  "guides","blog","properties","post-property","tenders","tender-assistant","list-hotel"
 ])assert.ok(service.includes('key:"'+entry+'"'),"Missing "+entry);
 assert.match(rail,/destinationServices\(\{slug,name,country\}\)/);
 assert.match(detail,/<DestinationEcosystem slug=\{slug\} name=\{destination\.name\} country=\{destination\.country\}\/>/);
 assert.match(service,/scope:"global"/);
 assert.match(service,/scope:"destination"/);
 assert.match(service,/scope:country\?"country":"global"/);
 assert.doesNotMatch(service,/Math\.random|fake|placeholder|rate:\s*[0-9]+/i);
});

test("every ecosystem link points to an existing app route; country-filtered tenders use known codes only",()=>{
 const present=[
  "hotels","flights","tours","activities","transfers","cars","bus","train","guides","blog",
  "real-estate","real-estate/post-property","tender","tender/assistant","hotels/list-your-property",
 ];
 for(const route of present)assert.equal(existsSync(new URL("../src/app/"+route+"/page.tsx",import.meta.url)),true,route);
 assert.match(service,/const tender=new URLSearchParams\(\{scope:"world"\}\)/);
 assert.match(service,/if\(country\)tender\.set\("country",country\)/);
 assert.match(service,/new URLSearchParams\(\{city:place\.name\}\)/);
 assert.match(service,/href:"\/hotels\?destination="\+slug/);
 assert.match(service,/href:"\/tours\?city="\+slug/);
 assert.match(service,/href:"\/activities\?city="\+slug/);
});

test("live hotel and tour data, SEO and source honesty preserved",()=>{
 assert.match(index,/curatedDestinations\.map/);
 assert.match(index,/destinationImageForSlug\(item\.slug\)/);
 assert.match(index,/\.eq\("is_active", true\)/);
 assert.match(index,/pageLink\(search,\s*page\s*\+\s*1,\s*country,\s*region,\s*sort,\s*view\)/);
 assert.match(detail,/<HotelResults city=\{destination\.name\} destination=\{slug\} compactRail\/>/);
 assert.match(detail,/getTours\(\{ city: slug \}\)/);
 assert.match(detail,/String\(tour\.id\)/);
 assert.match(detail,/notFound\(\)/);
 assert.match(detail,/generateStaticParams/);
 assert.match(detail,/generateMetadata/); // destination-specific canonical, root controls indexing
 assert.doesNotMatch(detail,/guaranteed lowest|verified booking|Math\.random/);
});
