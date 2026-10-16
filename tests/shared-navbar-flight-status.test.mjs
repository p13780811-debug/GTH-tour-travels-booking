import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (file) => readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("one central navbar stays route-shared while real estate retains its approved header",()=>{
 const navbar=read("src/components/Navbar.tsx");
 const root=read("src/app/layout.tsx");
 assert.match(root, /<Navbar \/>/);
 assert.match(navbar, /pathname === "\/" \|\| pathname === "\/app"\) return null/);
 assert.match(navbar, /pathname === "\/real-estate" \|\| pathname\?\.startsWith\("\/real-estate\/"\) \? <EstateHeader \/>/);
 assert.match(navbar, /function EcosystemNavbar\(\)/);
 for(const route of ["/mega-aggregator","/travel","/real-estate","/tender","/destinations","/guides","/blog"]) assert.ok(navbar.includes('href: "'+route+'"'));
});

test("responsive central navbar fits search and tabs without wrapped buttons or clipped CTA",()=>{
 const s=read("src/components/Navbar.tsx");
 const search=read("src/components/SearchBox.tsx");
 assert.match(s, /flex w-full max-w-\[1600px\] min-w-0 items-center/);
 assert.match(s, /hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex/);
 assert.match(s, /whitespace-nowrap/);
 assert.match(s, /gth-nav-text whitespace-nowrap text-xs leading-none/);
 assert.match(s, /hidden xl:block/);
 assert.match(s, /2xl:flex/);
 assert.match(s, /Open ecosystem search/);
 assert.match(s, /aria-expanded=\{searchOpen\}/);
 assert.match(s, /onClick=\{\(\) => setSearchOpen\(\(open\) => !open\)\}/);
 assert.match(s, /searchOpen && \(/);
 assert.match(s, /<SearchBox \/>/);
 assert.match(s, /<ThemeToggle \/>/);
 assert.match(s, /Premium Access/);
 const desktop = s.slice(s.indexOf("{/* DESKTOP NAV */}"), s.indexOf("{/* RIGHT */}"));
 assert.doesNotMatch(desktop, /scale-105/);
 assert.match(search, /min-w-0/);
 assert.match(search, /text-\[var\(--text\)\]/);
 assert.match(search, /aria-label="Search GTH PRO cities and services"/);
 assert.match(search, /aria-label="Submit ecosystem search"/);
});

test("Flights delegates loading and error presentation solely to the original TPWL supplier",()=>{
 const s=read("src/components/flights/AviasalesWhiteLabel.tsx");
 const page=read("src/app/flights/page.tsx");
 for(const fragment of ['id="tpwl-search"','id="tpwl-tickets"','tpwidg.com/wl_web/main.js?wl_id=23459','TPWL_CONFIGURATION','lowerPriorityForSupplierBundle']) {
   assert.ok(s.includes(fragment),fragment);
 }
 assert.doesNotMatch(s, /useState|setStatus|setInterval|Loading flight search|Flight search is unavailable|Reload flight search|RefreshCw|role="alert"/);
 assert.match(s, /href="\/flights\/out\/aviasales"/);
 assert.match(page, /<AviasalesWhiteLabel isResultsView=\{isResultsView\} \/>/);
});
