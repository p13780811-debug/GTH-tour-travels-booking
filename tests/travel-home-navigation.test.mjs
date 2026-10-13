import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL("../"+p, import.meta.url), "utf8");

test("dedicated Travel home connects every existing module", () => {
 const page = read("src/app/travel/page.tsx");
 for (const s of ["flights","hotels","tours","destinations","transfers","insurance","bus","train","activities","guides","blog","mega-aggregator"]) {
   assert.match(page,new RegExp('href: "/'+s+'"'));
 }
 assert.match(page, /canonical: "\/travel"/);
 assert.match(page, /grid-cols-1/);
});

test("main Travel links target the hub while Real Estate keeps its own page", () => {
 const home=read("src/components/home/GTHHomeV13.tsx");
 const navbar=read("src/components/Navbar.tsx");
 const mobile=read("src/components/MobileNav.tsx");
 assert.match(home,/href: "\/travel"/);
 assert.match(home,/href: "\/real-estate"/);
 assert.match(navbar,/name: "Travel",\s*href: "\/travel"/);
 assert.match(navbar,/name: "Real Estate",\s*href: "\/real-estate"/);
 assert.match(mobile,/href="\/flights"/);
 assert.match(mobile,/href="\/transfers"/);
 assert.match(read("src/app/mega-aggregator/page.tsx"),/href="\/travel"/);
});
