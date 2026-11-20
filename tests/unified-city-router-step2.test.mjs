import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cache = new Map();

/** Actual TS source loaded via the same sandbox strategy as Step 1 tests. */
function load(path) {
  const filename = resolve(root, path.startsWith("src/") ? path : "src/" + path);
  if (!filename.startsWith(root + "/src/")) throw Error("Invalid test import");
  if (cache.has(filename)) return cache.get(filename).exports;
  const transpiled = ts.transpileModule(readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  });
  assert.equal((transpiled.diagnostics ?? []).filter(d => d.category === 1).length, 0);
  const sandboxModule = { exports: {} };
  cache.set(filename, sandboxModule);
  const requireFrom = requested => {
    if (requested === "server-only") return {};
    const next = requested.startsWith("@/") ? resolve(root, "src", requested.slice(2))
      : requested.startsWith(".") ? resolve(dirname(filename), requested) : null;
    if (!next || !next.startsWith(root + "/src/")) {
      throw Error("Unexpected Step 2 import " + requested);
    }
    return load(next.slice(root.length + 1) + ".ts");
  };
  vm.runInNewContext(transpiled.outputText, {
    module: sandboxModule, exports: sandboxModule.exports, require: requireFrom,
    URL, URLSearchParams, Date, AbortSignal, Headers, btoa, atob, process,
    decodeURIComponent, encodeURIComponent,
  }, { filename, timeout: 3500 });
  return sandboxModule.exports;
}

const cities = load("lib/router/cityContext.ts");
const geo = load("lib/router/edgeGeoAutoDetect.ts");
const router = load("lib/router/affiliateRouter.ts");
const date = new Date("2026-11-20T00:00:00Z");

const FIXTURES = [
  ["Mumbai", "IN", "mumbai-in", "India"],
  ["Kolkata", "IN", "kolkata-in", "India"],
  ["Goa", null, "goa", "India"],
  ["Dubai", "AE", "dubai-ae", "United Arab Emirates"],
  ["London", "GB", "london-gb", "United Kingdom"],
  ["Paris", "FR", "paris-fr", "France"],
  ["Singapore", "SG", "singapore-sg", "Singapore"],
  ["Tokyo", "JP", "tokyo-jp", "Japan"],
  ["Bangkok", "TH", "bangkok-th", "Thailand"],
];

const all = new Map();
const byId = "ad787189-e244-4e99-b57b-9615fb87e1d1";
function dbReader(record, error = null) {
  const actions = [];
  const query = {
    select(fields) { actions.push(["select", fields]); return this; },
    eq(field, value) { actions.push(["eq", field, value]); return this; },
    limit(count) { actions.push(["limit", count]); return this; },
    abortSignal(signal) { actions.push(["abortSignal", Boolean(signal)]); return this; },
    async maybeSingle() { return { data: record, error }; },
  };
  return { actions, from(table) { actions.push(["from", table]); return query; } };
}

async function trustedCity(name, code, slug, country, placeId = null) {
  const record = {
    id: "ad787189-e244-4e99-b57b-" + String(
      FIXTURES.findIndex(item => item[0] === name) + 1
    ).padStart(12, "0"), name, slug, country, country_code: code,
    nuitee_place_id: placeId, is_active: true,
  };
  const found = await cities.resolveCityContext(dbReader(record), { slug });
  assert.equal(found.status, "found", name);
  return found.city;
}
for (const [name, code, slug, country] of FIXTURES) {
  all.set(name, await trustedCity(name, code, slug, country));
}

