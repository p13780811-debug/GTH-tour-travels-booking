import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function load(path,imports={}){
  const mod={exports:{}};
  vm.runInNewContext(ts.transpileModule(read(path),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  }).outputText,{
    module:mod,exports:mod.exports,URL,URLSearchParams,btoa,atob,
    require:name=>{if(name in imports)return imports[name];throw Error("Unexpected dependency "+name);}
  },{timeout:2000});
  return mod.exports;
}
const affiliate=load("src/lib/travel/partner-search.ts");
const hotelWhiteLabel=load("src/lib/travel/hotel-whitelabel.ts");
const routing=load("src/lib/travel/hotel-routing.ts",{"./hotel-whitelabel":hotelWhiteLabel});
const hotels=load("src/lib/travel/klook-hotel-search.ts",{"./partner-search":affiliate,"./hotel-routing":routing});

test("Goa and Dubai hotel handoffs target supplier HOTEL category with existing campaign",()=>{
  for(const [city,path] of [
    ["Goa","/destination/c178-goa/3-hotel/"],
    ["Dubai","/en-IN/destination/c78-dubai/3-hotel/"]
  ]){
    const link=hotels.trackedHotelCityHref(city);
    assert.ok(link);
    const affiliateUrl=new URL(link);
    assert.equal(affiliateUrl.origin,"https://tp.media");
    for(const [field,value] of Object.entries({campaign_id:"137",marker:"417668",p:"4110",trs:"504342",sub_id:"gth_hotels_"+city.toLowerCase()}))
      assert.equal(affiliateUrl.searchParams.get(field),value);
    const target=new URL(affiliateUrl.searchParams.get("u"));
    assert.equal(target.hostname,"www.klook.com");
    assert.equal(target.pathname,path);
    assert.equal(target.searchParams.size,0);
  }
});
test("Worldwide routing preserves exact booking kind, never invents a Klook hotel result",()=>{
 const known=["Goa","Dubai","Tokyo","Singapore","Paris","Bangkok","Rome","New York","Kolkata","Chennai","Hyderabad","Ahmedabad","Jaipur","New Delhi","Bali"];
 for(const city of known){
   const url=hotels.destinationHotelHref(city);
   assert.ok(url);
   const affiliateUrl=new URL(url);
   assert.equal(affiliateUrl.origin,"https://tp.media");
   assert.match(new URL(affiliateUrl.searchParams.get("u")).pathname,/\/3-hotel\/$/);
 }
 // Reviewed supplier Place IDs are the only direct Nuitee city results.
 for(const city of ["Mumbai","London"]){
   const target=hotels.destinationHotelHref(city);
   assert.ok(target);
   assert.equal(new URL(target).origin,"https://hotel.gthproglobal.com");
   assert.equal(new URL(target).pathname,"/hotels");
 }
 // No fake Klook category, supplier placeId or hotel match for unverified cities.
 for(const city of ["Abu Dhabi","Sydney","Digha"]){
   assert.equal(hotels.trackedHotelCityHref(city),null);
   const href=hotels.destinationHotelHref(city);
   assert.match(href,/^\/hotels\?view=booking&city=/);
   assert.equal(new URL(href,"https://gthproglobal.com").searchParams.get("city"),city);
 }
});
test("No invented city, arbitrary affiliate destination or fake exact hotel match",()=>{
  for(const city of ["evil.example","javascript:alert(1)","東京",42,null])assert.equal(hotels.trackedHotelCityHref(city),null);
  const booking=read("src/components/hotel/HotelBookingExperience.tsx");
  const page=read("src/app/hotels/page.tsx");
  assert.match(booking,/LiteAPI.SearchBar.create/);
  assert.match(booking,/cityAlternativeHref/);
  assert.match(page,/Search bookable hotels/);
  assert.match(page,/Search OSM directory/);
  assert.match(page,/The independent hotel directory did not respond/);
});

test("Every reviewed city routes to its own exact hotel list with preserved affiliate attribution",()=>{
 const expected={
  Tokyo:"c28-tokyo",Singapore:"c6-singapore",Paris:"c107-paris",
  Bangkok:"c4-bangkok",Rome:"c92-rome","New York":"c93-new-york",
  Kolkata:"c271-kolkata",Chennai:"c274-chennai",Hyderabad:"c252-hyderabad",
  Ahmedabad:"c303-ahmedabad",Jaipur:"c149-jaipur",
  "New Delhi":"c145-delhi",Bali:"c8-bali",Goa:"c178-goa",Dubai:"c78-dubai",
 };
 for(const [city,code] of Object.entries(expected)){
  const link=hotels.destinationHotelHref(city);
  const url=new URL(link);
  assert.equal(url.origin,"https://tp.media");
  assert.equal(url.searchParams.get("marker"),"417668");
  assert.equal(url.searchParams.get("campaign_id"),"137");
  assert.equal(url.searchParams.get("trs"),"504342");
  const supplier=new URL(url.searchParams.get("u"));
  assert.equal(supplier.host,"www.klook.com");
  assert.ok(supplier.pathname.endsWith("/destination/"+code+"/3-hotel/"),
   city+" must lead to its actual hotel category, not tours/search");
  assert.equal(supplier.searchParams.size,0);
 }
 assert.equal(hotels.destinationHotelHref("delhi"),hotels.destinationHotelHref("new-delhi"));
 assert.equal(hotels.destinationHotelHref("new-york"),hotels.destinationHotelHref("new york"));
});
test("Hotel destination cards use one resolver; Travel widget is not inside a compact form",()=>{
 const page=read("src/app/hotels/page.tsx");
 const storefront=read("src/components/hotel/HotelDiscoveryShowcase.tsx");
 const travel=read("src/components/travel/ConnectedTravelWorkspace.tsx");
 assert.ok(page.includes("href={destinationHotelHref(place.city)"));
 assert.ok(!page.includes('href={"/hotels?"+new URLSearchParams({view:"booking",city:place.city})'));
 assert.ok(storefront.includes("destinationHotelHref(place.city)"));
 assert.ok(travel.includes('<div data-gth-travel-hotel-supplier="direct"><HotelBookingExperience currency={draft.currency} directHandoff /></div>'));
 assert.ok(!travel.includes('className={styles.plan} data-gth-travel-hotel-supplier="direct"'));
});
