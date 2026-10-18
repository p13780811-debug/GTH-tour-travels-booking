import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const directories=["hotels","tours","activities","attractions","destinations","guides","blog","flights","transfers","cars","bus","train"];
const sections=["flights","hotels","tours","activities","attractions","destinations","guides","blog","transfers","cars","bus","train"];

test("Travel modules and detail routes share one consistent category navigation",()=>{
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
   assert.match(layout,/TravelSectionNav/);
   assert.match(layout,/<TravelSectionNav\s*\/>/);
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
 assert.doesNotMatch(source,/NEXT_PUBLIC_|\.css|window\.location|target="_blank"/);
 assert.match(hotels,/export const metadata/);
 assert.match(flights,/export const metadata/);
 assert.doesNotMatch(source,/\/real-estate|\/tender/);
});
