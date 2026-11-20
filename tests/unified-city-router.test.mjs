import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

/**
 * Execute the real TypeScript modules (not copied logic) under Node's test
 * runner. Their Next.js server-only marker is mocked ONLY inside this sandbox.
 * Every imported existing GTH PRO URL/validator helper is loaded from source.
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cache = new Map();
function load(file) {
  const relative = file.startsWith("src/") ? file : "src/" + file;
  const filename = resolve(root, relative);
  if (!filename.startsWith(root + "/")) throw Error("Unexpected test module path");
  if (cache.has(filename)) return cache.get(filename).exports;

  const source = readFileSync(filename, "utf8");
  const result = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      isolatedModules: true,
    },
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics ?? []).filter(d =>
    d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, filename + ": transpilation errors");

  const sandboxModule = { exports: {} };
  cache.set(filename, sandboxModule);
  const requireFrom = (requested) => {
    if (requested === "server-only") return {};
    const next = requested.startsWith("@/")
      ? resolve(root, "src", requested.slice(2))
      : requested.startsWith(".")
        ? resolve(dirname(filename), requested)
        : null;
    if (!next || !next.startsWith(resolve(root, "src") + "/")) {
      throw Error("Unexpected imported dependency: " + requested);
    }
    return load(next.replace(root + "/", "") + ".ts");
  };
  const sandbox = {
    module: sandboxModule, exports: sandboxModule.exports, require: requireFrom,
    URL, URLSearchParams, Date, AbortSignal, btoa, atob, process,
  };
  vm.runInNewContext(result.outputText, sandbox, { filename, timeout: 2500 });
  return sandboxModule.exports;
}

const cityModule = load("lib/router/cityContext.ts");
const registry = load("lib/router/providerRegistry.ts");
const router = load("lib/router/affiliateRouter.ts");
const now = new Date("2026-11-20T00:00:00Z");
const city = Object.freeze({
  id: "0c517223-315b-4800-8669-98df4e9ac6d1",
  name: "Mumbai", slug: "mumbai-in", country: "India", country_code: "IN",
  verifiedNuiteePlaceId: null,
});
// Synthetic offline test fixture only; never a real publisher click URL.
const click = "https://www.jdoqocy.com/click-123456789-987654321";

function withEnv(values, fn) {
  const before = Object.fromEntries(
    Object.keys(values).map(key => [key, process.env[key]]),
  );
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    return fn();
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function dbWith(row, error = null) {
  const calls = [];
  const query = {
    select(value) { calls.push(["select", value]); return this; },
    eq(key, value) { calls.push(["eq", key, value]); return this; },
    limit(value) { calls.push(["limit", value]); return this; },
    abortSignal(signal) { calls.push(["abortSignal", Boolean(signal)]); return this; },
    async maybeSingle() { return { data: row, error }; },
  };
  return {
    calls,
    from(table) { calls.push(["from", table]); return query; },
  };
}

test("feature flag is disabled unless exactly true", () => {
  withEnv({ ENABLE_UNIFIED_CITY_ROUTER: undefined }, () => {
    assert.equal(router.unifiedCityRouterEnabled(), false);
    const result = router.resolveAffiliateRoute({ city, service: "hotels" }, now);
    assert.equal(result.capability, "unavailable");
    assert.equal(result.reason, "disabled");
    assert.equal(result.href, null);
  });
  withEnv({ ENABLE_UNIFIED_CITY_ROUTER: "false" }, () =>
    assert.equal(router.unifiedCityRouterEnabled(), false));
  withEnv({ ENABLE_UNIFIED_CITY_ROUTER: "TRUE" }, () =>
    assert.equal(router.unifiedCityRouterEnabled(), false));
});

test("all ten HopeGoo codes are eligible and unsupported countries are excluded", () => {
  for (const code of ["CN", "HK", "MO", "TW", "JP", "KR", "SG", "TH", "MY", "VN"]) {
    assert.equal(registry.isHopeGooCountry(code), true, code);
  }
  for (const code of ["KP", "MN", "IN", "US", "", "sg", null]) {
    assert.equal(registry.isHopeGooCountry(code), false, String(code));
  }
  assert.equal(registry.PROVIDER_REGISTRY.aviasales.existingEntry, "/flights");
  assert.equal(registry.PROVIDER_REGISTRY["12go"].existingEntry, "/go/transport");
  assert.equal(registry.PROVIDER_REGISTRY.nuitee.existingEntry, "/hotels?view=booking");
});

test("exact outbound host, https, URL and CJ click-path guards", () => {
  assert.equal(registry.isSafeProviderOutboundUrl("hopegoo", click), true);
  for (const raw of [
    click.replace("https:", "http:"),
    click.replace("www.jdoqocy.com", "www.jdoqocy.com.evil.test"),
    "https://user:secret@www.jdoqocy.com/click-123456789-987654321",
    "https://www.jdoqocy.com:444/click-123456789-987654321",
    click + "?redirect=https%3A%2F%2Fevil.test",
    "https://www.jdoqocy.com/click-not-an-approved-id",
    "//www.jdoqocy.com/click-123456789-987654321",
    "javascript:alert(1)",
    "https://www.jdoqocy.com\\@evil.test/click-123456789-987654321",
  ]) {
    assert.equal(registry.isSafeProviderOutboundUrl("hopegoo", raw), false, raw);
  }
  assert.equal(registry.isSafeProviderOutboundUrl("nuitee",
    "https://hotel.gthproglobal.com/hotels?placeId=ChIJwe1EZjDG5zsRaYxkjY_tpF0"), true);
  assert.equal(registry.isSafeProviderOutboundUrl("nuitee",
    "https://hotel.gthproglobal.com.attacker.test/hotels"), false);
});

test("tracked Klook links reject nested off-site and open-redirect targets", () => {
  const safe = "https://tp.media/r?marker=417668&u=" +
    encodeURIComponent("https://www.klook.com/en-IN/search/result/?query=Goa");
  const bad = "https://tp.media/r?marker=417668&u=" +
    encodeURIComponent("https://evil.example/redirect");
  const nestedRedirect = "https://tp.media/r?u=" +
    encodeURIComponent("https://www.klook.com/search/?redirect=https://evil.example");
  assert.equal(registry.isSafeProviderOutboundUrl("klook", safe), true);
  assert.equal(registry.isSafeProviderOutboundUrl("klook", bad), false);
  assert.equal(registry.isSafeProviderOutboundUrl("klook", nestedRedirect), false);
  assert.equal(registry.isSafeProviderOutboundUrl("klook", "https://tp.media/anything"), false);
});

test("internal redirect guards reject protocol-relative and encoded slash", () => {
  assert.equal(registry.isSafeInternalEntry("/hotels?view=booking&city=Mumbai"), true);
  for (const value of [
    "//evil.test", "https://evil.test", "/%2f%2fevil.test",
    "/cars#unexpected", "/\\evil.test", "/ferry%5csecret",
  ]) {
    assert.equal(registry.isSafeInternalEntry(value), false, value);
  }
});

test("read-only city context resolves the exact UUID and required fields", async () => {
  const row = {
    id: city.id, name: city.name, slug: city.slug, country: city.country,
    country_code: city.country_code, nuitee_place_id: null,
  };
  const db = dbWith(row);
  const resolved = await cityModule.resolveCityContext(db, { id: city.id, country_code: "in" });
  assert.equal(resolved.status, "found");
  assert.equal(resolved.city.id, city.id);
  assert.equal(resolved.city.country_code, "IN");
  assert.equal(resolved.city.verifiedNuiteePlaceId, null);
  assert.equal(db.calls[0][0], "from");
  assert.equal(db.calls[0][1], "destinations");
  assert.ok(db.calls.some(c => c[0] === "eq" && c[1] === "is_active" && c[2] === true));
  assert.ok(db.calls.some(c => c[0] === "eq" && c[1] === "id" && c[2] === city.id));
  assert.ok(db.calls.some(c => c[0] === "eq" && c[1] === "country_code" && c[2] === "IN"));
  assert.ok(!db.calls.some(c => ["insert", "update", "upsert", "delete"].includes(c[0])));
});

test("city validation fails closed for injection, ambiguity and errors", async () => {
  const db = dbWith(null);
  for (const input of [
    { slug: "london?redirect=evil.test" },
    { slug: "../mumbai" },
    { slug: "mumbai-in", id: city.id },
    { id: "not-a-uuid" },
    { slug: "mumbai-in", country_code: "USA" },
    {},
  ]) {
    assert.equal((await cityModule.resolveCityContext(db, input)).status, "invalid");
  }
  assert.equal((await cityModule.resolveCityContext(db, { slug: "mumbai-in" })).status, "not_found");
  const errored = dbWith(null, { code: "network_unavailable" });
  assert.equal((await cityModule.resolveCityContext(errored, { id: city.id })).status, "unavailable");
  const mismatched = dbWith({ ...city, nuitee_place_id: null, country_code: "GB" });
  assert.equal((await cityModule.resolveCityContext(mismatched, {
    id: city.id, country_code: "IN",
  })).status, "unavailable");
});

test("travel params validate dates, occupants, currencies and unknown query keys", () => {
  const good = cityModule.parseTravelQuery(new URLSearchParams({
    checkin: "2026-11-23", checkout: "2026-11-26",
    adults: "2", children: "4,7", currency: "usd",
  }), now);
  assert.equal(good.ok, true);
  assert.equal(good.value.checkin, "2026-11-23");
  assert.equal(good.value.checkout, "2026-11-26");
  assert.equal(good.value.currency, "USD");
  assert.equal(good.value.children.join(","), "4,7");
  assert.equal(cityModule.parseTravelQuery({}, now).ok, true);
  for (const raw of [
    { checkin: "2026-11-23" },
    { checkin: "2026-11-23", checkout: "2026-11-23" },
    { checkin: "2026-02-29", checkout: "2026-03-01" },
    { checkin: "2026-11-19", checkout: "2026-11-20" },
    { checkin: "2026-11-23", checkout: "2027-03-23" },
    { adults: "0" }, { adults: "21" }, { adults: "2.5" },
    { children: "5,18" }, { children: "0,1,2,3,4,5,6,7,8" },
    { currency: "XYZ" }, { currency: "<script>" },
    { returnUrl: "https://evil.test" }, { children: "1, bad" },
    new URLSearchParams("adults=2&adults=3"),
  ]) {
    assert.equal(cityModule.parseTravelQuery(raw, now).ok, false, JSON.stringify(raw));
  }
});

test("HopeGoo regional routing uses only configured allowlisted URL", () => {
  withEnv({
    ENABLE_UNIFIED_CITY_ROUTER: "true",
    GTH_HOPEGOO_AFFILIATE_URL: click,
  }, () => {
    for (const country_code of ["SG", "TH", "MY", "VN", "JP", "KR", "CN", "HK", "MO", "TW"]) {
      const routed = router.resolveAffiliateRoute({
        city: { ...city, country_code },
        service: "hotels",
      }, now);
      assert.equal(routed.provider, "hopegoo");
      assert.equal(routed.capability, "supplier_search");
      assert.equal(routed.href, click);
    }
    const india = router.resolveAffiliateRoute({ city, service: "hotels" }, now);
    assert.equal(india.provider, "nuitee");
    assert.equal(india.capability, "supplier_search");
    assert.ok(india.href.startsWith("https://hotel.gthproglobal.com/"));
  });
});

test("missing or malicious HopeGoo configuration never creates a guessed URL", () => {
  withEnv({
    ENABLE_UNIFIED_CITY_ROUTER: "true",
    GTH_HOPEGOO_AFFILIATE_URL: "https://www.jdoqocy.com.evil.example/click-123456789-987654321",
  }, () => {
    const result = router.resolveAffiliateRoute({
      city: { ...city, country_code: "SG" }, service: "hotels",
    }, now);
    assert.equal(result.provider, "nuitee");
    assert.equal(result.capability, "supplier_search");
    assert.ok(result.href.startsWith("https://hotel.gthproglobal.com/"));
  });
});

test("verified Nuitee Place ID plus dates is required for verified deep link", () => {
  withEnv({ ENABLE_UNIFIED_CITY_ROUTER: "true" }, () => {
    const params = { checkin: "2026-11-24", checkout: "2026-11-25", adults: "2" };
    const noId = router.resolveAffiliateRoute({ city, service: "hotels", travelParams: params }, now);
    assert.equal(noId.capability, "supplier_search");
    assert.equal(new URL(noId.href).pathname, "/");
    assert.equal(new URL(noId.href).searchParams.has("placeId"), false);

    const verified = router.resolveAffiliateRoute({
      city: { ...city, verifiedNuiteePlaceId: "ChIJwe1EZjDG5zsRaYxkjY_tpF0" },
      service: "hotels", travelParams: params,
    }, now);
    assert.equal(verified.capability, "verified_deep_link");
    assert.equal(verified.reason, "verified_supplier_identity");
    assert.equal(new URL(verified.href).searchParams.get("placeId"),
      "ChIJwe1EZjDG5zsRaYxkjY_tpF0");

    const missingDates = router.resolveAffiliateRoute({
      city: { ...city, verifiedNuiteePlaceId: "ChIJwe1EZjDG5zsRaYxkjY_tpF0" },
      service: "hotels",
    }, now);
    assert.equal(missingDates.capability, "supplier_search");
    assert.equal(missingDates.href.includes("placeId"), false);
  });
});

test("Klook uses existing validated search; flight, ground and tickets remain untouched", () => {
  withEnv({ ENABLE_UNIFIED_CITY_ROUTER: "true" }, () => {
    const tours = router.resolveAffiliateRoute({ city, service: "tours" }, now);
    assert.equal(tours.provider, "klook");
    assert.equal(tours.capability, "supplier_search");
    assert.ok(tours.href.startsWith("/api/travel/partner-search?"));
    const flights = router.resolveAffiliateRoute({ city, service: "flights" }, now);
    assert.equal(flights.capability, "internal_discovery");
    assert.ok(flights.href.startsWith("/flights?destinationCity="));
    const ground = router.resolveAffiliateRoute({ city, service: "train" }, now);
    assert.equal(ground.provider, "12go");
    assert.equal(ground.capability, "internal_discovery");
    assert.equal(ground.href, "/train");
    const tickets = router.resolveAffiliateRoute({ city, service: "tickets" }, now);
    assert.equal(tickets.capability, "internal_discovery");
    assert.ok(tickets.href.startsWith("/tickets?q="));
    const invalid = router.resolveAffiliateRoute({
      city, service: "hotels", provider: "qeeq",
    }, now);
    assert.equal(invalid.capability, "unavailable");
    assert.equal(invalid.reason, "unsupported_service");
    const dangerous = router.resolveAffiliateRoute({
      city, service: "hotels", travelParams: { checkin: "2026-11-23", checkout: "BAD" },
    }, now);
    assert.equal(dangerous.capability, "unavailable");
    assert.equal(dangerous.reason, "invalid_query");
  });
});

test("Step 1 remains isolated from protected UI, widgets, CSS and all database writes", () => {
  const protectedFiles = [
    "src/components/hotel/NuiteeHotelsListWidget.tsx",
    "src/components/flights/AviasalesWhiteLabel.tsx",
    "src/components/travel/GTHTransportSearchWidget.tsx",
    "src/app/hotels/page.tsx",
    "src/app/flights/page.tsx",
    "src/app/go/transport/search/route.ts",
    "src/lib/travel/hotel-whitelabel.ts",
  ];
  for (const p of protectedFiles) {
    assert.doesNotMatch(readFileSync(join(root, p), "utf8"),
      /router\/affiliateRouter|ENABLE_UNIFIED_CITY_ROUTER/);
  }
  for (const file of ["cityContext", "providerRegistry", "affiliateRouter"]) {
    const source = readFileSync(join(root, "src/lib/router", file + ".ts"), "utf8");
    assert.match(source, /import "server-only"/);
    assert.doesNotMatch(source, /\.insert\(|\.upsert\(|\.update\(|\.delete\(|create table|alter table|service_role/iu);
  }
  assert.match(readFileSync(join(root, ".env.example"), "utf8"),
    /^ENABLE_UNIFIED_CITY_ROUTER=false$/m);
});
