import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function load(path) { const exports={}; const source=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText; new Function('exports',source)(exports); return exports }
const repayment=load('src/lib/real-estate/repayment.ts');
const saved=load('src/lib/real-estate/saved-searches.ts');
test('repayment handles zero interest and known monthly amortization',()=>{assert.equal(repayment.estimateRepayment(120000,0,10).monthly,1000); assert.ok(Math.abs(repayment.estimateRepayment(100000,6,30).monthly-599.55)<.01)});
test('repayment rejects nonfinite, negative, fractional and excessive terms',()=>{for(const input of [[Infinity,6,30],[100000,-1,30],[100000,6,1.5],[100000,6,41],[0,6,30]]) assert.equal(repayment.estimateRepayment(...input),null)});
test('saved searches retain allowed filters and drop destinations and invalid intent',()=>{const params=new URLSearchParams(saved.normalizeSearchQuery('city=Mumbai&listing=bad&page=2&redirect=https://evil.example&bedrooms=200&sort=latest'));assert.equal(params.get('city'),'Mumbai');assert.equal(params.get('sort'),'latest');for(const key of ['page','redirect','listing','bedrooms']) assert.equal(params.has(key),false)});
test('saved search storage is bounded, deduplicated and tolerates malformed records',()=>{assert.deepEqual(saved.normalizeSearches(null),[]);const list=saved.normalizeSearches([{query:'city=Mumbai',label:'untrusted'},null,{query:3},{query:'city=Mumbai'},...Array.from({length:20},(_,index)=>({query:`city=C${index}`}))]);assert.equal(list.length,10);assert.equal(list[0].label,'Mumbai')});
