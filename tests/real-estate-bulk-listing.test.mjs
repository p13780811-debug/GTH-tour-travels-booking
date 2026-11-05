import test from "node:test";
import assert from "node:assert/strict";
import {
  BULK_MAX_RECORDS, parseDelimited, rowsFromSheet, validateBulkValues,
  enrichBulkValues, applyBulkDuplicateWarnings, csvTemplate,
} from "../src/lib/real-estate/bulk-listing.ts";
const defaults={country:"India",listing_type:"buy",currency:"INR"};
const header=["Project Name","Country","City","Location","Property Type","Listing Type","Price INR","BHK","Area Sqft"];
const item=["Riverview Residency","India","Dombivli","Palava","Apartment","buy","8500000","2","950"];
test("CSV handles quoted values and newlines without splitting records",()=>{
  const rows=parseDelimited('Project Name,Description\n"Lakeview, Phase 2","A two-bedroom\nhome"');
  assert.deepEqual(rows,[["Project Name","Description"],["Lakeview, Phase 2","A two-bedroom\nhome"]]);
});
test("malformed CSV quoting fails safely",()=>{
  assert.throws(()=>parseDelimited('a,b\n"broken,c'),/Unclosed/);
});
test("Excel/CSV headers map to existing submission fields",()=>{
  const rows=rowsFromSheet([header,item],"portfolio.xlsx",defaults);
  assert.equal(rows.length,1);
  assert.equal(rows[0].values.title,"Riverview Residency");
  assert.equal(rows[0].values.city,"Dombivli");
  assert.equal(rows[0].values.price_amount,"8500000");
  assert.equal(rows[0].values.area_value,"950");
  assert.equal(rows[0].values.currency,"INR");
  assert.equal(rows[0].missing.length,0);
});
test("supports 100 projects in a single batch and rejects 101",()=>{
  const records=Array.from({length:BULK_MAX_RECORDS},(_,i)=>[...item.slice(0,1),...item.slice(1)]);
  records.forEach((r,i)=>r[0]="Portfolio Tower "+(i+1));
  assert.equal(rowsFromSheet([header,...records],"portfolio.xlsx",defaults).length,100);
  records.push([...item]);
  assert.throws(()=>rowsFromSheet([header,...records],"too-large.xlsx",defaults),/100/);
});
test("flags missing city/address instead of assuming invented location",()=>{
  const rows=rowsFromSheet([header,["Riverview", "India","","","Apartment","buy","8500000","2","950"]],"x.csv",defaults);
  assert.ok(rows[0].missing.some(x=>x==="City"));
  assert.ok(rows[0].missing.some(x=>x.includes("address")));
  assert.equal(rows[0].selected,false);
});
test("converts lakh and crore price column headers",()=>{
  const rows=rowsFromSheet([["Project Name","Country","City","Location","Property Type","Listing Type","Price (Lakhs)","Area Sqft"],
    ["A", "India","Mumbai","Powai","Apartment","buy","85","800"]],
    "x.csv",defaults);
  assert.equal(rows[0].values.price_amount,"8500000");
  const other=rowsFromSheet([["Project Name","Country","City","Location","Property Type","Listing Type","Price Cr"],
    ["A Two", "India","Mumbai","Powai","Apartment","buy","1.2"]],"x.csv",defaults);
  assert.equal(other[0].values.price_amount,"12000000");
});
test("fills description from submitted facts only; never fabricates project names",()=>{
  const v=enrichBulkValues({city:"Mumbai",location:"Powai",property_type:"Apartment"},defaults);
  assert.equal(v.values.title,"");
  assert.equal(v.values.description,"");
});
test("flags missing or unsupported purpose and property type",()=>{
  const rows=rowsFromSheet([header,["My Tower","India","Thane","West","Unknown","investment","","",""]],
    "x.xlsx",{...defaults,listing_type:""});
  assert.ok(rows[0].missing.length>0);
});
test("duplicate rows are excluded from selected portfolio",()=>{
  const rows=rowsFromSheet([header,item,item],"x.xlsx",defaults);
  const flagged=applyBulkDuplicateWarnings(rows);
  assert.equal(flagged[0].selected,true);
  assert.equal(flagged[1].selected,false);
  assert.ok(flagged[1].missing.some(x=>x.startsWith("Duplicate")));
});
test("validates RERA formats, price, and size",()=>{
  const {values}=enrichBulkValues({
    title:"Actual Tower A",country:"India",city:"Thane",location:"West",
    property_type:"Apartment",listing_type:"buy",
    registry_reference:"P100",price_amount:"bad",area_value:"-5",
  },defaults);
  const misses=validateBulkValues(values).join(" ");
  assert.match(misses,/MahaRERA/);
  assert.match(misses,/Price/);
  assert.match(misses,/area/);
});
test("CSV template has required headings and matches parser",()=>{
  const csv=csvTemplate();
  const data=rowsFromSheet(parseDelimited(csv),"template.csv",defaults);
  assert.ok(csv.includes("Project Name"));
  assert.equal(data.length,1);
  assert.equal(data[0].missing.length,0);
});
test("100+ malformed rows cannot bypass bounded parser",()=>{
  const text="Project Name,City\n"+Array.from({length:140},(_,i)=>"P"+i+",Mumbai").join("\n");
  assert.throws(()=>parseDelimited(text),/100/);
});
