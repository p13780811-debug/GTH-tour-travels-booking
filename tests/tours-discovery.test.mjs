import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import * as jsxRuntime from "react/jsx-runtime";
import * as icons from "lucide-react";

function compile(path,dependencies={}) {
  const source=readFileSync(new URL("../"+path,import.meta.url),"utf8");
  const code=ts.transpileModule(source,{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,
  }}).outputText;
  const compiledModule={exports:{}};
  vm.runInNewContext(code,{module:compiledModule,exports:compiledModule.exports,URL,URLSearchParams,Intl,AbortSignal,
    require:name=>{if(name in dependencies)return dependencies[name];throw Error("Unexpected dependency "+name);},
    process:{env:{NEXT_PUBLIC_SUPABASE_URL:"https://test.supabase.co",NEXT_PUBLIC_SUPABASE_ANON_KEY:"ci-public-test-key"}},
  },{timeout:2000});
  return compiledModule.exports;
}
const discovery=compile("src/lib/tours/discovery.ts");
const defaults=discovery.EMPTY_TOUR_SEARCH;
const fixtures=Array.from({length:26},(_,i)=>({
  id:"12345678-1234-4123-8123-"+String(i).padStart(12,"0"),
  title:"Dubai tour "+String(i).padStart(2,"0"),city:"Dubai",city_slug:"dubai",country:"AE",
  price_numeric:100+i,currency:"USD",tags:[i%2?"day-trip":"city-tour"],
  image_url:"https://images.example.test/tour.jpg",is_public:true,media_rights_verified:true,
  internal_note:"must not reach public DTO",
}));
fixtures.push(
  {...fixtures[0],id:"inr",title:"INR experience",currency:"INR",price_numeric:5},
  {...fixtures[0],id:"unicode",city:"São Paulo",city_slug:"sao-paulo",title:"São Paulo walk"},
  {...fixtures[0],id:"slug",city:null,city_slug:"new-york",title:"New York walk"},
  {...fixtures[0],id:"private",is_public:false},
  {...fixtures[0],id:"rights",media_rights_verified:false},
);
function harness(rows=fixtures,{fail=false}={}) {
  const calls=[];
  const client={from(table) {
    assert.equal(table,"tours");
    const conditions=[],orders=[];let head=false,or="";
    const call={head:false,range:null,conditions};calls.push(call);
    const query={
      select(columns,options){assert.ok(!columns.includes("*"));head=Boolean(options?.head);call.head=head;return query;},
      eq(key,value){conditions.push(["eq",key,value]);return query;},
      overlaps(key,value){conditions.push(["overlaps",key,value]);return query;},
      contains(key,value){conditions.push(["contains",key,value]);return query;},
      gte(key,value){conditions.push(["gte",key,value]);return query;},
      lte(key,value){conditions.push(["lte",key,value]);return query;},
      or(value){or=value;return query;},
      order(key,options){orders.push([key,options]);return query;},
      range(start,end){call.range=[start,end];return query;},
      abortSignal(signal){assert.ok(signal instanceof AbortSignal);call.signal=signal;return query;},
      then(resolve,reject){return Promise.resolve(result(...(call.range||[]))).then(resolve,reject);},
    };
    function result(start=0,end=rows.length-1) {
      if(fail)return {error:{message:"sensitive backend detail"},data:null,count:null};
      let visible=rows.filter(row=>conditions.every(([op,key,value])=>
        op==="eq"?row[key]===value:op==="contains"?value.every(v=>row[key]?.includes(v)):
        op==="overlaps"?value.some(v=>row[key]?.includes(v)):
        op==="gte"?row[key]>=value:row[key]<=value));
      if(or) {
        const match=or.match(/^city\.ilike\.%(.*)%,city_slug\.eq\.(.*)$/);
        assert.ok(match,"safe bounded OR city filter");
        visible=visible.filter(row=>String(row.city||"").toLowerCase().includes(match[1].toLowerCase())||row.city_slug===match[2]);
      }
      const count=visible.length;
      visible.sort((a,b)=>{
        for(const [key,options] of orders) {
          if(a[key]===b[key])continue;
          if(a[key]==null)return options.nullsFirst?-1:1;
          if(b[key]==null)return options.nullsFirst?1:-1;
          const n=typeof a[key]==="number"?a[key]-b[key]:String(a[key]).localeCompare(String(b[key]));
          if(n)return options.ascending?n:-n;
        }return 0;
      });
      if(!head&&start>0&&start>=count)return {error:{code:"PGRST103"},data:null,count:null};
      return {error:null,data:head?null:visible.slice(start,end+1),count};
    }
    return query;
  }};
  const lib=compile("src/lib/tours.ts",{
    "@supabase/supabase-js":{createClient:()=>client},
    "@/lib/tours/discovery":discovery,
  });
  return {search:lib.searchTours,calls};
}

