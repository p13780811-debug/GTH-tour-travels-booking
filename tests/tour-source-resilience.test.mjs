import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function harness(){
 const timers=new Map();let next=0;
 const supplierModule={exports:{}};
 const supplierSource=readFileSync(new URL("../src/lib/tours/supplier-products.ts",import.meta.url),"utf8");
 vm.runInNewContext(ts.transpileModule(supplierSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
  module:supplierModule,exports:supplierModule.exports,URL,
 });
 const mod={exports:{}};
 const source=readFileSync(new URL("../src/lib/tours/catalog-selection.ts",import.meta.url),"utf8");
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
  module:mod,exports:mod.exports,
  require:name=>{if(name==="./supplier-products")return supplierModule.exports;throw Error("Unexpected import "+name);},
  setTimeout:(callback,ms)=>{const id=++next;timers.set(id,{callback,ms});return id;},
  clearTimeout:id=>timers.delete(id),
 });
 return {select:mod.exports.firstAvailableSupplierCatalog,timers};
}
const mumbai={provider:"wegotrip",id:26568,title:"Original Mumbai supplier walk",city:{id:11,name:"Mumbai"}};
const agra={provider:"wegotrip",id:6196,title:"Original Agra supplier walk",city:{id:12,name:"Agra"}};
const never=()=>new Promise(()=>{});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function expire(h,ms){
 await flush();
 const match=[...h.timers.values()].find(t=>t.ms===ms);
 assert.ok(match,"expected timeout "+ms);
 match.callback();
 await flush();
}

test("live supplier selection survives an indefinitely stalled saved-inventory read",async()=>{
 const h=harness(),live={status:"ready",items:[mumbai]};
 const pending=h.select(Promise.resolve(live),never());
 await expire(h,5200);
 const result=await pending;
 assert.equal(result.status,"ready");
 assert.equal(result.items[0].id,26568);
});

test("fresh approved database items render when the supplier never responds",async()=>{
 const h=harness();
 const pending=h.select(never(),Promise.resolve([mumbai]));
 await expire(h,9000);
 const result=await pending;
 assert.equal(result.status,"ready");
 assert.equal(result.items[0].id,26568);
});

test("merge distinct city products instead of silently choosing the first nonempty source",async()=>{
 const h=harness();
 const result=await h.select(Promise.resolve({status:"ready",items:[mumbai]}),Promise.resolve([agra]));
 assert.equal(result.status,"ready");
 assert.deepEqual(Array.from(result.items,item=>item.id),[6196,26568]);
 assert.equal(h.timers.size,0);
});

test("same supplier product from API and database appears only once",async()=>{
 const h=harness();
 const result=await h.select(Promise.resolve({status:"ready",items:[mumbai]}),Promise.resolve([{...mumbai}]));
 assert.deepEqual(Array.from(result.items,item=>item.id),[26568]);
});

test("empty or rejected sources cannot hide valid inventory or leak backend errors",async()=>{
 for(const live of [Promise.resolve({status:"empty",items:[]}),Promise.reject(Error("private supplier error"))]){
  const h=harness();
  const result=await h.select(live,Promise.resolve([mumbai]));
  assert.equal(result.status,"ready");assert.equal(result.items[0].id,26568);
 }
 const h=harness(),live={status:"ready",items:[mumbai]};
 const result=await h.select(Promise.resolve(live),Promise.reject(Error("private DB detail")));
 assert.equal(result.status,"ready");
 assert.doesNotMatch(JSON.stringify(result),/private/);
});

test("both stalled sources fail closed with bounded timeouts",async()=>{
 const h=harness(),pending=h.select(never(),never());
 assert.deepEqual([...h.timers.values()].map(t=>t.ms).sort((a,b)=>a-b),[5000,17000]);
 for(const t of [...h.timers.values()])t.callback();
 const result=await pending;
 assert.equal(result.status,"unavailable");
 assert.equal(result.items.length,0);
 assert.equal(h.timers.size,0);
});

test("empty catalogs remain empty and rejected sources return an unavailable status",async()=>{
 const h=harness();
 assert.equal((await h.select(Promise.resolve({status:"empty",items:[]}),Promise.resolve([]))).status,"empty");
 const failed=await h.select(Promise.reject(Error("private API")),Promise.reject(Error("private DB")));
 assert.equal(failed.status,"unavailable");
 assert.doesNotMatch(JSON.stringify(failed),/private/);
});
