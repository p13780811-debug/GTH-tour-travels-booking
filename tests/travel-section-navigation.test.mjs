import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const directories=["hotels","tours","activities","attractions","destinations","guides","blog","flights","transfers","cars","bus","train"];
const sections=["flights","hotels","tours","activities","attractions","destinations","guides","blog","transfers","cars","bus","train"];

test("Travel categories remain consistent while layouts do not put tabs above the hero",()=>{
 const source=read("src/components/travel/TravelSectionNav.tsx");
 assert.match(source,/aria-label="Browse GTH PRO travel categories"/);
 assert.match(source,/usePathname/);
 assert.match(source,/pathname\.startsWith\(section\.href\+"\/"\)/);
 assert.match(source,/aria-current=\{isActive\?"page":undefined\}/);
 assert.match(source,/overflow-x-auto overscroll-x-contain/);
 for(const name of sections){
   assert.match(source,new RegExp('href:"/'+name+'"'));
 }
 for(const segment of directories){
   const layout=read("src/app/"+segment+"/layout.tsx");
   assert.doesNotMatch(layout,/<TravelSectionNav\s*\/>/);
   assert.match(layout,/\{children\}/);
 }
});

test("Navigation is a scoped secondary rail, not a duplicate global theme or overwritten Real Estate",()=>{
 const source=read("src/components/travel/TravelSectionNav.tsx");
 const hotels=read("src/app/hotels/layout.tsx");
 const flights=read("src/app/flights/layout.tsx");
 assert.match(source,/bg-\[var\(--card\)\]/);
 assert.match(source,/border-\[var\(--border\)\]/);
 assert.match(source,/focus-visible/);
 assert.doesNotMatch(source,/NEXT_PUBLIC_|globals\.css|window\.location|target="_blank"/);
 // The previously released scrollbar fix uses a scoped CSS module, not global style overrides.
 assert.match(source,/import scroll from "\.\/TravelScroll\.module\.css"/);
 assert.match(read("src/components/travel/TravelScroll.module.css"),/scrollbar-width:\s*none/);
 assert.match(hotels,/export const metadata/);
 assert.match(flights,/export const metadata/);
 assert.doesNotMatch(source,/\/real-estate|\/tender/);
});

test("each travel hero renderer owns one navigation slot after its hero",()=>{
 const renderers=[
  "src/components/tours/TourSearchHero.tsx","src/app/tours/[slug]/page.tsx",
  "src/app/flights/page.tsx","src/app/hotels/page.tsx","src/app/hotels/[slug]/page.tsx",
  "src/app/hotels/results/page.tsx","src/app/hotels/stay/[id]/page.tsx","src/app/hotels/list-your-property/page.tsx",
  "src/app/attractions/page.tsx","src/app/attractions/cities/page.tsx","src/app/attractions/progress/page.tsx",
  "src/app/attractions/[qid]/page.tsx","src/app/destinations/page.tsx","src/app/destinations/[slug]/page.tsx",
  "src/app/guides/page.tsx","src/components/travel/GuideDetail.tsx","src/app/blog/page.tsx",
  "src/app/blog/[slug]/page.tsx","src/app/cars/page.tsx","src/app/travel/page.tsx",
  "src/components/travel/TravelServicePage.tsx",
 ];
 for(const path of renderers){
  const source=read(path);
  assert.match(source,/data-travel-hero="true"/,path);
  const firstHeading=source.indexOf("<h1");
  const firstNav=source.indexOf("<TravelSectionNav");
  assert.ok(firstHeading>=0&&firstNav>firstHeading,path+" navigation follows the hero heading");
 }
 for(const path of ["src/app/activities/page.tsx","src/app/guides/[slug]/page.tsx","src/app/guides/[slug]/[topic]/page.tsx","src/app/destinations/digha/page.tsx"]){
  assert.doesNotMatch(read(path),/<TravelSectionNav/,path+" delegates to its shared page renderer");
 }
});
