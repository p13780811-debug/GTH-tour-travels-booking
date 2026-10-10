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
test('stored text prices retain their units and empty prices are not advertised as zero', () => {
  assert.equal(exports.transformProperty({ price: '₹ 1.2 Cr' }).formatted_price, '₹ 1.2 Cr');
  assert.equal(exports.transformProperty({ price: 'On request' }).formatted_price, 'On request');
  assert.equal(exports.transformProperty({ price: null }).formatted_price, 'Price on request');
});
test('text price cannot be compared lexicographically as a numeric budget', async () => {
  await assert.rejects(exports.PropertyService.getAll({ minPrice: 50 }), /Budget filtering requires normalized price data/);
});
test('public projection excludes raw ingestion payload and owner email', () => {
 assert.equal(exports.PUBLIC_PROPERTY_FIELDS.split(',').includes('raw_json'), false);
 assert.equal(exports.PUBLIC_PROPERTY_FIELDS.split(',').includes('created_by'), false);
 assert.ok(exports.PUBLIC_PROPERTY_FIELDS.split(',').includes('rera_id'));
});
test('unknown geography and purpose are not invented', () => {
 const p = exports.transformProperty({ title: 'Registry project' });
 assert.equal(p.country, 'Country not provided');
 assert.equal(p.listing_type, 'Purpose not provided');
});
