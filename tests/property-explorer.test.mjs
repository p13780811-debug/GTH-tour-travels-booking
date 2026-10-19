import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';
function readModule(path) {
 const exports = {};
 new Function('exports', ts.transpileModule(fs.readFileSync(path,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exports);
 return exports;
}
const {coverage,compareSelection,recordedNumber} = readModule('src/lib/real-estate/explorer.ts');
const {normalizeSearchQuery,normalizeSearches} = readModule('src/lib/real-estate/saved-searches.ts');
const fixture = {id:1,slug:'record-one',title:'Project one',rera_id:'P51800000001',city:'Mumbai',registry_only:true,official_source_url:'https://maharera.maharashtra.gov.in/projects-search-result'};
test('registry-only coverage counts source facts without inventing verification or inventory',()=>{
 assert.equal(coverage(fixture).score,60);
 const missing=coverage({...fixture,city:'City not provided',official_source_url:'',rera_id:''});
 assert.equal(missing.score,0);
 assert.equal(coverage({...fixture,verified:true}).score,60);
 assert.equal(coverage({...fixture,verified:true,last_verified_at:'2026-10-18'}).score,70);
});
test('legacy placeholder dimensions never add specification coverage',()=>{
 assert.equal(coverage({...fixture,beds:1,sqft:650,data_quality_limited:true}).score,60);
 assert.equal(coverage({...fixture,beds:2,sqft:800}).score,75);
 assert.equal(recordedNumber(null),'Not recorded');
 assert.equal(recordedNumber(-1),'Not recorded');
});
test('comparison respects the three-property limit and supports removal',()=>{
 const a=fixture,b={...fixture,slug:'record-two'},c={...fixture,slug:'record-three'},d={...fixture,slug:'record-four'};
 const selected=compareSelection(compareSelection([a],b),c);
 assert.equal(selected.length,3); assert.deepEqual(compareSelection(selected,d),selected);
 assert.deepEqual(compareSelection(selected,b).map(p=>p.slug),['record-one','record-three']);
 assert.equal(selected.length,3);
});
test('saved searches retain currency, numeric budget and price sorting',()=>{
 const query=normalizeSearchQuery('?city=Mumbai&currency=INR&minPrice=5000000&maxPrice=20000000&sort=price_low&page=4');
 const p=new URLSearchParams(query);
 assert.equal(p.get('currency'),'INR'); assert.equal(p.get('minPrice'),'5000000'); assert.equal(p.get('maxPrice'),'20000000'); assert.equal(p.get('sort'),'price_low'); assert.equal(p.has('page'),false);
 assert.match(normalizeSearches([{query}])[0].label,/INR 5000000–20000000/);
 const invalid=new URLSearchParams(normalizeSearchQuery('?currency=BOGUS&minPrice=-10&maxPrice=Infinity&sort=arbitrary'));
 assert.equal(invalid.size,0);
});
