import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const auth = read("src/lib/travel/nuitee-test-auth.ts");
const search = read("src/app/api/hotels/nuitee/search/route.ts");
const details = read("src/app/api/hotels/nuitee/[id]/route.ts");
const rates = read("src/app/api/hotels/nuitee/rates/route.ts");
const prebook = read("src/app/api/hotels/nuitee/prebook/route.ts");
const adapter = read("src/lib/travel/nuitee-sandbox.ts");

test("all supplier test routes require server-only preview auth", () => {
  for (const route of [search, details, rates, prebook]) assert.match(route, /sandboxAuthorized\(req(?:uest)?\)/);
  assert.match(auth, /VERCEL_ENV !== "preview"/);
  assert.match(auth, /timingSafeEqual/);
  assert.match(auth, /expected\.length < 32/);
});
test("supplier keys stay server-only and sandbox-scoped", () => {
  assert.match(adapter, /NUITEE_SANDBOX_API_KEY/);
  assert.match(adapter, /sand\|sandbox/);
  assert.match(rates, /sand\|sandbox/);
  assert.match(prebook, /sand\|sandbox/);
  assert.doesNotMatch([adapter, search, details, rates].join("\n"), /NEXT_PUBLIC_NUITEE|prod_/);
});
test("no booking action or rate charging in preview routes", () => {
  // Sandbox prebook rechecks a rate; it is not a confirmed booking or payment.
  assert.doesNotMatch([search, details, rates, prebook].join("\n"), /\/rates\/book\b/);
  assert.match(prebook, /\/rates\/prebook/);
  assert.match(rates, /bookable: false/);
  assert.match(search, /Cache-Control/);
  assert.match(prebook, /bookingConfirmed: false/);
});
test("preview uses image load and failure feedback without publishing supplier media", () => {
  const page = read("src/app/hotels/nuitee-sandbox/page.tsx");
  const gallery = read("src/components/hotels/NuiteeSandboxGallery.tsx");
  assert.match(adapter, /v\.slice\(0,50\)/);
  assert.match(page, /NuiteeSandboxGallery/);
  assert.match(page, /onError=\{\(\) => setBroken\(true\)\}/);
  assert.match(gallery, /onLoad=\{\(\) => recordLoad\(active\)\}/);
  assert.match(gallery, /onError=\{\(\) => recordError\(active\)\}/);
  assert.match(gallery, /PENDING|not licensed for public use|does not verify property identity/i);
  assert.doesNotMatch(gallery, /supabase|insert\(|upsert\(|bookingConfirmed: true/);
});

test("hotel identity and empty-image safety preserved", () => {
  assert.match(adapter, /supplierHotelId: id/);
  assert.match(adapter, /images: primary/);
  assert.match(adapter, /bookable: false/);
});
