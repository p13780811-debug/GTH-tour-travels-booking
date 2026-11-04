import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
const require=createRequire(import.meta.url);
const ts=require("typescript");
function load(path,imports={}){
 const source=readFileSync(new URL("../"+path,import.meta.url),"utf8");
 const output=ts.transpileModule(source,{
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}
 }).outputText;
 const mod={exports:{}};
 new Function("module","exports","require",output)(mod,mod.exports,id=>{
  if(id in imports)return imports[id];
  throw Error("Unexpected module: "+id);
 });
 return mod.exports;
}
const route=load("src/core/routing.ts");
const recent=load("src/core/recent-searches.ts",{
 "./routing":route,
 "./device-writes":load("src/core/device-writes.ts"),
 "@react-native-async-storage/async-storage":{default:{}},
 "react":{useCallback:()=>{},useEffect:()=>{},useRef:()=>{},useState:()=>{}},
});
test("recent history remains capped, deduplicated, trimmed and on-device",()=>{
 let values=[];
 for(let i=0;i<12;i++)values=recent.rememberSearch(values,"Goa "+i);
 assert.equal(values.length,recent.MAX_RECENT_SEARCHES);
 assert.equal(values[0],"Goa 11");
 values=recent.rememberSearch(values,"goa 10");
 assert.equal(values.length,8);
 assert.equal(values[0],"goa 10");
 values=recent.rememberSearch(values," X ");
 assert.equal(values.length,8);
 assert.deepEqual(recent.parseRecentSearches(JSON.stringify(values)),values);
});
test("corrupt, oversized, invalid or duplicate stored searches never reach UI",()=>{
 assert.deepEqual(recent.parseRecentSearches("{invalid"),[]);
 assert.deepEqual(recent.parseRecentSearches("x".repeat(3000)),[]);
 assert.deepEqual(recent.parseRecentSearches(JSON.stringify(["Goa","GOA",null,123, "X", "Mumbai"])),["Goa","Mumbai"]);
 assert.equal(recent.rememberSearch(["Mumbai"],"\u0000  Goa hotel  ")[0],"Goa hotel");
});
test("native entry points remember actual searches and expose clear-history control",()=>{
 const app=readFileSync(new URL("../src/App.tsx",import.meta.url),"utf8");
 assert.match(app,/useRecentSearches/);
 assert.match(app,/recent\.remember\(cleaned\)/);
 assert.match(app,/recent\.clear/);
 assert.match(app,/Only on this device/);
 assert.match(app,/Repeat search /);
 assert.doesNotMatch(app,/analytics\.track|localStorage|fetch\(.*recent/);
});