test("global destination names and city slugs are accepted without filter delimiters",()=>{
  for(const city of ["São Paulo","New York","St. John's","मुंबई","new-york"])assert.equal(discovery.parseTourFilters({city}).ok,true,city);
  for(const city of ['Dubai),is_public.eq.false','https://host.test','<script>','Dubai%','Dubai\nCity','x'.repeat(81)]){
    assert.equal(discovery.parseTourFilters({city}).ok,false,city);
  }
});
test("invalid and repeated values fail before any database request",async()=>{
  const h=harness();
  for(const filters of [{city:["Dubai","Paris"]},{page:"0"},{page:"1e2"},{category:"bad,tag"},{sort:"random"},{currency:"USD,INR"},{minPrice:"-1"},{minPrice:"20",maxPrice:"10",currency:"USD"}]){
    assert.equal((await h.search(filters)).status,400);
  }
  assert.equal(h.calls.length,0);
});
test("prices require one currency and never imply cross-currency ranking",()=>{
  assert.equal(discovery.parseTourFilters({minPrice:"10"}).ok,false);
  assert.equal(discovery.parseTourFilters({sort:"price"}).filters.sort,"name");
  assert.equal(discovery.parseTourFilters({sort:"rating"}).filters.sort,"name");
  assert.equal(discovery.parseTourFilters({sort:"price",currency:"usd"}).filters.sort,"price");
});
test("every count and record query retains both publication gates and returns a narrow DTO",async()=>{
  const h=harness(),r=await h.search({});
  assert.equal(r.status,200);assert.equal(r.total,29);assert.equal(r.catalogTotal,29);
  assert.equal(r.items.length,24);
  assert.ok(!r.items.some(x=>["private","rights"].includes(x.id)));
  assert.ok(r.items.every(x=>!("internal_note" in x)&&!("is_public" in x)&&x.rating===null));
  for(const call of h.calls){
    assert.ok(call.conditions.some(([op,key,value])=>op==="eq"&&key==="is_public"&&value===true));
    assert.ok(call.conditions.some(([op,key,value])=>op==="eq"&&key==="media_rights_verified"&&value===true));
  }
});
test("server pagination includes every match once and avoids invalid ranges beyond the last page",async()=>{
  const h=harness(),filters={city:"Dubai",currency:"USD"};
  const first=await h.search(filters),second=await h.search({...filters,page:"2"});
  assert.equal(first.total,26);assert.equal(first.items.length,24);assert.equal(second.items.length,2);
  const ids=[...first.items,...second.items].map(x=>x.id);assert.equal(new Set(ids).size,26);
  const before=h.calls.filter(x=>x.range).length;
  const beyond=await h.search({...filters,page:"9999"});
  assert.equal(beyond.status,200);assert.equal(beyond.total,26);assert.equal(beyond.items.length,0);
  assert.equal(h.calls.filter(x=>x.range).length,before);
});
test("Unicode city names and legacy city slugs find their exact public matches",async()=>{
  const h=harness();
  assert.equal((await h.search({city:"São Paulo"})).items[0].id,"unicode");
  assert.equal((await h.search({city:"new-york"})).items[0].id,"slug");
});
test("tag, price and currency filters apply together and sorting occurs before paging",async()=>{
  const r=await harness().search({city:"Dubai",category:"day-trip",currency:"USD",minPrice:"101",maxPrice:"105",sort:"price"});
  assert.equal(r.total,3);assert.deepEqual(Array.from(r.items,x=>x.price_numeric),[101,103,105]);
  assert.ok(r.items.every(x=>x.currency==="USD"));
});
test("an unpublished catalog is a successful empty query while backend errors stay private",async()=>{
  const empty=await harness([]).search({city:"Dubai"});
  assert.equal(empty.status,200);assert.equal(empty.catalogTotal,0);assert.equal(empty.error,null);
  const failed=await harness(fixtures,{fail:true}).search({});
  assert.equal(failed.status,502);assert.doesNotMatch(JSON.stringify(failed),/sensitive backend detail/);
});
test("navigation preserves Activities context, Unicode, budget, sort and result page",()=>{
  const filters={...defaults,city:"São Paulo",category:"day-trip",currency:"USD",minPrice:"20",page:2,sort:"price"};
  const url=new URL(discovery.tourDiscoveryHref("/activities",filters,"grid"),"https://gth.test");
  assert.equal(url.pathname,"/activities");assert.equal(url.searchParams.get("city"),"São Paulo");
  assert.equal(url.searchParams.get("currency"),"USD");assert.equal(url.searchParams.get("page"),"2");
  assert.equal(url.searchParams.get("view"),"grid");assert.equal(url.hash,"#discover");
});
test("provider search uses a fixed HTTPS host without inventing affiliate tracking",()=>{
  const url=new URL(discovery.directTourSearch({...defaults,city:"São Paulo",category:"day-trip"}));
  assert.equal(url.origin,"https://www.klook.com");assert.equal(url.searchParams.get("query"),"São Paulo Day trips");
  assert.equal(url.searchParams.has("u"),false);assert.equal(url.searchParams.has("aid"),false);
  assert.equal(discovery.directTourSearch(defaults),null);
  assert.equal(discovery.directTourSearch({...defaults,city:"https://evil.test"}),null);
});
const Handoff=compile("src/components/tours/TourSearchHandoff.tsx",{
  "react/jsx-runtime":jsxRuntime,"lucide-react":icons,
  "next/link":{default:({children,...props})=>React.createElement("a",props,children)},
  "@/lib/tours/discovery":discovery,
}).default;
test("empty catalog UI offers useful choices and does not equate unpublished tours with sold out",()=>{
  const html=renderToStaticMarkup(React.createElement(Handoff,{search:{...defaults,city:"Dubai"},error:null,status:200,catalogTotal:0,basePath:"/tours"}));
  assert.match(html,/Search Dubai on Klook/);assert.match(html,/not published yet/);
  assert.match(html,/does not mean the destination is sold out/);assert.doesNotMatch(html,/No matching tour listings found/);
});
test("invalid search UI has a recovery action and never creates a provider query",()=>{
  const html=renderToStaticMarkup(React.createElement(Handoff,{search:defaults,error:"Invalid filters",status:400,catalogTotal:0,basePath:"/activities"}));
  assert.match(html,/role="alert"/);assert.match(html,/Reset search/);assert.match(html,/\/activities#discover/);
  assert.doesNotMatch(html,/klook\.com/);
});

test("route intent separates default tour and activity catalogs without losing explicit legacy categories",async()=>{
 const rows=[{...fixtures[0],id:"tour",tags:["day-trip"]},{...fixtures[0],id:"activity",tags:["outdoor"]},{...fixtures[0],id:"private-activity",tags:["outdoor"],is_public:false}];
 const h=harness(rows);
 assert.deepEqual((await h.search({},"/tours")).items.map(x=>x.id),["tour"]);
 assert.deepEqual((await h.search({},"/activities")).items.map(x=>x.id),["activity"]);
 assert.deepEqual((await h.search({category:"outdoor"},"/tours")).items.map(x=>x.id),["activity"]);
});
const Hero=compile("src/components/tours/TourSearchHero.tsx",{
 "react/jsx-runtime":jsxRuntime,"lucide-react":icons,
 "next/link":{default:({children,...props})=>React.createElement("a",props,children)},
 "next/image":{default:()=>null},
 "@/components/travel/TravelSectionNav":{default:()=>React.createElement("nav",{"aria-label":"Travel categories"})},
 "@/lib/tours/discovery":discovery,
}).default;
test("server-rendered hero offers distinct destination search and route-safe category choices before loading",()=>{
 const tours=renderToStaticMarkup(React.createElement(Hero,{basePath:"/tours",filters:{...defaults,city:"Dubai"}}));
 const activities=renderToStaticMarkup(React.createElement(Hero,{basePath:"/activities",filters:defaults}));
 assert.match(tours,/Discover Tours Around the World/);assert.match(activities,/Discover Activities &amp; Attraction Tickets/);
 assert.match(tours,/action="\/tours#discover"/);assert.match(activities,/action="\/activities#discover"/);
 assert.match(tours,/value="day-trip"/);assert.doesNotMatch(tours,/value="outdoor"/);
 assert.match(activities,/value="outdoor"/);assert.doesNotMatch(activities,/value="day-trip"/);
 assert.match(tours,/href="\/activities\?city=Dubai"/);
 assert.ok(tours.indexOf('Find tours')<tours.indexOf('Travel categories'));
 assert.doesNotMatch(tours+activities,/type="date"|name="guests"|Guaranteed Price|Instant Booking/);
});
