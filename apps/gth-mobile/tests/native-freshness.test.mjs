import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {loadNative} from './helpers/load-native.mjs';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const routing=loadNative('core/routing.ts');
const catalog=loadNative('core/catalog.ts',{'./routing':routing});
const card=(id,title=id)=>({id,title,kind:'hotel',subtitle:'Published location',source:'Public source',webPath:null});

test('public source requests bypass response cache and record retrieval time separately from source facts',async()=>{
 const original=globalThis.fetch;
 try{
  let options;
  globalThis.fetch=async(url,init)=>{
   options=init;
   return new Response(JSON.stringify([{id:'osm:node-1',name:'Published hotel'}]),{headers:{'content-type':'application/json'}});
  };
  const data=await catalog.getSourceCards('hotel','Goa',new AbortController().signal);
  assert.equal(options.cache,'no-store');
  assert.ok(Number.isFinite(Date.parse(data.items[0].loadedAt)));
  assert.equal(catalog.recordExtras(data.items[0]).loadedAt,data.items[0].loadedAt);
 }finally{globalThis.fetch=original;}
});
test('foreground refresh replaces the complete loaded window, removes old records and preserves its cursor',async()=>{
 const pages=[];
 const unified=loadNative('core/unified-search.ts',{'./routing':routing,'./catalog':{getSourceCards:async(kind,q,signal,region,page)=>{
  pages.push(page);return {items:[card(page===1?'new':'retained','Updated source '+page)],total:2,totalIsExact:true,hasNext:page===1};
 }}});
 const previous=[{kind:'hotel',items:[card('removed'),card('retained')],page:2,total:2,error:null,hasNext:false}];
 const refreshed=await unified.refreshNativeSources(previous,'Goa',new AbortController().signal);
 assert.deepEqual(pages,[1,2]);
 assert.deepEqual(refreshed.items.map(item=>item.id),['new','retained']);
 assert.equal(refreshed.slices[0].page,2);assert.equal(refreshed.slices[0].hasNext,false);
 assert.ok(refreshed.items.every(item=>item.title.startsWith('Updated source')));
});
test('a failed refresh keeps a visibly stale snapshot and never mixes half-refreshed pages',async()=>{
 const old=[card('old-one'),card('old-two')];
 let fail=true;
 const unified=loadNative('core/unified-search.ts',{'./routing':routing,'./catalog':{getSourceCards:async(kind,q,signal,region,page)=>{
  if(page===2&&fail)throw Error('network offline');
  return {items:[card('new-'+page)],total:2,totalIsExact:true,hasNext:page===1};
 }}});
 const previous=[{kind:'hotel',items:old,page:2,total:2,error:null,hasNext:true}];
 const stale=await unified.refreshNativeSources(previous,'Goa',new AbortController().signal);
 assert.deepEqual(stale.items,old);assert.equal(stale.slices[0].stale,true);assert.equal(stale.slices[0].page,2);
 assert.ok(stale.warnings.length>0);
 fail=false;
 const recovered=await unified.refreshNativeSources(stale.slices,'Goa',new AbortController().signal);
 assert.equal(recovered.slices[0].stale,false);assert.equal(recovered.warnings.length,0);
 assert.deepEqual(recovered.items.map(item=>item.id),['new-1','new-2']);
});
test('native foreground transitions refresh with the latest callback and remove their listener on unmount',async()=>{
 let change,removed=0,first=0,latest=0;
 const lifecycle=loadNative('core/foreground-refresh.ts',{react:React,'react-native':{AppState:{currentState:'active',addEventListener:(event,callback)=>{
  assert.equal(event,'change');change=callback;return {remove:()=>removed++};
 }}}});
 function Component({callback}){lifecycle.useForegroundRefresh(callback);return null;}
 let renderer;await act(async()=>{renderer=create(React.createElement(Component,{callback:()=>first++}));});
 await act(async()=>change('active'));assert.equal(first,0,'Initial activation must not duplicate the initial request');
 await act(async()=>change('background'));
 await act(async()=>renderer.update(React.createElement(Component,{callback:()=>latest++})));
 await act(async()=>change('active'));assert.equal(first,0);assert.equal(latest,1);
 await act(async()=>{change('inactive');change('active');});assert.equal(latest,2);
 await act(async()=>renderer.unmount());assert.equal(removed,1);
});
test('fresh first-party photo versions bypass stale image URLs without changing supplier or signed URLs',()=>{
 const stamp='2026-11-09T01:00:00.000Z';
 const photo='https://www.gthproglobal.com/api/property-media/a1234567-1234-4123-8123-123456789abc';
 assert.equal(new URL(catalog.sourcePhotoRequestUri(photo,stamp)).searchParams.get('gth_source_revision'),stamp);
 for(const original of ['https://upload.wikimedia.org/wikipedia/commons/a/ab/Photo.jpg',photo+'?signature=example','https://partner.example/photo.jpg'])
  assert.equal(catalog.sourcePhotoRequestUri(original,stamp),original);
 assert.equal(catalog.sourcePhotoRequestUri(photo,'invalid'),photo);
});
test('foreground refresh queued during pagination keeps the newly loaded window instead of resetting it',async()=>{
 const pages=[];let releasePage,fresh=false;
 const unified=loadNative('core/unified-search.ts',{'./routing':routing,'./catalog':{getSourceCards:async(kind,q,signal,region,page=1)=>{
  pages.push(page);
  if(page===2&&!fresh)return new Promise(resolve=>{releasePage=()=>resolve({items:[card('second')],total:2,hasNext:false});});
  return {items:[card(page===1?'first':'second',fresh?'Current source '+page:'Original source')],total:2,hasNext:page===1};
 }}});
 const hook=loadNative('core/use-discovery.ts',{react:React,'./unified-search':unified});
 let state;function Component(){state=hook.useNativeDiscovery('hotel','Goa','IN');return null;}
 let renderer;await act(async()=>{renderer=create(React.createElement(Component));});
 let pending;await act(async()=>{pending=state.loadMore();});
 await act(async()=>state.refresh());
 fresh=true;await act(async()=>{releasePage();await pending;});
 assert.deepEqual(pages,[1,2,1,2]);
 assert.equal(state.slices[0].page,2);assert.equal(state.items.length,2);
 assert.ok(state.items.every(item=>item.title.startsWith('Current source')));
 assert.equal(state.refreshing,false);await act(async()=>renderer.unmount());
});
