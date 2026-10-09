import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';
const exports = {};
const source = ts.transpileModule(fs.readFileSync('src/lib/real-estate/propertyService.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
new Function('exports', 'require', source)(exports, () => ({ supabase: {} }));
test('database bedroom and area names map to listing fields without invented details', () => {
  const p = exports.transformProperty({ id: 1, title: 'Actual listing', bedrooms: 2, bathrooms: 1, area_sqft: 750, status: 'review' });
  assert.equal(p.beds, 2); assert.equal(p.baths, 1); assert.equal(p.sqft, 750);
  assert.equal(p.verified, false); assert.equal(p.lat, undefined); assert.equal(p.lng, undefined);
  assert.deepEqual(p.amenities, []); assert.doesNotMatch(p.description, /AI verified|1800|3 BHK/);
});
test('southern and western coordinates are preserved and invalid coordinates omitted', () => {
  const p = exports.transformProperty({ lat: -33.9, lng: -70.6, status: 'verified' });
  assert.equal(p.lat, -33.9); assert.equal(p.lng, -70.6); assert.equal(p.verified, true);
  assert.equal(exports.transformProperty({ lat: 91, lng: 181 }).lat, undefined);
});
