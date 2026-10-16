import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function moduleExports(path){
 const content=ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 vm.runInNewContext(content,{exports:module.exports,module,URLSearchParams,RegExp,Array,String},{timeout:2000});
 return module.exports;
}
const {mobileAppHref,isMobileSection}=moduleExports("src/lib/mobile/routes.ts");
test("All app cards stay inside app-only screens, no normal website card handoff",()=>{
 const pairs=[
  ["/flights","/app/flights"],["/hotels","/app/hotels"],
  ["/real-estate","/app/property"],["/tender","/app/tenders"],
  ["/destinations/goa","/app/destinations/goa"],
  ["/hotels/stay/osm:node-1234","/app/hotels/osm:node-1234"],
  ["/real-estate/my-property","/app/property/my-property"],
  ["/tender/12345678-1234-1234-1234-123456789abc","/app/tenders/12345678-1234-1234-1234-123456789abc"],
  ["/hotels?country=IN","/app/hotels?country=IN"]
 ];
 for(const [source,target] of pairs)assert.equal(mobileAppHref(source),target);
 assert.equal(mobileAppHref("/app/hotels"),"/app/hotels");
 assert.equal(mobileAppHref("https://example.com"),"https://example.com");
 assert.ok(isMobileSection("hotels"));
 assert.ok(isMobileSection("destinations"));
 assert.equal(isMobileSection("admin"),false);
});
test("Home rail enables app-only destinations across every content pillar",()=>{
 const home=read("src/app/app/page.tsx");
 const rail=read("src/components/mobile/MobileDiscoveryRail.tsx");
 for(const type of ["destination","hotel","property","tender"])
   assert.match(home,new RegExp('kind="'+type+'"[\\s\\S]*?appLinks'));
 assert.match(home,/href:"\/app\/hotels"/);
 assert.match(home,/href:"\/app\/tenders"/);
 assert.match(rail,/appLinks\?mobileAppHref\(item\.href\)/);
 assert.match(rail,/appLinks\?mobileAppHref\(href\)/);
});
test("PWA stays scoped to app and its internal shortcuts, website routes unaffected",()=>{
 const manifest=read("src/app/manifest.ts");
 assert.match(manifest,/scope: "\/app\/"/);
 for(const path of ["/app/flights","/app/hotels","/app/property","/app/tenders"])
   assert.ok(manifest.includes('url: "'+path+'"'));
 const desktop=read("src/components/Navbar.tsx");
 assert.match(desktop,/pathname\?\.startsWith\("\/app\/"\)/);
 const nav=read("src/components/MobileNav.tsx");
 assert.match(nav,/const target = isApp \? appHref : href/);
});
test("Native-feel sections have real marketplace queries, search and compact cards",()=>{
 const helper=read("src/lib/mobile/catalog.ts");
 for(const table of ["hotel_catalog","properties","tenders"])
  assert.ok(helper.includes('from("'+table+'")'));
 assert.match(helper,/\.eq\("source_verified",true\)/);
 assert.match(helper,/\.eq\("is_public",true\)/);
 assert.match(helper,/country_code\.eq\./);
 assert.match(helper,/const PAGE_SIZE=24/);
 assert.match(helper,/\.range\(offset,offset\+PAGE_SIZE-1\)/);
 assert.match(helper,/image:null/);
 const page=read("src/app/app/[section]/page.tsx");
 assert.match(page,/MobileDiscoveryRail appLinks/);
 assert.match(page,/MobileFlightSearch/);
 assert.match(page,/appQueryHref\(section,q/);
 assert.doesNotMatch(page,/Math\.random|faker|service_role/);
});
test("Inner detail routes fetch actual source records without fake booking, qualification or prices",()=>{
 const details=read("src/app/app/[section]/[id]/page.tsx");
 const helper=read("src/lib/mobile/catalog.ts");
 assert.match(details,/loadAppDetail\(section,id\)/);
 assert.match(details,/Official \/ source record/);
 assert.match(details,/No licensed hotel photo/);
 assert.match(helper,/safeTenderSource/);
 assert.match(helper,/\.eq\("status","published"\)/);
 assert.match(helper,/Unverified in source/);
 assert.match(helper,/have not been verified/);
});
test("Play Store listing not claimed from PWA browser install",()=>{
 const info=read("docs/gth-mobile-play-release.md");
 assert.match(info,/NOT an Android APK or a Play Store-signed AAB/);
 assert.match(info,/developer account/);
 assert.match(info,/assetlinks.json/);
});
