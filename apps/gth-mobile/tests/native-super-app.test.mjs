import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {readFileSync} from 'node:fs';
import {loadNative} from './helpers/load-native.mjs';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const routing=loadNative('core/routing.ts');
const catalog=loadNative('core/catalog.ts',{'./routing':routing});
const research=loadNative('core/research.ts');
const services=loadNative('core/services.ts',{'./routing':routing});
const writes=loadNative('core/device-writes.ts');
const colors=JSON.parse(readFileSync(new URL('../src/theme/generated.json',import.meta.url),'utf8'));
const uuid='a1234567-1234-4123-8123-123456789abc';
const credit={author:'Source Photographer',license:'CC BY-SA 4.0',commons_page:'https://commons.wikimedia.org/wiki/File:Source_hotel.jpg',license_url:'https://creativecommons.org/licenses/by-sa/4.0/'};
const source={id:uuid,name:'Reviewed source hotel',city:'Goa',country:'IN',address:'Published address',category:'hotel',booking_ready:true,
 image:'https://upload.wikimedia.org/wikipedia/commons/a/ab/Source_hotel.jpg',image_attribution:credit};

test('every ecosystem has distinct existing services; search and booking intents retain the correct planner',()=>{
 assert.equal(new Set(services.SERVICES.map(service=>service.label)).size,services.SERVICES.length);
 for(const service of services.SERVICES)assert.ok(routing.firstPartyUrl(service.path),service.label);
 assert.equal(services.SERVICES.length,28);
 assert.ok(services.filterServices('cruise','travel').some(service=>service.path==='/cruises'));
 assert.ok(services.filterServices('registry','property').some(service=>service.path==='/real-estate/registry'));
 assert.ok(services.filterServices('assistant','tender').some(service=>service.path==='/tender/assistant'));
 assert.equal(services.filterServices('cruise','tender').length,0);
 for(const [query,path] of [['Mumbai flights','/flights'],['Goa cruises','/cruises'],['Mumbai to Howrah train','/train'],['ferry tickets','/ferry'],['car rental','/cars']])
  assert.equal(services.bookingServiceForQuery(query)?.path,path);
 assert.equal(services.bookingServiceForQuery('Mumbai property'),undefined);
});
test('reviewed hotel IDs, exact booking gates and source facts survive mapping without inventing availability',()=>{
 const card=catalog.mapSourceRows('hotel',[source]).items[0];
 assert.equal(card.webPath,'/hotels/stay/'+uuid);
 assert.equal(card.bookingPath,'/hotels/partner/'+uuid);
 assert.equal(card.photoCredit.author,credit.author);
 assert.ok(card.facts.some(fact=>fact.label==='Address'&&fact.value==='Published address'));
 const unmapped=catalog.mapSourceRows('hotel',[{...source,booking_ready:false}]).items[0];
 assert.equal(unmapped.bookingPath,undefined);
 const invalid=catalog.mapSourceRows('hotel',[{...source,id:'not-a-real-id'}]).items[0];
 assert.equal(invalid.webPath,null);assert.equal(invalid.bookingPath,undefined);
 assert.equal(catalog.mapSourceRows('hotel',[{...source,image_attribution:null}]).items[0].image,undefined);
 for(const link of ['https://evil.example/license','https://commons.wikimedia.org.evil.example/wiki/File:a','https://user:secret@creativecommons.org/licenses/by/4.0/','https://creativecommons.org:8443/licenses/by/4.0/'])
  assert.equal(catalog.approvedCreditUrl(link),null);
});
test('property covers use only published photo IDs and never fake media records',()=>{
 const row={slug:'published-project',title:'Published project',publishedMedia:[{id:uuid,media_type:'photo',is_primary:true}]};
 assert.equal(catalog.mapSourceRows('property',{items:[row]}).items[0].image,routing.SITE_ORIGIN+'/api/property-media/'+uuid);
 assert.equal(catalog.mapSourceRows('property',{items:[{...row,publishedMedia:[{id:'../private',media_type:'photo'}]}]}).items[0].image,undefined);
});
test('source paging respects the actual hotel/tender page caps and unknown property totals',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async()=>new Response(JSON.stringify([source]),{headers:{'content-type':'application/json','X-GTH-Has-More':'true','X-GTH-Total':'10000'}});
  const final=await catalog.getSourceCards('hotel','Goa',new AbortController().signal,'IN',100);
  assert.equal(final.hasNext,false);assert.equal(final.totalIsExact,true);
  assert.throws(()=>catalog.endpointFor('hotel','Goa','IN',101));
  assert.throws(()=>catalog.endpointFor('tender','road','IN',101));
  globalThis.fetch=async()=>new Response(JSON.stringify({items:[{slug:'one-project',title:'One project'}],hasNext:true}),{headers:{'content-type':'application/json'}});
  const property=await catalog.getSourceCards('property','Mumbai',new AbortController().signal);
  assert.equal(property.totalIsExact,false);assert.equal(property.hasNext,true);
 }finally{globalThis.fetch=original;}
});
test('source retry keeps completed pages and retries only the failed source and cursor',async()=>{
 const calls=[];
 const native=loadNative('core/unified-search.ts',{'./routing':routing,'./catalog':{getSourceCards:async(kind,q,signal,region,page)=>{
  calls.push({kind,page});return {items:[{id:kind+'-recovered',kind}],total:3,hasNext:false,totalIsExact:true};
 }}});
 const successful={kind:'hotel',items:[{id:'one',kind:'hotel'},{id:'two',kind:'hotel'}],total:2,error:null,page:2,hasNext:false};
 const failedFirst={kind:'tender',items:[],total:0,error:'unavailable',page:0,hasNext:false};
 const failedNext={kind:'tour',items:[{id:'old',kind:'tour'}],total:3,error:'unavailable',page:2,hasNext:true};
 const recovered=await native.retryNativeSources([successful,failedFirst,failedNext],'Goa',new AbortController().signal);
 assert.deepEqual(calls,[{kind:'tender',page:1},{kind:'tour',page:3}]);
 assert.equal(recovered.slices[0],successful);
 assert.equal(recovered.items.length,5);assert.equal(recovered.warnings.length,0);
});
test('research notes and checklists persist with source media; refresh and public sharing do not erase or include private notes',async()=>{
 let raw=null,state;
 const storage={getItem:async()=>raw,setItem:async(key,value)=>{raw=value;}};
 const hooks=loadNative('core/bookmarks.ts',{react:React,'./routing':routing,'./catalog':catalog,'./research':research,'./device-writes':writes,
  '@react-native-async-storage/async-storage':{__esModule:true,default:storage}});
 function Component(){state=hooks.useNativeBookmarks();return null;}
 let renderer;await act(async()=>{renderer=create(React.createElement(Component));});
 const card=catalog.mapSourceRows('hotel',[source]).items[0];
 await act(async()=>state.save(card));
 await act(async()=>{state.updateNote(card.webPath,'Ask about wheelchair access');state.toggleCheck(card.webPath,'terms');});
 await act(async()=>state.save({...card,title:'Updated original title'}));
 assert.equal(state.items[0].research.note,'Ask about wheelchair access');
 assert.deepEqual(state.items[0].research.checked,['terms']);
 await act(async()=>state.refreshSources([{...card,title:'Automatically refreshed source',loadedAt:'2026-11-09T01:00:00.000Z'}]));
 assert.equal(state.items[0].title,'Automatically refreshed source');
 assert.equal(state.items[0].research.note,'Ask about wheelchair access');
 assert.deepEqual(state.items[0].research.checked,['terms']);
 const restored=hooks.parseBookmarks(raw)[0];
 assert.equal(restored.image,card.image);assert.equal(restored.photoCredit.page,credit.commons_page);
 assert.equal(restored.bookingPath,card.bookingPath);assert.equal(restored.research.note,'Ask about wheelchair access');
 assert.deepEqual(research.parseResearch({note:'x'.repeat(1000),checked:['terms','terms','private','dates']},'hotel'),{note:'x'.repeat(600),checked:['terms','dates']});
 const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
 const shareFunction=app.slice(app.indexOf('async function shareRecord'),app.indexOf('function enterSearch'));
 assert.doesNotMatch(shareFunction,/research|\.note|checked/);
 assert.match(app,/onPress=\{\(\)=>clearDeviceData\("history"\)\}/);
 await act(async()=>renderer.unmount());
});
test('day and night action text meets WCAG AA while retaining the existing gold button fill',()=>{
 const rgb=hex=>hex.replace('#','').match(/../g).map(value=>parseInt(value,16)/255);
 const luminance=hex=>rgb(hex).map(value=>value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
 const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
 for(const theme of Object.values(colors)){
  assert.ok(contrast(theme.accentText,theme.bg)>=4.5);
  assert.ok(contrast(theme.accentText,theme.surfaceSoft)>=4.5);
  assert.ok(contrast(theme.onAccent,theme.accent)>=4.5);
 }
});
test('an unavailable source image has an accessible fallback instead of a blank photo',async()=>{
 const photos=loadNative('components/SourcePhoto.tsx',{react:React,'react-native':{Image:'Image',Pressable:'Pressable',Text:'Text',View:'View'},
  'lucide-react-native':{ImageOff:'ImageOff'},'../theme/generated.json':colors,'../core/catalog':catalog});
 let renderer;await act(async()=>{renderer=create(React.createElement(photos.SourcePhoto,{item:{title:'Source hotel',image:'https://www.gthproglobal.com/images/source.jpg'},theme:colors.light,large:true}));});
 await act(async()=>renderer.root.findByType('Image').props.onError());
 assert.equal(renderer.root.findAllByType('Image').length,0);
 assert.match(JSON.stringify(renderer.toJSON()),/Source photo unavailable/);
 await act(async()=>renderer.unmount());
});
test('previous PWA saved links migrate to canonical live records without losing private research',()=>{
 const hooks=loadNative('core/bookmarks.ts',{react:React,'./routing':routing,'./catalog':catalog,'./research':research,'./device-writes':writes,
  '@react-native-async-storage/async-storage':{__esModule:true,default:{}}});
 const old={id:'osm:node-77',kind:'hotel',title:'Saved hotel',subtitle:'Goa',source:'Public source',webPath:'/app/hotels/osm:node-77',research:{note:'My private question',checked:['dates']}};
 const restored=hooks.parseBookmarks(JSON.stringify([old]))[0];
 assert.equal(restored.webPath,'/hotels/stay/osm:node-77');
 assert.equal(restored.research.note,'My private question');assert.deepEqual(restored.research.checked,['dates']);
 assert.deepEqual(hooks.parseBookmarks(JSON.stringify([{...old,webPath:'/app/hotels/osm:node-88'}])),[]);
});
