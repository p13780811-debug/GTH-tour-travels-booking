import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {loadNative} from './helpers/load-native.mjs';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const routing=loadNative('core/routing.ts');
const catalog=loadNative('core/catalog.ts',{'./routing':routing});
const card=id=>({id,kind:'hotel',title:id,subtitle:'Source',source:'Public',webPath:null});

test('catalog preserves a complete source page and uses real header/body pagination contracts',async()=>{
 const original=globalThis.fetch;
 try{
  const calls=[];
  globalThis.fetch=async url=>{
   calls.push(new URL(url));
   return new Response(JSON.stringify(Array.from({length:40},(_,i)=>({id:'osm:node-'+(i+1),name:'Hotel '+i}))),{
    headers:{'content-type':'application/json','X-GTH-Total':'80','X-GTH-Page-Size':'40','X-GTH-Has-More':'true'}});
  };
  const hotels=await catalog.getSourceCards('hotel','Goa',new AbortController().signal,'IN',2);
  assert.equal(hotels.items.length,40);assert.equal(hotels.total,80);assert.equal(hotels.hasNext,true);
  assert.equal(calls[0].searchParams.get('page'),'2');
  globalThis.fetch=async()=>new Response(JSON.stringify({items:[{slug:'real-project',title:'Source project'}],hasNext:true}),{headers:{'content-type':'application/json'}});
  const property=await catalog.getSourceCards('property','Mumbai',new AbortController().signal);
  assert.equal(property.hasNext,true);
  globalThis.fetch=async()=>new Response(JSON.stringify({items:[{id:'notice',title:'Source tender'}],total:25,pageSize:12}),{headers:{'content-type':'application/json'}});
  assert.equal((await catalog.getSourceCards('tender','road',new AbortController().signal,'IN',2)).hasNext,true);
  assert.equal((await catalog.getSourceCards('tender','road',new AbortController().signal,'IN',3)).hasNext,false);
  for(const page of [0,-1,1.5,1001,NaN])assert.throws(()=>catalog.endpointFor('hotel','Goa','IN',page));
  assert.throws(()=>catalog.mapSourceRows('hotel',{error:'invalid'}));
 }finally{globalThis.fetch=original;}
});
test('next-page failures preserve records/cursors and retries request the failed page again',async()=>{
 let fail=true;const pages=[];
 const unified=loadNative('core/unified-search.ts',{'./routing':routing,'./catalog':{getSourceCards:async(kind,q,signal,region,page)=>{
  pages.push(page);if(fail)throw Error('private server message');
  return {items:[card('one'),card('two')],total:2,hasNext:false};
 }}});
 const initial=[{kind:'hotel',items:[card('one')],total:2,page:1,hasNext:true,error:null}];
 const failed=await unified.nextNativePage(initial,'Goa',new AbortController().signal);
 assert.equal(failed.items.length,1);assert.equal(failed.slices[0].page,1);assert.equal(failed.slices[0].hasNext,true);
 assert.ok(!failed.warnings.join().includes('private'));
 fail=false;
 const recovered=await unified.nextNativePage(failed.slices,'Goa',new AbortController().signal);
 assert.deepEqual(pages,[2,2]);assert.deepEqual(recovered.items.map(x=>x.id),['one','two']);
 assert.equal(recovered.slices[0].hasNext,false);
});
test('native discovery rejects stale responses and duplicate load-more taps',async()=>{
 let resolveOld;const requests=[];
 const combine=slices=>({slices,items:slices.flatMap(x=>x.items),total:slices.reduce((sum,x)=>sum+x.total,0),warnings:[]});
 let releaseMore;
 const hook=loadNative('core/use-discovery.ts',{react:React,'./unified-search':{
  combineSlices:combine,
  searchNativeSources:async(choice,term)=>{
   requests.push(term);
   if(term==='Old')return new Promise(resolve=>{resolveOld=resolve;});
   return combine([{kind:'hotel',items:[card(term)],total:2,page:1,hasNext:true,error:null}]);
  },
  nextNativePage:async slices=>new Promise(resolve=>{releaseMore=()=>resolve(combine([{...slices[0],items:[...slices[0].items,card('next')],hasNext:false,page:2}]));}),
 }});
 let state;function Component({term}){state=hook.useNativeDiscovery('hotel',term,'IN');return null;}
 let renderer;await act(async()=>{renderer=create(React.createElement(Component,{term:'Old'}));});
 await act(async()=>{renderer.update(React.createElement(Component,{term:'New'}));});
 await act(async()=>{resolveOld(combine([{kind:'hotel',items:[card('stale')],total:1}]));});
 assert.deepEqual(state.items.map(x=>x.id),['New']);
 let first,second;
 await act(async()=>{first=state.loadMore();second=state.loadMore();});
 await act(async()=>{releaseMore();await Promise.all([first,second]);});
 assert.deepEqual(state.items.map(x=>x.id),['New','next']);
 assert.equal(state.morePending,false);assert.equal(state.hasMore,false);
 assert.deepEqual(requests,['Old','New']);await act(async()=>renderer.unmount());
});
