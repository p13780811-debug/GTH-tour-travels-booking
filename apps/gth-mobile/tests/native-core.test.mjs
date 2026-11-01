import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
const require=createRequire(import.meta.url);
const ts=require("typescript");
const root=new URL("../",import.meta.url);
function source(path){return readFileSync(new URL(path,root),"utf8");}
function load(path,imports={}){
 const js=ts.transpileModule(source(path),{
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},
  reportDiagnostics:true,
 }).outputText;
 const exports={};
 const loadedModule={exports};
 const fn=new Function("module","exports","require",js);
 fn(loadedModule,exports,(id)=>{
  if(!(id in imports))throw Error("Unexpected import: "+id);
  return imports[id];
 });
 return loadedModule.exports;
}
const routing=load("src/core/routing.ts");
const catalog=load("src/core/catalog.ts",{"./routing":routing});
test("GTH PRO native app opens only original first-party service URLs",()=>{
 assert.equal(routing.SITE_ORIGIN,"https://www.gthproglobal.com");
 assert.equal(routing.firstPartyUrl("/app/hotels/osm:node-123"),"https://www.gthproglobal.com/app/hotels/osm:node-123");
 for(const path of ["//evil.example","https://evil.example","/\\\\evil.com","/bad\npath"]){
  assert.equal(routing.firstPartyUrl(path),null,path);
 }
 assert.equal(routing.approvedRecordPath("hotel","osm:node-123"),"/app/hotels/osm:node-123");
 assert.equal(routing.approvedRecordPath("property","valid-project"),"/app/property/valid-project");
 assert.equal(routing.approvedRecordPath("tender","12345678-1234-1234-1234-123456789abc"),"/app/tenders/12345678-1234-1234-1234-123456789abc");
 assert.equal(routing.approvedRecordPath("hotel","javascript:bad"),null);
});
test("one native intent router reuses site public search endpoints",()=>{
 assert.equal(routing.detectPillar("Goa hotels"),"hotel");
 assert.equal(routing.detectPillar("Mumbai property"),"property");
 assert.equal(routing.detectPillar("construction tender"),"tender");
 assert.equal(routing.detectPillar("Mumbai sightseeing tours"),"tour");
 const hotel=new URL(catalog.endpointFor("hotel","Goa hotels"));
 assert.equal(hotel.pathname,"/api/hotels");
 assert.equal(hotel.searchParams.get("city"),"Goa");
 const property=new URL(catalog.endpointFor("property","Lodha property"));
 assert.equal(property.pathname,"/api/real-estate/search");
 assert.equal(property.searchParams.get("query"),"Lodha");
 const tender=new URL(catalog.endpointFor("tender","road construction tender"));
 assert.equal(tender.pathname,"/api/tender");
 assert.equal(tender.searchParams.get("q"),"road construction");
 assert.equal(tender.searchParams.get("scope"),"local");
});
test("native service cards are source-backed and never invent suppliers or pricing",()=>{
 const hotels=catalog.mapSourceRows("hotel",[{id:"osm:node-123",name:"Test Hotel",city:"Goa",booking_ready:false,source:"OpenStreetMap"}]);
 assert.equal(hotels.items.length,1);
 assert.equal(hotels.items[0].webPath,"/app/hotels/osm:node-123");
 assert.equal(hotels.items[0].tag,"Accommodation record");
 assert.equal(hotels.items[0].image,undefined);
 const tender=catalog.mapSourceRows("tender",{items:[{id:"12345678-1234-1234-1234-123456789abc",title:"Sample notice",deadline_at:"2026-12-01",source_name:"Government source"}],total:1});
 assert.equal(tender.items[0].webPath,"/app/tenders/12345678-1234-1234-1234-123456789abc");
 const rejected=catalog.mapSourceRows("hotel",[{id:"unsafe",name:"",city:"Goa"}]);
 assert.equal(rejected.items.length,0);
});
test("native app remains separate from website and handles native navigation",()=>{
 const app=source("src/App.tsx");
 const bookmarks=source("src/core/bookmarks.ts");
 const pkg=JSON.parse(source("package.json"));
 assert.match(app,/SafeAreaProvider/);
 assert.match(app,/useColorScheme/);
 assert.match(app,/function BottomBar/);
 assert.match(app,/tab==="discover"/);
 assert.match(app,/tab==="saved"/);
 assert.match(app,/type Tab="home"\|"discover"\|"saved"\|"services"/);
 assert.match(app,/searchNativeSources/);
 assert.match(app,/Linking\.openURL\(target\)/);
 assert.match(bookmarks,/AsyncStorage/);
 assert.match(bookmarks,/BOOKMARK_LIMIT=30/);
 assert.doesNotMatch(app,/WebView|SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_.*SECRET/);
 assert.ok(pkg.dependencies["react-native"]);
 assert.ok(pkg.dependencies.expo);
});