async function withEnv(values, cb) {
  const old = Object.fromEntries(Object.keys(values).map(k => [k, process.env[k]]));
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    return await cb();
  } finally {
    for (const [key, value] of Object.entries(old)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("nine global city contexts are validated but never imply a live offer", async () => {
  await withEnv({ ENABLE_UNIFIED_CITY_ROUTER: "true", GTH_HOPEGOO_AFFILIATE_URL: undefined }, () => {
    for (const [name] of FIXTURES) {
      const city = all.get(name);
      const hotel = router.resolveAffiliateRoute({ city, service: "hotels" }, date);
      assert.equal(hotel.capability, "supplier_search", name);
      assert.equal(hotel.provider, "nuitee", name);
      assert.equal(new URL(hotel.href).hostname, "hotel.gthproglobal.com");
      assert.equal(new URL(hotel.href).searchParams.has("placeId"), false);
      const flight = router.resolveAffiliateRoute({ city, service: "flights" }, date);
      assert.equal(flight.capability, "internal_discovery", name);
      assert.ok(flight.href.startsWith("/flights?"), name);
      const train = router.resolveAffiliateRoute({ city, service: "train" }, date);
      assert.equal(train.capability, "internal_discovery", name);
      assert.equal(train.href, "/train");
    }
  });
});

test("HopeGoo country list, public alias and explicit server-side override", async () => {
  const click = "https://www.jdoqocy.com/click-123456789-987654321";
  await withEnv({
    ENABLE_UNIFIED_CITY_ROUTER: "true",
    NEXT_PUBLIC_HOPEGOO_AFFILIATE_URL: click,
    GTH_HOPEGOO_AFFILIATE_URL: undefined,
  }, () => {
    for (const name of ["Singapore", "Tokyo", "Bangkok"]) {
      const res = router.resolveAffiliateRoute({ city: all.get(name), service: "hotels" }, date);
      assert.equal(res.provider, "hopegoo", name);
      assert.equal(res.capability, "supplier_search");
      assert.equal(res.href, click);
      assert.equal(res.searchIntentForwarded, false);
    }
    assert.equal(router.resolveAffiliateRoute({
      city: all.get("Mumbai"), service: "hotels",
    }, date).provider, "nuitee");
  });
  await withEnv({
    ENABLE_UNIFIED_CITY_ROUTER: "true",
    GTH_HOPEGOO_AFFILIATE_URL: "https://www.jdoqocy.com.evil.test/click-123456789-987654321",
    NEXT_PUBLIC_HOPEGOO_AFFILIATE_URL: click,
  }, () => {
    const res = router.resolveAffiliateRoute({ city: all.get("Tokyo"), service: "hotels" }, date);
    assert.equal(res.provider, "nuitee");
    assert.equal(res.capability, "supplier_search");
  });
});

test("Nuitee stays preserve dates, guests, child ages and currency without fake Place IDs", async () => {
  await withEnv({ ENABLE_UNIFIED_CITY_ROUTER: "true" }, () => {
    for (const name of ["Mumbai", "Kolkata", "Dubai", "London", "Paris", "Goa"]) {
      const result = router.resolveAffiliateRoute({
        city: all.get(name), service: "hotels",
        travelParams: {
          checkin: "2026-11-24", checkout: "2026-11-27",
          adults: "2", children: "5,7", currency: "USD",
        },
      }, date);
      assert.equal(result.capability, "supplier_search", name);
      const url = new URL(result.href);
      assert.equal(url.pathname, "/");
      assert.equal(url.searchParams.get("checkin"), "2026-11-24");
      assert.equal(url.searchParams.get("checkout"), "2026-11-27");
      assert.equal(url.searchParams.get("currency"), "USD");
      assert.equal(url.searchParams.has("placeId"), false);
      const occupancy = JSON.parse(atob(url.searchParams.get("occupancies")));
      assert.equal(occupancy[0].adults, 2);
      assert.equal(occupancy[0].children.join(","), "5,7");
      assert.equal(result.searchIntentForwarded, true);
    }
  });
});

test("verified Nuitee IDs alone may produce deep links; missing dates cannot", async () => {
  const verified = await trustedCity("London", "GB", "london-gb", "United Kingdom",
    "ChIJdd4hrwug2EcRmSrV3Vo6llI");
  await withEnv({ ENABLE_UNIFIED_CITY_ROUTER: "true" }, () => {
    const v = router.resolveAffiliateRoute({
      city: verified, service: "hotels", travelParams: {
        checkin: "2026-12-01", checkout: "2026-12-03", adults: "3",
      },
    }, date);
    assert.equal(v.capability, "verified_deep_link");
    assert.equal(new URL(v.href).searchParams.get("placeId"), verified.verifiedNuiteePlaceId);
    const withoutDate = router.resolveAffiliateRoute({ city: verified, service: "hotels" }, date);
    assert.equal(withoutDate.capability, "supplier_search");
    assert.equal(new URL(withoutDate.href).searchParams.has("placeId"), false);
    const forged = router.resolveAffiliateRoute({
      city: { ...verified, verifiedNuiteePlaceId: "ChIJfake12345" },
      service: "hotels", travelParams: {
        checkin: "2026-12-01", checkout: "2026-12-03",
      },
    }, date);
    assert.equal(forged.capability, "unavailable");
    assert.equal(forged.reason, "invalid_context");
  });
});

test("Travel adapters fail closed for invalid dates, unknown params and wrong provider", async () => {
  await withEnv({ ENABLE_UNIFIED_CITY_ROUTER: "true" }, () => {
    const city = all.get("Mumbai");
    for (const bad of [
      { checkin: "2026-11-19", checkout: "2026-11-22" },
      { checkin: "2026-11-24", checkout: "2026-11-24" },
      { checkout: "2026-11-24" },
      { adults: "-1" },
      { currency: "XXX" },
      { returnUrl: "https://evil.test" },
    ]) {
      const result = router.resolveAffiliateRoute({ city, service: "hotels", travelParams: bad }, date);
      assert.equal(result.capability, "unavailable");
      assert.equal(result.reason, "invalid_query");
    }
    const unsupported = router.resolveAffiliateRoute({ city, service: "hotels", provider: "qeeq" }, date);
    assert.equal(unsupported.capability, "unavailable");
  });
});

test("Aviasales WL remains the only flight widget; route inputs never invent IATA", async () => {
  await withEnv({ ENABLE_UNIFIED_CITY_ROUTER: "true" }, () => {
    const route = {
      originIata: "DEL", destinationIata: "BOM",
      departDate: "2026-12-03",
    };
    const mumbai = router.resolveAffiliateRoute({
      city: all.get("Mumbai"), service: "flights", flightRoute: route,
    }, date);
    assert.equal(mumbai.capability, "internal_discovery");
    assert.ok(mumbai.href.startsWith("/flights?"));
    assert.ok(!mumbai.href.startsWith("https://"));
    assert.equal(mumbai.searchIntentForwarded, false);
    const wrong = router.resolveAffiliateRoute({
      city: all.get("London"), service: "flights", flightRoute: route,
    }, date);
    assert.equal(wrong.reason, "missing_route");
    const invalid = router.resolveAffiliateRoute({
      city: all.get("Mumbai"), service: "flights",
      flightRoute: { ...route, destinationIata: "B0M" },
    }, date);
    assert.equal(invalid.capability, "unavailable");
    const past = router.resolveAffiliateRoute({
      city: all.get("Mumbai"), service: "flights",
      flightRoute: { ...route, departDate: "2026-01-01" },
    }, date);
    assert.equal(past.capability, "unavailable");
  });
  const source = readFileSync(resolve(root, "src/components/flights/AviasalesWhiteLabel.tsx"), "utf8");
  assert.match(source, /WL_ID\s*=\s*23459/);
  assert.doesNotMatch(source, /router\/affiliateRouter/);
});

test("12Go route handoff reuses existing route; Bookaway remains curated-only", async () => {
  await withEnv({ ENABLE_UNIFIED_CITY_ROUTER: "true" }, () => {
    const originCity = all.get("Mumbai");
    const dest = all.get("Kolkata");
    const travel = { originCity, date: "2026-12-09", passengers: 2 };
    const r = router.resolveAffiliateRoute({
      city: dest, service: "train", provider: "12go", groundRoute: travel,
    }, date);
    assert.equal(r.capability, "supplier_search");
    const url = new URL(r.href, "https://gthproglobal.com");
    assert.equal(url.pathname, "/go/transport/search");
    assert.equal(url.searchParams.get("mode"), "train");
    assert.equal(url.searchParams.get("from"), "Mumbai");
    assert.equal(url.searchParams.get("to"), "Kolkata");
    assert.equal(url.searchParams.get("date"), "2026-12-09");
    assert.equal(r.searchIntentForwarded, true);
    const bookaway = router.resolveAffiliateRoute({
      city: dest, service: "train", provider: "bookaway", groundRoute: travel,
    }, date);
    assert.equal(bookaway.capability, "internal_discovery");
    const forged = router.resolveAffiliateRoute({
      city: dest, service: "train", groundRoute: {
        ...travel, originCity: { ...originCity },
      },
    }, date);
    assert.equal(forged.capability, "unavailable");
    const wrongDate = router.resolveAffiliateRoute({
      city: dest, service: "train", groundRoute: {
        ...travel, date: "2025-01-01",
      },
    }, date);
    assert.equal(wrongDate.capability, "unavailable");
  });
});

test("transfer adapters and approved tours produce no fabricated product URLs", async () => {
  await withEnv({ ENABLE_UNIFIED_CITY_ROUTER: "true" }, () => {
    const city = all.get("Paris");
    for (const provider of ["kiwitaxi", "intui"]) {
      const result = router.resolveAffiliateRoute({ city, service: "transfers", provider }, date);
      assert.equal(result.capability, "internal_discovery");
      assert.equal(result.href, "/transfers");
    }
    for (const provider of ["welcome_pickups", "gettransfer"]) {
      const result = router.resolveAffiliateRoute({ city, service: "transfers", provider }, date);
      assert.equal(result.capability, "supplier_search");
      assert.equal(result.searchIntentForwarded, false);
      assert.ok(result.href.startsWith("https://"));
    }
    const klook = router.resolveAffiliateRoute({ city, service: "tours", provider: "klook" }, date);
    assert.equal(klook.capability, "supplier_search");
    assert.ok(klook.href.startsWith("/api/travel/partner-search?"));
    const gyg = router.resolveAffiliateRoute({ city, service: "activities", provider: "getyourguide" }, date);
    assert.equal(gyg.capability, "supplier_search");
    assert.equal(new URL(gyg.href).hostname, "www.getyourguide.com");
    for (const provider of ["wegotrip", "kkday", "gocity"]) {
      const result = router.resolveAffiliateRoute({
        city, service: "activities", provider,
      }, date);
      assert.equal(result.capability, "supplier_search", provider);
      assert.equal(result.searchIntentForwarded, false);
      assert.ok(!result.href.includes("Paris"), provider);
    }
    const noOffer = router.resolveAffiliateRoute({
      city, service: "tickets", provider: "getyourguide",
    }, date);
    assert.equal(noOffer.capability, "internal_discovery");
  });
});

function geoDatabase(rows) {
  const calls = [];
  let where = {};
  const query = {
    select() { return this; },
    eq(key, value) { where[key] = value; return this; },
    limit(value) { calls.push(["limit", value]); return this; },
    abortSignal() { return this; },
    then(resolveDone, reject) {
      const data = rows.filter(row => Object.entries(where).every(([key, value]) => row[key] === value)).slice(0, 2);
      return Promise.resolve({ data, error: null }).then(resolveDone, reject);
    },
    async maybeSingle() {
      const data = rows.filter(row => Object.entries(where).every(([key, value]) => row[key] === value));
      return { data: data[0] ?? null, error: null };
    },
  };
  return {
    calls,
    from(table) { calls.push(["from", table]); where = {}; return query; },
  };
}
function rowFor(name, code, slug) {
  return {
    id: byId, name, slug, country: "Source Country", country_code: code,
    nuitee_place_id: null, is_active: true,
  };
}

test("Vercel Edge geo resolver: exact city, supported locale and currency defaults", async () => {
  const headers = new Headers({
    "x-vercel-ip-country": "IN", "x-vercel-ip-city": "Mumbai",
    "accept-language": "hi-IN,hi;q=0.9,en;q=0.8",
  });
  const db = geoDatabase([rowFor("Mumbai", "IN", "mumbai-in")]);
  await withEnv({ ENABLE_UNIFIED_CITY_ROUTER: "false" }, async () => {
    const disabled = await geo.resolveVercelGeoCity(db, headers);
    assert.equal(disabled.source, "disabled");
    assert.equal(db.calls.length, 0);
  });
  await withEnv({ ENABLE_UNIFIED_CITY_ROUTER: "true" }, async () => {
    const result = await geo.resolveVercelGeoCity(db, headers);
    assert.equal(result.source, "exact_city");
    assert.equal(result.countryCode, "IN");
    assert.equal(result.city.name, "Mumbai");
    assert.equal(result.currency, "INR");
    assert.equal(result.locale, "hi");
    assert.equal(cities.isResolvedCityContext(result.city), true);
    assert.ok(db.calls.every(x => x[0] === "from" && x[1] === "destinations" || x[0] === "limit"));
  });
});

test("Vercel geo: Goa legacy and wrong-country matches never select another country", async () => {
  await withEnv({ ENABLE_UNIFIED_CITY_ROUTER: "true" }, async () => {
    const goa = await geo.resolveVercelGeoCity(
      geoDatabase([rowFor("Goa", "PH", "goa-ph")]),
      new Headers({ "x-vercel-ip-country": "IN", "x-vercel-ip-city": "Goa" }),
    );
    assert.equal(goa.source, "country");
    assert.equal(goa.city, null);
    assert.equal(goa.currency, "INR");

    const parisUs = await geo.resolveVercelGeoCity(
      geoDatabase([rowFor("Paris", "FR", "paris-fr")]),
      new Headers({ "x-vercel-ip-country": "US", "x-vercel-ip-city": "Paris" }),
    );
    assert.equal(parisUs.source, "country");
    assert.equal(parisUs.city, null);
    const badHeader = await geo.resolveVercelGeoCity(
      geoDatabase([rowFor("Mumbai", "IN", "mumbai-in")]),
      new Headers({ "x-vercel-ip-country": "IN", "x-vercel-ip-city": "Mumbai%0Aevil" }),
    );
    assert.equal(badHeader.city, null);
    assert.equal(badHeader.headerCity, null);
    const ambiguous = await geo.resolveVercelGeoCity(
      geoDatabase([
        rowFor("Paris", "FR", "paris-fr"),
        { ...rowFor("Paris", "FR", "paris-fr-alt"), id: "1a0a3a7f-9286-496f-8cc9-512c8918cc45" },
      ]),
      new Headers({ "x-vercel-ip-country": "FR", "x-vercel-ip-city": "Paris" }),
    );
    assert.equal(ambiguous.city, null);
  });
});

test("Geo recognizes percent-encoded UTF-8 city but never invents nearest coordinates", async () => {
  await withEnv({ ENABLE_UNIFIED_CITY_ROUTER: "true" }, async () => {
    const cityName = "São Paulo";
    const result = await geo.resolveVercelGeoCity(
      geoDatabase([rowFor(cityName, "BR", "sao-paulo-br")]),
      new Headers({ "x-vercel-ip-country": "BR", "x-vercel-ip-city": encodeURIComponent(cityName) }),
    );
    assert.equal(result.source, "exact_city");
    assert.equal(result.city.name, cityName);
    assert.equal(result.currency, "USD");
    assert.equal(result.locale, "en");
    assert.equal("coordinates" in result, false);
  });
});

test("Step 2 remains isolated: no UI imports, no DB writes, flag false, no new tables", () => {
  const newModules = [
    "adapterTypes", "hotelAdapter", "flightAdapter", "groundAdapter",
    "experienceAdapter", "edgeGeoAutoDetect",
  ];
  for (const mod of newModules) {
    const source = readFileSync(resolve(root, "src/lib/router", mod + ".ts"), "utf8");
    assert.doesNotMatch(source, /\.insert\(|\.upsert\(|\.update\(|\.delete\(|CREATE TABLE|ALTER TABLE/iu);
  }
  const envExample = readFileSync(resolve(root, ".env.example"), "utf8");
  assert.match(envExample, /^ENABLE_UNIFIED_CITY_ROUTER=false$/m);
  assert.match(envExample, /^NEXT_PUBLIC_HOPEGOO_AFFILIATE_URL=$/m);
  for (const path of [
    "src/components/flights/AviasalesWhiteLabel.tsx",
    "src/components/hotel/NuiteeHotelsListWidget.tsx",
    "src/components/travel/GTHTransportSearchWidget.tsx",
    "src/app/hotels/page.tsx", "src/app/flights/page.tsx",
  ]) {
    const source = readFileSync(resolve(root, path), "utf8");
    assert.doesNotMatch(source, /router\/affiliateRouter|router\/edgeGeoAutoDetect/);
  }
});
