// Read-only release QA. No database writes, paid supplier API or browser traffic.
import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import {parse} from "dotenv";
import {createClient} from "@supabase/supabase-js";
import {loadTenderTs as load} from "../tests/helpers/tender-upgrade-loader.mjs";
const env=parse(process.env.GTH_CLOUDFLARE_RUNTIME_ENV||"");
const url=env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
delete process.env.GTH_CLOUDFLARE_RUNTIME_ENV;
assert.ok(url&&new URL(url).protocol==="https:"&&new URL(url).hostname.endsWith(".supabase.co"),"Public DB URL missing");
assert.ok(key&&!key.startsWith("sb_secret_"),"Public DB key missing");
if(key.split(".").length===3)assert.equal(JSON.parse(Buffer.from(key.split(".")[1],"base64url").toString()).role,"anon");
else assert.ok(key.startsWith("sb_publishable_"));
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const country=load("src/lib/destinations/country.ts");
const geo=load("src/lib/destinations/geography.ts",{"./country":country});
const detail=load("src/lib/destinations/detail-link.ts",{"./country":country});
const venues=load("src/lib/travel/stadiums.ts");
const flights=load("src/data/flight/destinations.ts");
const ecosystem=load("src/lib/destinations/ecosystem.ts",{"@/data/flight/destinations":flights,"@/lib/travel/stadiums":venues});
const media=load("src/lib/destinations/visual-media.ts");
const wl=load("src/lib/travel/hotel-whitelabel.ts",{},{btoa,atob});
const routing=load("src/lib/travel/hotel-routing.ts",{"./hotel-whitelabel":wl},{btoa,atob});
const partner=load("src/lib/travel/partner-search.ts");
const hotels=load("src/lib/travel/klook-hotel-search.ts",{"./partner-search":partner,"./hotel-routing":routing});
const base="https://www.gthproglobal.com";
const expected=new Set(["hotels","packages","flights","tours","activities","attractions","transfers","cars","bus","train","guides","blog","properties","post-property","tenders","tender-assistant","tickets","stadiums","list-hotel"]);
const seen=new Set(),countries=new Set(),issues=[];let count=0,links=0,legacy=0,hotelDirect=0,hotelPicker=0,hotelAlternative=0,expectedCount=null;
function fail(slug,reason){if(issues.length<30)issues.push({slug,reason});}
for(let offset=0;;offset+=1000){
 const q=await db.from("destinations").select("slug,name,country,country_code",offset===0?{count:"exact"}:undefined).eq("is_active",true).order("id").range(offset,offset+999).abortSignal(AbortSignal.timeout(15000));
 if(q.error||!q.data)throw Error("Public catalogue read failed; no completion claim");
 if(offset===0)expectedCount=q.count;
 for(const row of q.data){
  count++;
  try{
   assert.ok(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug)&&row.slug.length<=140);
   assert.ok(typeof row.name==="string"&&row.name.trim().length>=2&&row.name.length<=80);
   assert.ok(!seen.has(row.slug),"Duplicate slug");
   seen.add(row.slug);
   const g=geo.destinationGeography(row.slug,row.country);
   const code=ecosystem.destinationCountryCode(g.country,row.country_code);
   assert.ok(code,"Missing country context");
   countries.add(code);if(!row.country_code)legacy++;
   const place={slug:row.slug,name:row.name,country:g.country,countryCode:code};
   const target=new URL(detail.destinationDetailHref(place),base);
   assert.equal(target.pathname,"/destinations/"+row.slug);
   if(g.country)assert.equal(target.searchParams.get("country"),g.country);
   const actions=ecosystem.destinationServices(place);
   assert.equal(actions.length,expected.size);
   assert.equal(new Set(actions.map(a=>a.key)).size,expected.size);
   for(const action of actions){
    assert.ok(expected.has(action.key));
    const u=new URL(action.href,base);assert.equal(u.origin,base);
    assert.ok(!u.username&&!u.password&&u.pathname!=="/");
    const path=u.pathname.slice(1);
    assert.ok(existsSync("src/app/"+path+"/page.tsx")||existsSync("src/app/"+path+"/route.ts")||(path.startsWith("stadiums/")&&venues.stadiums.some(v=>v.slug===path.split("/")[1])&&existsSync("src/app/stadiums/[slug]/page.tsx")),"Missing route: "+path);
    assert.ok(existsSync("public"+media.destinationServicePhoto(action.key)),"Missing visual asset");
    if(action.key==="hotels"||action.key==="packages"){assert.equal(u.searchParams.get("city"),row.name);assert.equal(u.searchParams.get("country"),code);}
    if(action.key==="tenders")assert.equal(u.searchParams.get("country"),code);
    if(action.key==="stadiums"&&path.startsWith("stadiums/")){const v=venues.stadiums.find(v=>v.slug===path.split("/")[1]);assert.equal(v.countryCode,code);assert.equal(v.city.toLowerCase(),row.name.toLowerCase());}
    links++;
   }
   // Strict city-name validation can decline uncommon punctuation. The destination
   // page still offers the existing manual booking picker; never guess a place ID.
   const h=hotels.destinationHotelHref(row.name,code);
   if(h){const u=new URL(h,base);assert.ok([base,"https://hotel.gthproglobal.com","https://www.klook.com"].includes(u.origin));if(u.origin===base){assert.equal(u.pathname,"/hotels");hotelPicker++;}else if(u.origin==="https://hotel.gthproglobal.com"){assert.equal(u.pathname,"/hotels");assert.ok(u.searchParams.get("placeId"));hotelDirect++;}else hotelAlternative++;}
   else hotelPicker++;
  }catch(e){fail(row.slug,String(e.message).slice(0,180));}
 }
 if(q.data.length<1000)break;
 await new Promise(r=>setTimeout(r,250));
}
console.log("CATALOGUE_CONTRACT",JSON.stringify({expectedCount,count,uniqueSlugs:seen.size,countries:countries.size,legacy,links,hotelDirect,hotelAlternative,hotelPicker,issues}));
assert.equal(count,expectedCount,"Catalogue count changed or incomplete");
assert.equal(issues.length,0,"Catalogue contract failures");
assert.equal(links,count*expected.size);
console.log("ALL_CATALOGUE_LINK_CONTRACTS_PASSED");
