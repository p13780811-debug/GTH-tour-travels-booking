import assert from "node:assert/strict";
import { test } from "node:test";
import { extractListingIntake, INTAKE_MAX_CHARS } from "../src/lib/real-estate/listing-intake.ts";

test("short Mumbai broker note populates supported fields accurately", () => {
  const draft=extractListingIntake("2 bhk flat 950 sqft carpet Palava Dombivli 85 lakh ready to move for sale");
  assert.equal(draft.fields.property_type,"Apartment");
  assert.equal(draft.fields.bedrooms,"2");
  assert.equal(draft.fields.area_value,"950");
  assert.equal(draft.fields.area_unit,"sqft");
  assert.equal(draft.fields.area_basis,"carpet");
  assert.equal(draft.fields.price_amount,"8500000");
  assert.equal(draft.fields.currency,"INR");
  assert.equal(draft.fields.location,"Palava");
  assert.equal(draft.fields.city,"Dombivli");
  assert.equal(draft.fields.listing_type,"buy");
  assert.equal(draft.fields.possession_status,"ready_to_move");
});

test("missing prices and project references are never fabricated",()=>{
  const draft=extractListingIntake("Beautiful penthouse with balcony");
  assert.equal(draft.fields.property_type,"Penthouse");
  assert.equal(draft.fields.price_amount,undefined);
  assert.equal(draft.fields.registry_reference,undefined);
  assert.equal(draft.fields.title,undefined);
  assert.ok(draft.missing.includes("City"));
});

test("international rent, currency, and country are safely extracted",()=>{
  const draft=extractListingIntake("Villa for rent in Dubai AED 200000 3 bedrooms 2 bathrooms");
  assert.equal(draft.fields.listing_type,"rent");
  assert.equal(draft.fields.currency,"AED");
  assert.equal(draft.fields.price_amount,"200000");
  assert.equal(draft.fields.country,"United Arab Emirates");
  assert.equal(draft.fields.bedrooms,"3");
  assert.equal(draft.fields.bathrooms,"2");
});

test("only explicitly provided RERA numbers are suggested",()=>{
  const draft=extractListingIntake("Plot in Thane P51800000000 for sale 1 crore");
  assert.equal(draft.fields.registry_reference,"P51800000000");
  assert.match(draft.fields.description,/administrator review/i);
});

test("sqm is retained; conversion belongs to existing submission validation",()=>{
  const draft=extractListingIntake("1 BHK apartment in Mumbai 70 sqm carpet selling at Rs 85 lakhs");
  assert.equal(draft.fields.area_unit,"sqm");
  assert.equal(draft.fields.area_value,"70");
  assert.equal(draft.fields.price_amount,"8500000");
});

test("overlong and empty inputs cannot create a listing draft",()=>{
  assert.throws(()=>extractListingIntake("short"),/Describe/);
  assert.throws(()=>extractListingIntake("a".repeat(INTAKE_MAX_CHARS+1)),/Describe/);
});

test("review-first design and missing required details are signaled",()=>{
  const draft=extractListingIntake("Commercial office in Navi Mumbai for rent");
  assert.ok(draft.review.length>0);
  assert.ok(draft.missing.includes("Address or locality")===false);
  assert.ok(draft.missing.includes("Your relationship to this property (select manually)"));
});
