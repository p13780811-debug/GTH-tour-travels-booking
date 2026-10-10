import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';
const exports = {};
new Function('exports', ts.transpileModule(fs.readFileSync('src/lib/real-estate/map-data.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exports);
test('map coordinates accept equator and southern/western points but reject invalid values',()=>{
 assert.equal(exports.validMapCoordinates(0,0),true);
 assert.equal(exports.validMapCoordinates(-33.9,-70.6),true);
 for(const pair of [[91,0],[0,181],[NaN,1],[1,Infinity],['19',72],[null,0]]) assert.equal(exports.validMapCoordinates(...pair),false);
});
test('map price labels preserve supplied currency and never invent rupees or zero prices',()=>{
 assert.equal(exports.mapPriceLabel({formatted_price:'USD 250,000',price:250000}),'USD 250,000');
 assert.equal(exports.mapPriceLabel({price:'₹ 1.2 Cr'}),'₹ 1.2 Cr');
 for(const value of [null,0,NaN,-1,undefined]) assert.equal(exports.mapPriceLabel({price:value}),'Price on request');
});
