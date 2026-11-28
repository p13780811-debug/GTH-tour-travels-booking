import test from "node:test";
import assert from "node:assert/strict";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";

const load=loadTenderTs;
const cache=load("src/lib/security/public-edge-cache.ts");
const city=load("src/lib/mobility/city.ts",{"./currencies":load("src/lib/mobility/currencies.ts")});
const stadiums=load("src/lib/travel/stadiums.ts");
const hotelWhiteLabel=load("src/lib/travel/hotel-whitelabel.ts",{}, {atob,btoa});
const hotelRouting=load("src/lib/travel/hotel-routing.ts",{"./hotel-whitelabel":hotelWhiteLabel},{atob,btoa});
const audience=load("src/lib/tender/native-audience.ts");
const nativeTender=load("scripts/cloudflare-native-tender.mjs",{"../src/lib/security/rate-limit.ts":{enforceRateLimit:async()=>{}},"../src/lib/tender/native-audience.ts":audience});
const deps={
 "./cloudflare-native-tender.mjs":nativeTender,
 "../src/lib/security/public-edge-cache.ts":{publicReadCacheKey:cache.publicReadCacheKey,storePublicEdgeCache:async(_request,response)=>response},
 "../src/lib/mobility/city.ts":city,
 "../src/lib/travel/osmCountryCodes.ts":load("src/lib/travel/osmCountryCodes.ts"),
 "../src/lib/mobility/traffic.ts":load("src/lib/mobility/traffic.ts"),
 "../src/lib/real-estate/registry-search.ts":load("src/lib/real-estate/registry-search.ts"),
 "../src/lib/real-estate/property-seo.ts":load("src/lib/real-estate/property-seo.ts"),
 "../src/lib/travel/stadiums.ts":stadiums,
 "../src/lib/travel/stadium-concierge.ts":load("src/lib/travel/stadium-concierge.ts",{"./hotel-routing":hotelRouting}),
};
const env={GTH_CLOUDFLARE_INGRESS:"1",NEXT_PUBLIC_SUPABASE_URL:"https://fixture.supabase.co",NEXT_PUBLIC_SUPABASE_ANON_KEY:"sb_publishable_fixture_only"};
const req=(path,init)=>new Request("https://preview.example.com"+path,init);
const make=fetch=>load("scripts/cloudflare-native-public-reads.mjs",deps,{fetch,atob}).nativePublicRead;
test("native reads allow only anonymous public GETs and fail closed for privileged keys",async()=>{
 let calls=0;
 const run=make(async()=>{calls++;return Response.json([])});
 for(const request of [req("/api/mobility/traffic?city=mumbai",{method:"POST"}),req("/api/real-estate/registry-preview?q=Mumbai",{headers:{Authorization:"Bearer private"}}),req("/api/real-estate/registry-preview?q=Mumbai&q=Delhi"),req("/api/tender/workspaces"),req("/api/mobility/cities?q=Mumbai&other=x"),req("/api/mobility/cities?q=Mumbai",{headers:{Cookie:"session=private"}})])assert.equal(await run(request,env),null);
 assert.equal(await run(req("/api/mobility/cities?q=Mumbai"),{...env,NEXT_PUBLIC_SUPABASE_ANON_KEY:"sb_secret_fixture"}),null);
 assert.equal(await run(req("/api/mobility/cities?q=Mumbai"),{...env,NEXT_PUBLIC_SUPABASE_URL:"https://example.org"}),null);
 assert.equal(calls,0);
});
test("native mobility uses bounded anonymous catalog reads and filters expired community reports",async()=>{
 const run=make(async(input,init)=>{
  const url=new URL(input);assert.equal(url.hostname,"fixture.supabase.co");assert.equal(init.headers.apikey,env.NEXT_PUBLIC_SUPABASE_ANON_KEY);assert.equal(init.headers.Authorization,undefined);
  if(url.pathname.endsWith("/destinations")){
   assert.equal(url.searchParams.get("name"),"ilike.mumbai%");assert.equal(url.searchParams.get("is_active"),"is.true");assert.equal(url.searchParams.get("limit"),"15");
   return Response.json([{name:"Mumbai",slug:"mumbai",country:"India",country_code:"IN"}]);
  }
  assert.equal(url.pathname,"/rest/v1/rpc/mobility_traffic_feed");assert.deepEqual(JSON.parse(init.body),{p_city:"mumbai"});
  return Response.json({zones:[{id:"dadar"}],reports:[{id:"old",expiresAt:"2000-01-01T00:00:00Z"},{id:"fresh",expiresAt:"2099-01-01T00:00:00Z"}]});
 });
 const cities=await (await run(req("/api/mobility/cities?q=Mumbai"),env)).json();assert.equal(cities.degraded,false);assert.equal(cities.cities.length,1);assert.equal(cities.cities[0].slug,"mumbai");
 const traffic=await (await run(req("/api/mobility/traffic?city=mumbai"),env)).json();assert.deepEqual(traffic.reports.map(r=>r.id),["fresh"]);
});
test("native registry keeps source filters, anonymous projection, and bounded pulse lookup",async()=>{
 const run=make(async(input,init)=>{
  const url=new URL(input);
  if(url.pathname.endsWith("/properties")){
   assert.equal(url.searchParams.get("source_type"),"in.(registry,rera)");assert.equal(url.searchParams.get("ingestion_source"),"ilike.%maharera%");assert.equal(url.searchParams.get("limit"),"35");assert.match(url.searchParams.get("or"),/title\.ilike\.%Mumbai%/);
   return Response.json([{id:1,slug:"public-project",title:"Public project",rera_id:"P12345678901",developer:null,builder_name:"Public developer",city:null,district:"Mumbai",private_email:"private"},{id:2,slug:"archived-project",title:"Archived project",rera_id:"P12345678902",status:"archived"}]);
  }
  assert.equal(url.pathname,"/rest/v1/rpc/gth_read_infra_pulse");assert.deepEqual(JSON.parse(init.body),{p_property_ids:[1]});return Response.json([]);
 });
 const response=await run(req("/api/real-estate/registry-preview?q=Mumbai"),env);assert.equal(response.headers.get("cache-control"),"no-store");const body=await response.json();assert.equal(body.items.length,1);assert.equal(body.items[0].developer,"Public developer");assert.equal(body.items[0].city,"Mumbai");assert.equal(body.items[0].private_email,undefined);
});
test("native concierge preserves both geographic bounds and ranks actual nearby records",async()=>{
 const run=make(async(input)=>{
  const url=new URL(input);assert.equal(url.pathname,"/rest/v1/hotel_catalog");assert.equal(url.searchParams.getAll("latitude").length,2);assert.equal(url.searchParams.getAll("longitude").length,2);assert.equal(url.searchParams.get("limit"),"300");
  return Response.json([{name:"Near",latitude:18.9389,longitude:72.8258,source_url:"https://www.openstreetmap.org/node/1"},{name:"Far",latitude:19.4,longitude:73,source_url:"https://www.openstreetmap.org/node/2"}]);
 });
 const response=await run(req("/api/stadiums/concierge?venue=wankhede-stadium"),env);const body=await response.json();assert.equal(body.hotels.length,1);assert.equal(body.hotels[0].name,"Near");assert.equal(body.hotels[0].distanceKm,0);assert.equal(body.bookingUrl,"/api/hotels/booking?city=Mumbai&country=IN");
 const fail=make(async()=>new Response(null,{status:503}));assert.equal(await fail(req("/api/stadiums/concierge?venue=wankhede-stadium"),env),null);
});

test("cold Tender native ingress uses one anonymous bounded REST request with exact count",async()=>{
 let calls=0;
 const run=make(async(url,init)=>{
  calls++;
  assert.equal(new URL(url).pathname,"/rest/v1/tenders");
  assert.equal(new URL(url).searchParams.get("country_code"),"eq.IN");
  assert.equal(new URL(url).searchParams.get("limit"),"12");
  assert.equal(init.headers.Prefer,"count=exact");
  assert.equal(init.headers.apikey,env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  assert.equal(init.headers.Authorization,undefined);
  return Response.json([],{headers:{"Content-Range":"*/0"}});
 });
 const response=await run(req("/api/tender?scope=world&country=IN"),env);
 assert.equal(response.status,200);
 assert.equal(response.headers.get("X-GTH-Edge-Read"),"native-tender");
 assert.equal((await response.json()).total,0);
 assert.equal(calls,1);
 assert.equal(await run(req("/api/tender?scope=local&country=IN"),env),null);
 assert.equal(await run(req("/api/tender?scope=world&country=IN",{headers:{Cookie:"private=1"}}),env),null);
 assert.equal(calls,1);
});
