import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";
const currency=loadTenderTs("src/lib/travel/hotel-currency.ts"),hotel=loadTenderTs("src/lib/travel/hotel-whitelabel.ts",{},{btoa,atob}),fare=loadTenderTs("src/lib/flights/fare-search.ts");
const trip=loadTenderTs("src/lib/travel/connected-trip.ts",{"./hotel-whitelabel":hotel,"./hotel-currency":currency,"../flights/fare-search":fare},{btoa});
const discovery=loadTenderTs("src/lib/tours/discovery.ts");
test("experience visit dates persist without replacing hotel checkout or flight return",()=>{
 const now=new Date("2026-11-09Z"),raw={tripCountry:"IN",tripCity:"Mumbai",tripStart:"2026-12-10",tripEnd:"2026-12-14",tripVisitDate:"2026-12-20"};
 const parsed=trip.parseConnectedTrip(raw,["IN"],now);assert.equal(parsed.ok,true);assert.equal(parsed.trip.end,raw.tripEnd);assert.equal(parsed.trip.visitDate,raw.tripVisitDate);
 const params=trip.connectedTripParams(parsed.trip,"experiences");assert.equal(params.get("tripVisitDate"),raw.tripVisitDate);
 for(const tripVisitDate of ["2026-02-30","2026-11-08","2029-12-20",[raw.tripVisitDate,raw.tripVisitDate]])assert.equal(trip.parseConnectedTrip({...raw,tripVisitDate},["IN"],now).ok,false);
});
function gallery(fetcher){
 let reads=0;const cache=new Map();
 const api=loadTenderTs("src/lib/travel/connected-experiences.ts",{
  "server-only":{},"@/lib/tours/discovery":discovery,
  "@/lib/tours/supplier-catalog":{getSupplierCatalog:async(raw,mode)=>{reads++;assert.equal(mode,"/activities");assert.equal(raw.currency,"USD");return fetcher(raw);}},
  "next/cache":{unstable_cache:(fn,keys,options)=>{assert.equal(options.revalidate,86400);return city=>{if(!cache.has(city))cache.set(city,fn(city).catch(error=>{cache.delete(city);throw error;}));return cache.get(city);};}},
 });return {api,reads:()=>reads};
}
test("experience gallery reuses the free public catalogue, coalesces requests and caps cards",async()=>{
 const {api,reads}=gallery(async()=>({items:Array.from({length:24},(_,id)=>({id})),status:"ready"}));
 const results=await Promise.all(Array.from({length:40},()=>api.connectedExperiences("Mumbai")));assert.equal(results[0].items.length,6);assert.equal(reads(),1);
 await api.connectedExperiences("MUMBAI");assert.equal(reads(),1);await api.connectedExperiences("London");assert.equal(reads(),2);
});
test("bad locations and unavailable catalogues cannot produce invented supplier cards or repeated outage calls",async()=>{
 const {api,reads}=gallery(async()=>({items:[],status:"unavailable"}));
 assert.equal((await api.connectedExperiences("<script>")).items.length,0);assert.equal(reads(),0);
 await api.connectedExperiences("Mumbai");await api.connectedExperiences("Mumbai");assert.equal(reads(),1);
 for(const file of ["src/lib/travel/connected-experiences.ts","src/app/api/travel/experiences/route.ts"]){const s=readFileSync(file,"utf8");assert.doesNotMatch(s,/createClient|\.from\(|process\.env|api\.liteapi\.travel|booking\/|prebook|price.index|\/data\/places/i);}
});
test("discovery collections use existing images and supported filters without invented offers",()=>{
 const content=loadTenderTs("src/lib/travel/travel-editorial.ts");
 for(const item of [...content.FLIGHT_DESTINATIONS,...content.EXPERIENCE_COLLECTIONS]){assert.ok(readFileSync("public"+item.image).length);assert.equal("price" in item,false);assert.equal("rating" in item,false);}
 for(const item of content.EXPERIENCE_COLLECTIONS)assert.ok(discovery.experienceCategories("/activities").some(category=>category.value===item.category));
});
test("airport selection keeps exact codes, avoids ambiguous cities and distinguishes Goa from GOA",()=>{
 const reference={airportIndex:[{code:"GOI",city:"Goa",name:"Dabolim Airport"},{code:"GOA",city:"Genoa",name:"Genoa Airport"},{code:"LHR",city:"London",name:"Heathrow"},{code:"LGW",city:"London",name:"Gatwick"}]};
 const field=loadTenderTs("src/components/travel/TravelAirportField.tsx",{"react":{},"react/jsx-runtime":{},"lucide-react":{},"@/lib/travel/nuiteeAirportIndex":reference,"./ConnectedTravelWorkspace.module.css":{}});
 assert.equal(field.airportCode("Goa"),"GOI");assert.equal(field.airportCode("GOA"),"GOA");assert.equal(field.airportCode("London"),"");assert.equal(field.airportCode("London (LHR)"),"LHR");assert.equal(field.airportCode("AKL"),"AKL");assert.equal(field.airportCode("https://invalid"),"");
});
test("public gallery endpoint rejects proxy/duplicate inputs and shares only successful catalogues for 24 hours",async()=>{
 let calls=0;
 const GET=loadTenderTs("src/app/api/travel/experiences/route.ts",{"next/server":{NextResponse:{json:(value,init)=>Response.json(value,init)}},"@/lib/tours/discovery":discovery,"@/lib/travel/connected-experiences":{connectedExperiences:async()=>{calls++;return {items:[],available:true};}}}).GET;
 for(const query of ["?city=Mumbai&city=London","?path=book","?city=%3Cscript%3E"]){assert.equal((await GET(new Request("https://example.test/api/travel/experiences"+query))).status,400);}assert.equal(calls,0);
 const good=await GET(new Request("https://example.test/api/travel/experiences?city=Mumbai"));assert.equal(good.status,200);assert.match(good.headers.get("cache-control"),/s-maxage=86400/);assert.equal(calls,1);
});
test("Travel is static, tabs restore URL state locally and galleries load only when opened",()=>{
 const read=file=>readFileSync(file,"utf8");
 assert.doesNotMatch(read("src/app/travel/page.tsx"),/searchParams|async function/);
 assert.doesNotMatch(read("src/components/travel/ConnectedTravelWorkspace.tsx"),/router\.replace|router\.push/);
 assert.match(read("src/components/travel/ConnectedTravelWorkspace.tsx"),/history\.replaceState/);
 assert.match(read("src/components/travel/ConnectedTravelWorkspace.tsx"),/opened\.includes\(item\)/);
 assert.match(read("src/components/travel/ConnectedExperienceGallery.tsx"),/86400000/);
});
