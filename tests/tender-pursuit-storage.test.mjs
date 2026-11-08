import test from "node:test";
import assert from "node:assert/strict";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";
const core=loadTenderTs("src/lib/tender/discovery-workspace.ts"),pursuit=loadTenderTs("src/lib/tender/pursuit.ts",{"./discovery-workspace":core});
const ID="edb636b8-1c11-4e70-b0aa-ff38d965c777",OTHER="edb636b8-1c11-4e70-b0aa-ff38d965c778";
test("personal bid decisions are bounded device records and effort comparisons reject unknown or malformed inputs",()=>{
 const plan={...pursuit.NEW_PURSUIT,decision:"pursue",reason:"Internal capacity review",requiredHours:"12",availableHours:"8"};
 const parsed=pursuit.parsePursuits(JSON.stringify({version:1,plans:{[ID]:plan,notAnId:plan}}));assert.equal(Object.keys(parsed).length,1);assert.equal(parsed[ID].decision,"pursue");assert.equal(pursuit.pursuitCapacity(plan).gap,4);
 for(const hours of ["","-5","Infinity","1e4","100000"])assert.equal(pursuit.pursuitCapacity({...plan,requiredHours:hours}).known,false);
 assert.equal(Object.keys(pursuit.parsePursuits('malformed')).length,0);
});
test("work-back targets are internal offsets, distinguish passed targets and never invent an official pre-bid date",()=>{
 const end=Date.parse('2026-12-10T12:00:00Z'),tasks=pursuit.personalMilestones(new Date(end).toISOString(),end-36*3600000);
 assert.equal(tasks.length,4);assert.equal(tasks[0].upcoming,false);assert.equal(tasks.at(-1).upcoming,true);
 assert.equal(Date.parse(tasks[2].at),end-24*3600000);assert.equal(pursuit.personalMilestones('invalid').length,0);
});
function browserStorage(){
 let value=JSON.stringify({version:1,saved:[ID],comparison:[],searches:[]}),readFails=false,writeFails=false,writes=0;
 const win={localStorage:{getItem(){if(readFails)throw Error('blocked read');return value;},setItem(_key,next){if(writeFails)throw Error('blocked write');writes++;value=next;}},dispatchEvent(){},addEventListener(){},removeEventListener(){}};
 const hooks=loadTenderTs("src/components/tender/useTenderWorkspace.ts",{"@/lib/tender/discovery-workspace":core,react:{useCallback:fn=>fn,useMemo:fn=>fn(),useSyncExternalStore:(_subscribe,snapshot)=>snapshot()}},{window:win,Event:class{}});
 return {hooks,readFail:v=>readFails=v,writeFail:v=>writeFails=v,stored:()=>JSON.parse(value),writes:()=>writes,external:next=>value=JSON.stringify(next)};
}
test("failed storage reads cannot overwrite unseen older tenders and recovery preserves the pending user action",()=>{
 const h=browserStorage();h.readFail(true);const state=h.hooks.useTenderWorkspace();assert.equal(state.update(w=>({...w,saved:[...w.saved,OTHER]})),false);assert.equal(h.writes(),0);
 h.readFail(false);assert.equal(state.update(w=>({...w,comparison:[OTHER]})),true);assert.ok(h.stored().saved.includes(ID));assert.ok(h.stored().saved.includes(OTHER));
 h.external({version:1,saved:[ID],comparison:[],searches:[]});assert.equal(h.hooks.useTenderWorkspace().workspace.saved.length,1,"persistent reads must recover, rather than permanently staying memory-only");
});
test("failed writes replay pending edits on the latest stored state without resurrecting an explicit removal",()=>{
 const h=browserStorage(),state=h.hooks.useTenderWorkspace();h.writeFail(true);state.update(w=>({...w,saved:[...w.saved,OTHER]}));h.writeFail(false);
 state.update(w=>({...w,saved:w.saved.filter(id=>id!==ID)}));assert.equal(h.stored().saved.length,1);assert.equal(h.stored().saved[0],OTHER);
});
