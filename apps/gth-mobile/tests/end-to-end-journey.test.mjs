import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const ts=require("typescript");
const root=new URL("../",import.meta.url);
const source=path=>readFileSync(new URL(path,root),"utf8");
function compile(path,dependencies={}){
 const output=ts.transpileModule(source(path),{
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}
 }).outputText;
 const holder={exports:{}};
 new Function("module","exports","require",output)(holder,holder.exports,id=>{
  if(!(id in dependencies))throw Error("Unexpected module "+id);
  return dependencies[id];
 });
 return holder.exports;
}
const routing=compile("src/core/routing.ts");
const catalog=compile("src/core/catalog.ts",{"./routing":routing});
const native=compile("src/core/unified-search.ts",{
 "./catalog":catalog,"./routing":routing,
});
const make=(kind,id,title,rest={})=>({id,kind,title,subtitle:"Source",source:"Public record",webPath:null,...rest});
test("single native global search discovers every existing API without a duplicate index",async()=>{
 const calls=[];
 const sourceItems={
  hotel:[make("hotel","osm:node-1","Goa Hotel")],
  property:[make("property","lodha","Lodha project")],
  tender:[make("tender","12345678-1234-1234-1234-123456789abc","Road works")],
  tour:[make("tour","23","Goa tour")],
 };
 const fake=compile("src/core/unified-search.ts",{
  "./routing":routing,
  "./catalog":{getSourceCards:async(kind,q,signal)=>{
   calls.push({kind,q,aborted:signal.aborted});
   return {items:sourceItems[kind],total:1};
  }},
 });
 const answer=await fake.searchNativeSources("all","Goa",new AbortController().signal);
 assert.equal(answer.items.length,4);
 assert.deepEqual(calls.map(x=>x.kind).sort(),["hotel","property","tender","tour"]);
 assert.ok(calls.every(x=>x.q==="Goa"&&!x.aborted));
 assert.equal(answer.total,4);
 assert.equal(answer.warnings.length,0);
});
test("public API failure does not erase other ecosystem results",async()=>{
 const fake=compile("src/core/unified-search.ts",{
  "./routing":routing,
  "./catalog":{getSourceCards:async kind=>{
   if(kind==="tender")throw Error("Private upstream details");
   return {items:[make(kind,"record-"+kind,"Source record")],total:1};
  }},
 });
 const result=await fake.searchNativeSources("all","Mumbai",new AbortController().signal);
 assert.equal(result.items.length,3);
 assert.equal(result.warnings.length,1);
 assert.match(result.warnings[0],/tender/);
 assert.ok(!result.warnings.some(w=>w.includes("Private")));
});
test("intent selection preserves requested category and routes generic terms across sources",()=>{
 assert.equal(native.searchChoice("Goa hotels"),"hotel");
 assert.equal(native.searchChoice("Goa"),"all");
 assert.equal(native.searchChoice("Goa hotels","property"),"property");
 assert.ok(native.SOURCE_KINDS.includes("hotel"));
 assert.equal(native.SOURCE_KINDS.length,4);
});
test("published API payloads map only to factual IDs, slugs and licensed images",()=>{
 const property=catalog.mapSourceRows("property",{total:1,items:[{
  id:"98765432-4321-4321-4321-123456789abc",slug:"existing-project",
  title:"Existing Project",city:"Mumbai",formatted_price:"Price on request",
  image:"/images/cities/mumbai.jpg",
 }]});
 assert.equal(property.items[0].webPath,"/app/property/existing-project");
 assert.equal(property.items[0].tag,"Price on request");
 assert.equal(property.items[0].image,routing.SITE_ORIGIN+"/images/cities/mumbai.jpg");
 const notVerified=catalog.mapSourceRows("property",{items:[{
  id:"98765432-4321-4321-4321-123456789abc",title:"Registry record",city:"Mumbai",
  image_url:"https://tracker.example/collect"
 }]});
 assert.equal(notVerified.items[0].webPath,null);
 assert.equal(notVerified.items[0].image,undefined);
 const lodging=catalog.endpointFor("hotel","Taj hotel in Goa");
 const u=new URL(lodging);
 assert.equal(u.pathname,"/api/hotels");
 assert.equal(u.searchParams.get("city"),"Goa");
 assert.equal(u.searchParams.get("name"),"Taj");
 const tours=catalog.mapSourceRows("tour",[{id:45,title:"Goa boat tour",city:"Goa",image_url:"/placeholder.jpg"}]);
 assert.equal(tours.items.length,1);
 assert.equal(tours.items[0].webPath,"/tours/45");
});
test("native interface uses original GTH CSS theme and meaningful Android navigation",()=>{
 const app=source("src/App.tsx");
 const theme=JSON.parse(source("src/theme/generated.json"));
 const config=JSON.parse(source("app.json"));
 assert.equal(config.expo.icon,"./assets/branding/logo.png");
 assert.equal(config.expo.android.adaptiveIcon.foregroundImage,config.expo.icon);
 assert.equal(readFileSync(new URL("assets/branding/logo.png",root)).subarray(0,8).toString("hex"),"89504e470d0a1a0a");
 const script=source("scripts/sync-theme.mjs");
 const extras=source("src/core/bookmarks.ts");
 assert.match(app,/BackHandler\.addEventListener/);
 assert.match(app,/setKind\(pillar\);setDetail\(null\)/);
 assert.match(app,/Explore hotels & stays/);
 assert.match(app,/Discover tours & activities/);
 assert.match(app,/Search flights on GTH PRO/);
 assert.match(app,/Tender search region/);
 assert.match(app,/Tender region /);
 assert.match(app,/searchNativeSources\(kind,term,ctrl\.signal,tenderRegion\)/);
 assert.match(app,/code:"WORLD",label:"Worldwide"/);
 assert.match(app,/kind:"travel",title:"Travel"/);
 assert.match(app,/kind==="travel"&&!term\?<View/);
 assert.match(app,/Travel experiences & stays/);
 assert.match(app,/kind==="all"\|\|kind==="travel"\)\&\&slices\.length/);
 assert.match(app,/\(kind==="all"\|\|kind==="travel"\)/);
 assert.match(app,/searchNativeSources/);
 assert.match(app,/warnings\.length/);
 assert.match(app,/kind==="all"&&!term/);
 assert.match(app,/theme\.onAccent/);
 assert.match(app,/styles\.quickTile/);
 assert.match(app,/accessibilityRole="button"/);
 assert.match(extras,/writeQueue/);
 assert.equal(theme.light.onAccent,"#111827");
 assert.equal(theme.dark.onAccent,"#060b12");
 assert.match(script,/get\(day,"text"\)/);
 assert.match(script,/get\(night,"bg"\)/);
 assert.equal((app.match(/label:"(?:Flights|Hotels|Real Estate|Public tenders|Bus journeys|Train journeys|Airport transfers|Car rentals|Tours & activities|Travel protection|Destinations|Travel eSIM|Saved properties|Property tools|Saved tenders|Tender services)"/g)||[]).length,16);
 assert.doesNotMatch(app,/WebView|SERVICE_ROLE_KEY|expo-router.*WebBrowser/);
});
