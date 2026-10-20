import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function compile(path,globals={}) {
  const source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};
  vm.runInNewContext(code,{module:mod,exports:mod.exports,URL,URLSearchParams,Intl,Set,Date,...globals},{timeout:2000});
  return mod.exports;
}
const lib=compile('src/lib/tender/discovery-workspace.ts');
const id='12345678-1234-4123-8123-123456789abc';
const second='abcdefab-1234-4123-8123-123456789abc';

test('device state rejects malformed, oversized, unsupported versions and non-UUID references',()=>{
  for(const value of ['{',JSON.stringify({version:2,saved:[id]}),'x'.repeat(16001)]) assert.equal(lib.parseTenderWorkspace(value).saved.length,0);
  const parsed=lib.parseTenderWorkspace(JSON.stringify({version:1,saved:[id,id.toUpperCase(),'../admin','https://bad.invalid'],comparison:[second,second],searches:[]}));
  assert.deepEqual(Array.from(parsed.saved),[id]);
  assert.deepEqual(Array.from(parsed.comparison),[second]);
  assert.deepEqual(Object.keys(parsed),['version','saved','comparison','searches']);
});
test('comparison cannot exceed three, but removing and adding another still works',()=>{
  const ids=[id,second,'abcdefab-1234-4123-8123-123456789abd'];
  const next='abcdefab-1234-4123-8123-123456789abe';
  assert.equal(lib.toggleTenderId(ids,next,3).limitReached,true);
  const removed=lib.toggleTenderId(ids,second,3);
  assert.equal(removed.ids.length,2);
  assert.equal(lib.toggleTenderId(removed.ids,next,3).ids.length,3);
  assert.equal(lib.toggleTenderId(ids,'not-a-uuid',3).ids.length,3);
});
test('saved navigation accepts only bounded, canonical internal tender filter URLs',()=>{
  assert.equal(lib.safeTenderSearchHref('/tender?scope=world&country=IN&sector=goods&lang=en'),'/tender?country=IN&lang=en&scope=world&sector=goods');
  for(const path of ['https://evil.invalid/tender?q=a','//evil.invalid/tender?q=a','/tender/assistant?q=a','/tender?redirect=https://evil.invalid','/tender?q=a&q=b','/tender?country=INDIA','/tender?sector=private','/tender?closingBefore=2026-02-30','/tender?lang=javascript','/tender?scope=world#bad','/tender?q=%00']) {
    assert.equal(lib.safeTenderSearchHref(path),null,path);
  }
});
test('hostile saved search state cannot create external links or unlimited entries',()=>{
  const parsed=lib.parseTenderWorkspace(JSON.stringify({version:1,saved:[],comparison:[],searches:[
    {label:'Unsafe',href:'//evil.invalid'},
    {label:' Goods\u0000 ',href:'/tender?sector=goods&country=IN'},
    {label:'Duplicate',href:'/tender?country=IN&sector=goods'},
  ]}));
  assert.equal(parsed.searches.length,1);
  assert.equal(parsed.searches[0].label,'Goods');
  assert.equal(parsed.searches[0].href,'/tender?country=IN&sector=goods');
});
test('CSV quotes fields and neutralizes spreadsheet formulas without inventing budgets',()=>{
  const csv=lib.buildTenderCsv([{title:' =HYPERLINK("bad")',buyer:'Buyer, "A"',country_code:'IN',sector:'goods',deadline_at:'2027-01-01T00:00:00Z',estimated_value:null,currency:null,source_name:'Official',source_reference:'@formula',source_url:'https://source.example/notice'}]);
  assert.match(csv,/"' =HYPERLINK\(""bad""\)"/);
  assert.match(csv,/"Buyer, ""A"""/);
  assert.match(csv,/"'@formula"/);
  assert.match(csv,/Estimated value \(not bid price\)/);
  assert.doesNotMatch(csv,/₹0|undefined|null/);
});
test('budget comparison preserves currency and reports missing or invalid values honestly',()=>{
  assert.equal(lib.formatTenderBudget(null,'INR'),'Not published');
  assert.equal(lib.formatTenderBudget(-1,'USD'),'Not published');
  assert.equal(lib.formatTenderBudget(1,'invalid'),'Not published');
  assert.match(lib.formatTenderBudget(100,'USD'),/100/);
  assert.notEqual(lib.formatTenderBudget(100,'INR'),lib.formatTenderBudget(100,'USD'));
});

function storeHarness({denyRead=false,denyWrite=false}={}) {
  const values=new Map();
  const listeners=new Map();
  const window={localStorage:{getItem:key=>{if(denyRead)throw Error('blocked');return values.get(key)??null;},setItem:(key,value)=>{if(denyWrite)throw Error('quota');values.set(key,value);}},
    addEventListener:(event,fn)=>listeners.set(event,fn),removeEventListener:(event)=>listeners.delete(event),dispatchEvent:event=>listeners.get(event.type)?.(event)};
  const hook=compile('src/components/tender/useTenderWorkspace.ts',{window,Event:class Event{constructor(type){this.type=type;}},require:name=>name==='react'?{
    useMemo:fn=>fn(),useCallback:fn=>fn,useSyncExternalStore:(_subscribe,getSnapshot)=>getSnapshot(),
  }:lib});
  return {hook,values};
}
test('storage denial still gives a truthful session-only update, without leaking bidder data',()=>{
  const {hook}=storeHarness({denyRead:true,denyWrite:true});
  assert.equal(hook.useTenderWorkspace().update(v=>({...v,saved:[id]})),false);
  assert.deepEqual(Array.from(hook.useTenderWorkspace().workspace.saved),[id]);
});
test('quota failure does not leave the UI reading the old persisted state',()=>{
  const {hook,values}=storeHarness({denyWrite:true});
  values.set(lib.TENDER_WORKSPACE_KEY,JSON.stringify({version:1,saved:[id],comparison:[],searches:[]}));
  assert.equal(hook.useTenderWorkspace().update(v=>({...v,saved:[second]})),false);
  assert.deepEqual(Array.from(hook.useTenderWorkspace().workspace.saved),[second]);
});
test('a cleared device list does not resurrect the in-memory previous selection',()=>{
  const {hook,values}=storeHarness();
  assert.equal(hook.useTenderWorkspace().update(v=>({...v,saved:[id]})),true);
  values.delete(lib.TENDER_WORKSPACE_KEY);
  assert.equal(hook.useTenderWorkspace().workspace.saved.length,0);
});
test('updates read the latest store to avoid losing changes from another mounted card',()=>{
  const {hook}=storeHarness();
  const a=hook.useTenderWorkspace();
  const b=hook.useTenderWorkspace();
  a.update(v=>({...v,saved:[...v.saved,id]}));
  b.update(v=>({...v,saved:[...v.saved,second]}));
  assert.deepEqual(Array.from(hook.useTenderWorkspace().workspace.saved),[id,second]);
});
