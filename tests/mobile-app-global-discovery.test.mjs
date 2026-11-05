import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const load=path=>{
 const result={exports:{}};
 const js=ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(js,{exports:result.exports,module:result},{timeout:2000});
 return result.exports;
};
const board=load("src/lib/mobile/research-board.ts");
const json=v=>JSON.parse(JSON.stringify(v));
const validItems=[
 {kind:"destination",href:"/app/destinations/mumbai",title:"Mumbai",subtitle:"City guide"},
 {kind:"hotel",href:"/app/hotels/osm:node-19345",title:"Listed guest house",subtitle:"Source directory"},
 {kind:"property",href:"/app/property/genuine-project",title:"Published project",subtitle:"Recorded property"},
 {kind:"tender",href:"/app/tenders/12345678-1234-1234-1234-123456789abc",title:"Published works tender",subtitle:"Official notice"},
];
test("source-specific device storage accepts only in-app detail routes, not arbitrary URLs",()=>{
 let saved=[];
 for(const item of validItems)saved=board.saveResearch(saved,item);
 assert.equal(saved.length,4);
 assert.equal(saved[0].kind,"tender");
 assert.deepEqual(json(board.parseResearch(JSON.stringify(saved))),json(saved));
 assert.equal(saved.some(e=>"price" in e||"email" in e),false);
 for(const href of ["//evil.example/app/property/item","https://bad.example/app/property/item","/api/admin","/app/services/transfer","/app/property/../admin","/app/tenders/not-an-id"]){
  assert.equal(board.saveResearch(saved,{...validItems[2],href}).length,saved.length,href);
 }
 assert.deepEqual(json(board.parseResearch("[{invalid json}")),[]);
 assert.deepEqual(json(board.parseResearch("a".repeat(16001))),[]);
});
test("shortcuts deduplicate, cap at 24, survive round-trip and can be removed",()=>{
 let saved=[];
 for(let i=0;i<30;i++){
  saved=board.saveResearch(saved,{kind:"property",href:"/app/property/project-"+i,title:"Project "+i,subtitle:"Public record"});
 }
 assert.equal(saved.length,24);
 const newest=saved[0];
 saved=board.saveResearch(saved,{kind:newest.kind,href:newest.href,title:"Updated display",subtitle:"Source changed"});
 assert.equal(saved.length,24);
 assert.equal(saved[0].title,"Updated display");
 const parsed=board.parseResearch(JSON.stringify([...saved,saved[0]]));
 assert.equal(parsed.length,24);
 const removed=board.removeResearch(parsed,newest.href);
 assert.equal(removed.length,23);
 assert.equal(removed.some(x=>x.href===newest.href),false);
});
test("unified search uses existing public catalogue and a hard abort deadline",()=>{
 const data=read("src/lib/mobile/global-discovery.ts");
 const catalog=read("src/lib/mobile/catalog.ts");
 assert.match(data,/import "server-only"/);
 assert.match(data,/listAppRecords/);
 assert.match(data,/normalizeAppQuery/);
 assert.match(data,/destinations","hotels","property","tenders/);
 assert.match(data,/controller.abort\(\),4500/);
 assert.match(data,/Promise.allSettled/);
 assert.match(catalog,/signal\?:AbortSignal/);
 assert.equal((catalog.match(/\.abortSignal\(signal \?\? new AbortController\(\)\.signal\)/g)||[]).length,3);
 assert.match(catalog,/\.eq\("source_verified",true\)/);
 assert.match(catalog,/\.eq\("is_public",true\)/);
});
test("app is an actual search-to-record-to-research journey, not cloned service cards",()=>{
 const explorer=read("src/app/app/explore/page.tsx");
 const home=read("src/components/mobile/MobileAppDashboard.tsx");
 const header=read("src/components/mobile/MobileAppHeader.tsx");
 const rail=read("src/components/mobile/MobileDiscoveryRail.tsx");
 const detail=read("src/app/app/[section]/[id]/page.tsx");
 const desk=read("src/components/mobile/MobileResearchDesk.tsx");
 for(const source of [header,desk])assert.match(source,/\/app\/explore/);
 assert.match(home,/action="\/app\/search"/);
 for(const source of [home,header,explorer])assert.match(source,/\/app\/board/);
 assert.match(explorer,/searchGlobalRecords\(q,pillar\)/);
 assert.match(explorer,/MobileDiscoveryRail/);
 assert.match(home,/method="get"/);
 assert.match(rail,/AppSaveRecord kind=\{kind\}/);
 assert.match(detail,/AppSaveRecord kind=\{record.kind\}/);
 assert.match(desk,/Saved only on this device/);
 assert.match(desk,/not a reservation/);
 assert.doesNotMatch(explorer,/Math\.random|faker|verified booking|SERVICE_ROLE/);
 assert.doesNotMatch(home,/localStorage|SUPABASE_SERVICE_ROLE_KEY/);
});
