import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const now=new Date();
const rows=[];
for(const [country,count] of [["IN",13],["BD",4],["NP",2],["US",3]]){
  for(let i=0;i<count;i++) rows.push({
    id:country+"_"+i,country_code:country,title:"Official hospital procurement "+country,
    status:"published",source_verified:true,is_public:true,sector:"goods",
    deadline_at:new Date(now.getTime()+(i+10)*86400000).toISOString()
  });
}
let calls=0;
const client={from(table){
  assert.equal(table,"tenders");
  calls++;
  const eq={},membership={};
  let gt,lt,like,limitValue=1000,head=false;
  const query={
    select(_columns,options){head=Boolean(options?.head);return query},
    eq(k,v){eq[k]=v;return query},
    in(k,v){membership[k]=v;return query},
    gt(k,v){gt=[k,v];return query},
    lte(k,v){lt=[k,v];return query},
    ilike(k,v){like=[k,v];return query},
    order(){return query},
    then(onFulfilled,onRejected){return Promise.resolve(result(0,limitValue)).then(onFulfilled,onRejected)},
    limit(n){limitValue=n;return query},
    range(start,end){return Promise.resolve(result(start,end-start+1))}
  };
  function result(offset,n){
    let filtered=rows.filter(r=>{
      for(const [k,v] of Object.entries(eq))if(r[k]!==v)return false;
      for(const [k,vals] of Object.entries(membership))if(!vals.includes(r[k]))return false;
      if(gt && !(r[gt[0]]>gt[1]))return false;
      if(lt && !(r[lt[0]]<=lt[1]))return false;
      if(like && !String(r[like[0]]).toLowerCase().includes(like[1].replaceAll("%","").toLowerCase()))return false;
      return true;
    }).sort((a,b)=>a.deadline_at.localeCompare(b.deadline_at)||a.id.localeCompare(b.id));
    // Match the real PostgREST range failure rather than silently returning [].
    if(!head&&offset>0&&offset>=filtered.length)return {data:null,count:null,error:{code:"PGRST103"}};
    return {data:head?null:filtered.slice(offset,offset+n),count:filtered.length,error:null};
  }
  return query;
}};
const code=ts.transpileModule(
  readFileSync(new URL("../src/lib/tender/catalog.ts",import.meta.url),"utf8"),
  {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}
).outputText;
const mod={exports:{}};
vm.runInNewContext(code,{
  module:mod,exports:mod.exports,require:()=>({createClient:()=>client}),
  process:{env:{NEXT_PUBLIC_SUPABASE_URL:"https://example.supabase.co",NEXT_PUBLIC_SUPABASE_ANON_KEY:"test-public-key"}},
  Date,URL,Set,console
},{timeout:2000});
const search=mod.exports.searchPublicTenders;
const base={q:"",country:"IN",sector:"",closingBefore:"",page:1,scope:"local",nearby:["BD","NP"]};

test("Visitor country results come before nearby, and never include unrelated US",async()=>{
  const res=await search(base);
  assert.equal(res.ok,true);assert.equal(res.total,19);
  assert.equal(res.primaryCount,13);assert.equal(res.nearbyCount,6);
  assert.ok(res.items.every(r=>r.country_code==="IN"));
});
test("Page boundary preserves home-first ordering then nearby without duplicates",async()=>{
  const res=await search({...base,page:2});
  assert.equal(res.ok,true);assert.equal(res.items.length,7);
  assert.equal(res.items[0].country_code,"IN");
  assert.ok(res.items.slice(1).every(r=>["BD","NP"].includes(r.country_code)));
  assert.equal(new Set(res.items.map(r=>r.id)).size,res.items.length);
  assert.ok(!res.items.some(r=>r.country_code==="US"));
});
test("Second page still loads nearby when all home notices fit on the first page",async()=>{
  const filters={...base,country:"BD",nearby:["IN","NP"]};
  const first=await search(filters);
  const second=await search({...filters,page:2});
  assert.equal(second.ok,true);assert.equal(second.total,19);
  assert.equal(second.primaryCount,4);assert.equal(second.nearbyCount,15);
  assert.equal(second.items.length,7);
  assert.ok(second.items.every(r=>["IN","NP"].includes(r.country_code)));
  const ids=[...first.items,...second.items].map(r=>r.id);
  assert.equal(new Set(ids).size,19);
});
test("Empty home group and pages beyond local results do not query invalid ranges",async()=>{
  const nearby=await search({...base,country:"LK",nearby:["IN"],page:2});
  assert.equal(nearby.ok,true);assert.equal(nearby.items.length,1);assert.equal(nearby.total,13);
  for(const filters of [{...base,page:3},{...base,country:"BD",nearby:[],page:2}]){
    const result=await search(filters);
    assert.equal(result.ok,true);assert.equal(result.items.length,0);
    assert.ok(result.total>0);
  }
});
test("An out-of-range worldwide page preserves count without reporting an outage",async()=>{
  const result=await search({...base,scope:"world",country:"US",page:2});
  assert.equal(result.ok,true);assert.equal(result.total,3);assert.equal(result.items.length,0);
});
test("Unknown visitor does not see random worldwide inventory",async()=>{
  const before=calls;
  const res=await search({...base,country:"",nearby:[]});
  assert.equal(res.ok,true);assert.equal(res.countryRequired,true);
  assert.equal(res.total,0);assert.equal(calls,before);
});
test("Worldwide is allowed only by explicit user request",async()=>{
  const res=await search({...base,scope:"world",country:"",page:1});
  assert.equal(res.ok,true);assert.equal(res.total,22);
  const oneCountry=await search({...base,scope:"world",country:"US"});
  assert.equal(oneCountry.total,3);
});

test("Live tender dashboard categories are DB-derived in selected region only",async()=>{
  const stats=await mod.exports.getTenderDiscoveryStats(base);
  assert.ok(stats);
  assert.equal(stats.sectors.goods,19);
  assert.equal(stats.sectors.works,0);
  assert.equal(stats.closingSoon7,0);
  const globalStats=await mod.exports.getTenderDiscoveryStats({...base,country:"",scope:"world",nearby:[]});
  assert.equal(globalStats.sectors.goods,22);
});
test("Closing within seven days never shows unrelated or later tenders",async()=>{
  const result=await search({...base,closingWithin:"7"});
  assert.equal(result.ok,true);
  assert.equal(result.total,0);
});
