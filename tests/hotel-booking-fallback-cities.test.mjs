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
    module:mod,exports:mod.exports,URL,URLSearchParams,
    require:name=>{if(name in imports)return imports[name];throw Error("Unexpected dependency "+name);}
  },{timeout:2000});
  return mod.exports;
}
const affiliate=load("src/lib/travel/partner-search.ts");
const hotels=load("src/lib/travel/klook-hotel-search.ts",{"./partner-search":affiliate});

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
test("No invented city, arbitrary affiliate destination or fake exact hotel match",()=>{
  for(const city of ["Mumbai","Unknown","evil.example","javascript:alert(1)","constructor","__proto__","toString","東京","London",42,null])assert.equal(hotels.trackedHotelCityHref(city),null);
  const booking=read("src/components/hotel/HotelBookingExperience.tsx");
  const page=read("src/app/hotels/page.tsx");
  assert.match(booking,/LiteAPI.SearchBar.create/);
  assert.match(booking,/cityAlternativeHref/);
  assert.match(page,/Search bookable hotels/);
  assert.match(page,/Search OSM directory/);
  assert.match(page,/The independent hotel directory did not respond/);
});
