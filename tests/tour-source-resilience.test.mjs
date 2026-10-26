import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function harness(){
 const timers=new Map();let next=0;
 const compiledModule={exports:{}};
 const source=readFileSync(new URL("../src/lib/tours/catalog-selection.ts",import.meta.url),"utf8");
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
  module:compiledModule,exports:compiledModule.exports,
  setTimeout:(callback,ms)=>{const id=++next;timers.set(id,{callback,ms});return id;},
  clearTimeout:id=>timers.delete(id),
 });
 return {select:compiledModule.exports.firstAvailableSupplierCatalog,timers};
}
const product={provider:"wegotrip",id:26568,title:"Original supplier walk"};
const never=()=>new Promise(()=>{});

test("London/Barcelona live cards render while the saved-inventory read never completes",async()=>{
 const h=harness();
 const live={status:"ready",items:[product]};
 const result=await h.select(Promise.resolve(live),never());
 assert.equal(result,live);
 assert.equal(result.items[0].id,26568);
});

test("fresh imported India cards render while the external supplier never responds",async()=>{
 const h=harness();
 const result=await h.select(never(),Promise.resolve([product]));
 assert.equal(result.status,"ready");
 assert.equal(result.items[0],product);
});

test("an empty or rejected faster source cannot hide products from the other source",async()=>{
 for(const live of [Promise.resolve({status:"empty",items:[]}),Promise.reject(Error("private supplier error"))]){
  const h=harness();
  const result=await h.select(live,Promise.resolve([product]));
  assert.equal(result.status,"ready");assert.equal(result.items[0],product);
 }
 const h=harness(),live={status:"ready",items:[product]};
 assert.equal(await h.select(Promise.resolve(live),Promise.reject(Error("private DB detail"))),live);
});

test("both stalled sources finish with an honest unavailable state within their budgets",async()=>{
 const h=harness();
 const pending=h.select(never(),never());
 assert.deepEqual([...h.timers.values()].map(timer=>timer.ms).sort((a,b)=>a-b),[5000,20000]);
 for(const timer of [...h.timers.values()])timer.callback();
 const result=await pending;
 assert.equal(result.status,"unavailable");assert.equal(result.items.length,0);
 assert.equal(h.timers.size,0);
});

test("empty catalogues stay empty and upstream errors do not leak into public results",async()=>{
 const h=harness();
 const empty=await h.select(Promise.resolve({status:"empty",items:[]}),Promise.resolve([]));
 assert.equal(empty.status,"empty");assert.equal(h.timers.size,0);
 const failed=await h.select(Promise.reject(Error("private service URL")),Promise.reject(Error("private DB detail")));
 assert.equal(failed.status,"unavailable");assert.equal(failed.items.length,0);
 assert.doesNotMatch(JSON.stringify(failed),/private/);assert.equal(h.timers.size,0);
});
