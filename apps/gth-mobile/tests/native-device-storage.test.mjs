import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
import React from "react";
import {create,act} from "react-test-renderer";
const require=createRequire(import.meta.url);
const ts=require("typescript");
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function load(path,imports={}){
 const source=readFileSync(new URL("../src/core/"+path+".ts",import.meta.url),"utf8");
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};
 new Function("module","exports","require",js)(mod,mod.exports,id=>{
  if(id in imports)return imports[id];
  throw Error("Unexpected module "+id);
 });
 return mod.exports;
}
const routing=load("routing");
const writes=load("device-writes");
const record={id:"osm:node-123",kind:"hotel",title:"Source hotel",subtitle:"Goa",source:"OpenStreetMap",webPath:"/app/hotels/osm:node-123"};
async function mount(name,storage){
 const hooks=load(name,{react:React,"./routing":routing,"./device-writes":writes,
  "@react-native-async-storage/async-storage":{default:storage}});
 let state;
 function Component(){state=name==="bookmarks"?hooks.useNativeBookmarks():hooks.useRecentSearches();return null;}
 let renderer;
 await act(async()=>{renderer=create(React.createElement(Component));});
 return {get state(){return state;},close:()=>act(async()=>renderer.unmount())};
}
test("local write failures are handled, and later save then clear remain ordered",async()=>{
 const queue=writes.createDeviceWriteQueue();
 let release;
 const blocked=new Promise(resolve=>{release=resolve;});
 const calls=[],outcomes=[];
 const a=queue(async()=>{calls.push("first");await blocked;throw Error("disk full");},ok=>outcomes.push(ok));
 const b=queue(async()=>{calls.push("save");},ok=>outcomes.push(ok));
 const c=queue(async()=>{calls.push("clear");},ok=>outcomes.push(ok));
 await Promise.resolve();
 assert.deepEqual(calls,["first"]);
 release();await Promise.all([a,b,c]);
 assert.deepEqual(calls,["first","save","clear"]);
 assert.deepEqual(outcomes,[false,true,true]);
});
for(const name of ["bookmarks","recent-searches"]){
 test(name+" reports unreadable storage and still finishes initialization",async()=>{
  const app=await mount(name,{getItem:async()=>{throw Error("denied");}});
  assert.equal(app.state.ready,true);assert.equal(app.state.storageError,true);
  assert.deepEqual(app.state.items,[]);await app.close();
 });
 test(name+" keeps usable session state, surfaces failure and recovers on next write",async()=>{
  let reject=true;
  const stored=[];
  const storage={getItem:async()=>null,setItem:async(key,value)=>{
   if(reject)throw Error("quota");stored.push(value);
  },removeItem:async()=>{if(reject)throw Error("denied");stored.push(null);}};
  const app=await mount(name,storage);
  await act(async()=>name==="bookmarks"?app.state.save(record):app.state.remember("Goa"));
  assert.equal(app.state.items.length,1);assert.equal(app.state.storageError,true);
  reject=false;
  await act(async()=>name==="bookmarks"?app.state.remove(record.webPath):app.state.clear());
  assert.equal(app.state.storageError,false);assert.deepEqual(app.state.items,[]);
  assert.equal(stored.length,1);await app.close();
 });
}
for(const name of ['bookmarks','recent-searches']){
 test(name+' never overwrites unread existing device data after initialization fails',async()=>{
  let writes=0;
  const app=await mount(name,{getItem:async()=>{throw Error('temporarily unreadable');},setItem:async()=>{writes++;},removeItem:async()=>{writes++;}});
  await act(async()=>name==='bookmarks'?app.state.save(record):app.state.remember('Mumbai'));
  assert.equal(app.state.items.length,1);assert.equal(app.state.storageError,true);assert.equal(writes,0);
  await app.close();
 });
}
test('appearance restores the selected theme, honors system mode and persists changes',async()=>{
 let persisted='dark',state;
 const hooks=load('appearance',{'react':React,'./device-writes':writes,
  '@react-native-async-storage/async-storage':{default:{getItem:async()=>persisted,setItem:async(key,value)=>{persisted=value;}}}});
 function Component(){state=hooks.useAppearance(false);return null;}
 let renderer;await act(async()=>{renderer=create(React.createElement(Component));});
 assert.equal(state.dark,true);assert.equal(state.mode,'dark');
 await act(async()=>state.select('system'));
 assert.equal(state.dark,false);assert.equal(persisted,'system');
 await act(async()=>state.select('light'));
 assert.equal(state.dark,false);assert.equal(persisted,'light');
 assert.equal(hooks.parseAppearance('unknown'),'system');
 await act(async()=>renderer.unmount());
});
