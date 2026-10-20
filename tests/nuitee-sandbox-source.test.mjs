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
  assert.match(adapter, /sand_\[A-Za-z0-9_-\]/);
  assert.doesNotMatch([adapter, search, details, rates].join("\n"), /NEXT_PUBLIC_NUITEE|prod_/);
});
test("no booking action or rate charging in preview routes", () => {
  assert.doesNotMatch([search, details, rates, prebook].join("\n"), /rates\/book|rates\/prebook/);
  assert.match(rates, /bookable: false/);
  assert.match(search, /Cache-Control/);
  assert.match(prebook, /bookingConfirmed: false/);
});
test("hotel identity and empty-image safety preserved", () => {
  assert.match(adapter, /supplierHotelId: id/);
  assert.match(adapter, /images: primary/);
  assert.match(adapter, /bookable: false/);
});
