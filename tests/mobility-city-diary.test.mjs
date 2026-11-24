import test from "node:test";
import assert from "node:assert/strict";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";

const currency=loadTenderTs("src/lib/mobility/currencies.ts");
const cities=loadTenderTs("src/lib/mobility/city.ts",{"./currencies":currency},{Intl,URLSearchParams});
const {transitOptions}=loadTenderTs("src/lib/mobility/transit.ts",{}, {URLSearchParams});
const diary=loadTenderTs("src/lib/mobility/diary.ts");

test("driver defaults follow city country, and CNG uses its actual billing unit",()=>{
  const expected={Mumbai:["INR","km","L","kg"],Kolkata:["INR","km","L","kg"],Delhi:["INR","km","L","kg"],
    Bengaluru:["INR","km","L","kg"],Dubai:["AED","km","L","kg"],London:["GBP","mi","L","kg"],"New York":["USD","mi","US gal","GGE"]};
  for(const city of cities.MOBILITY_CITIES){
    assert.deepEqual([cities.currencyForCity(city),cities.distanceUnit(city),cities.fuelUnit(city,"diesel"),cities.fuelUnit(city,"cng")],expected[city.name]);
  }
  assert.equal(cities.currencyForCity({countryCode:"JP"}),"JPY");
  assert.equal(cities.currencyForCity({countryCode:"NL"}),"EUR");
  assert.equal(cities.currencyForCity({countryCode:""}),"");
});

test("official sources are scoped to the matched city and country",()=>{
  const london=cities.MOBILITY_CITIES.find(city=>city.name==="London");
  assert.equal(transitOptions(london).every(x=>x.kind==="official"),true);
  const ontario=transitOptions({...london,countryCode:"CA",country:"Canada"});
  assert.equal(ontario.every(x=>x.kind==="map"),true);
  assert.equal(new URL(ontario[0].href).searchParams.get("query"),"railway station, London, Canada");
  assert.equal(transitOptions(cities.MOBILITY_CITIES[0]).length,4);
  assert.equal(cities.mobilityCity({name:"<script>",slug:"city",country:"India",countryCode:"IN"}),null);
});

test("shift calculation and local diary edits preserve city, date and currency",()=>{
  const shift={cityKey:"IN:mumbai",date:"2026-11-24",currency:"INR",fuel:"cng",unit:"kg",distanceUnit:"km",
    revenue:1500,distance:140,efficiency:20,fuelPrice:80,other:200};
  assert.equal(diary.validShift(shift),true);
  assert.deepEqual({...diary.shiftTotals(shift)},{fuelUsed:7,fuelCost:560,net:740});
  assert.equal(diary.validShift({...shift,efficiency:0}),false);
  assert.equal(diary.validShift({...shift,date:"2026-02-30"}),false);
  const rows=diary.upsertShift([shift,{...shift,cityKey:"GB:london",currency:"GBP"}],{...shift,revenue:1800});
  assert.equal(rows.length,2);
  assert.equal(rows.find(row=>row.cityKey==="GB:london").currency,"GBP");
  assert.equal(rows.find(row=>row.cityKey==="IN:mumbai").revenue,1800);
  assert.equal(diary.readShifts("[{},null]").length,0);
});
