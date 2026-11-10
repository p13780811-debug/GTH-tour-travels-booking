import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(path, imports = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, URL, URLSearchParams,
    require: name => {
      if (name in imports) return imports[name];
      throw Error(name);
    },
  });
  return module.exports;
}
const catalog = load("src/lib/travel/stadiums.ts");
const partners = load("src/lib/travel/partner-search.ts");
const cruises = load("src/lib/travel/cruise-provider-search.ts", { "@/lib/travel/partner-search": partners });
const affiliates = load("src/lib/travel/stadium-affiliates.ts", {
  "./partner-search": partners, "./cruise-provider-search": cruises,
});

test("venue catalog has unique paths, official sources and no fabricated commercial data", () => {
  assert.equal(catalog.stadiums.length, 11);
  assert.equal(new Set(catalog.stadiums.map(venue => venue.slug)).size, 11);
  for (const venue of catalog.stadiums) {
    assert.match(venue.slug, /^[a-z0-9-]+$/);
    assert.equal(catalog.findStadium(venue.slug), venue);
    assert.ok(venue.overview.length > 100 && venue.seating.length > 80);
    assert.ok(venue.sports.every(sport => catalog.stadiumSports.includes(sport)));
    assert.doesNotThrow(() => new Intl.DateTimeFormat("en", { timeZone: venue.timeZone }));
    for (const source of [venue.schedule, venue.tickets, venue.seatMap, venue.experience, ...(venue.events ?? [])].filter(Boolean)) {
      assert.equal(new URL(source.url).protocol, "https:");
    }
    for (const field of ["price", "rating", "available", "commission", "capacity"]) assert.equal(field in venue, false);
  }
  assert.equal(catalog.findStadium("../../admin"), undefined);
});

test("local discovery supports aliases, accent normalization, multiple terms and empty results", () => {
  assert.equal(catalog.filterStadiums(catalog.stadiums, "mcg", "")[0].slug, "melbourne-cricket-ground");
  assert.equal(catalog.filterStadiums(catalog.stadiums, "barca", "Football")[0].slug, "camp-nou");
  assert.equal(catalog.filterStadiums(catalog.stadiums, "india cricket", "").length, 3);
  assert.equal(catalog.filterStadiums(catalog.stadiums, "Tokyo", "Cricket").length, 0);
  assert.equal(catalog.filterStadiums(catalog.stadiums, "nonexistent", "").length, 0);
});

test("each experience uses exact reviewed product URLs and the existing owner's attribution", () => {
  let products = 0;
  for (const venue of catalog.stadiums) {
    for (const product of venue.products ?? []) {
      products++;
      const href = affiliates.stadiumAffiliateHref(product, venue.slug);
      assert.ok(href);
      const result = new URL(href);
      if (product.provider === "klook") {
        assert.equal(result.origin, "https://tp.media");
        for (const [key, value] of Object.entries({ campaign_id: "137", marker: "417668", p: "4110", trs: "504342" })) {
          assert.equal(result.searchParams.get(key), value);
        }
        assert.equal(result.searchParams.get("u"), product.url);
        assert.equal(result.searchParams.get("sub_id"), "gth_stadium_" + venue.slug);
      } else {
        assert.equal(result.origin + result.pathname, product.url);
        assert.equal(result.searchParams.get("partner_id"), cruises.GETYOURGUIDE_PARTNER_ID);
        assert.equal(result.searchParams.get("cmp"), "gth_stadium_" + venue.slug);
      }
    }
  }
  assert.equal(products, 3);
});

test("affiliate handoffs reject foreign origins, search links, credentials and injected tracking", () => {
  const base = catalog.stadiums.find(venue => venue.slug === "wembley-stadium").products[0];
  for (const url of [
    "https://evil.example/activity/10609-wembley-stadium-tour-london/",
    base.url + "?affiliate=someone-else",
    base.url + "#section",
    "https://user:password@www.klook.com/activity/10609-tour/",
    "https://www.klook.com/en-IN/search/result/",
    "http://www.klook.com/activity/10609-tour/",
    "invalid",
  ]) assert.equal(affiliates.stadiumAffiliateHref({ ...base, url }, "wembley-stadium"), null);
  assert.equal(affiliates.stadiumAffiliateHref(base, "../admin"), null);
  const gyg = catalog.stadiums.find(venue => venue.slug === "melbourne-cricket-ground").products[0];
  assert.equal(affiliates.stadiumAffiliateHref({ ...gyg, url: gyg.url.replace("www.getyourguide.com", "www.getyourguide.com.evil.example") }, "mcg"), null);
});

test("event expiry uses venue local date and retains a multi-day event through its last day", () => {
  const venue = catalog.findStadium("melbourne-cricket-ground");
  assert.equal(catalog.upcomingStadiumEvents(venue, new Date("2026-11-21T12:59:00Z")).length, 1);
  assert.equal(catalog.upcomingStadiumEvents(venue, new Date("2026-11-21T13:00:00Z")).length, 0);
  const race = catalog.findStadium("silverstone");
  assert.equal(catalog.upcomingStadiumEvents(race, new Date("2027-07-04T12:00:00Z")).length, 1);
  assert.equal(catalog.upcomingStadiumEvents(race, new Date("2027-07-04T23:00:00Z")).length, 0);
});

test("web discovery, app service gateway and sitemap include stadiums", () => {
  for (const file of [
    "src/app/travel/page.tsx", "src/app/mega-aggregator/EcosystemHub.tsx",
    "src/components/travel/TravelSectionNav.tsx", "src/lib/mobile/app-dashboard.ts",
    "src/app/sitemap.ts",
  ]) assert.ok(readFileSync(file, "utf8").includes('"/stadiums"'), file);
  assert.ok(readFileSync("src/app/app/services/[id]/page.tsx", "utf8").includes("  stadiums: {"));
  const page = readFileSync("src/app/stadiums/[slug]/page.tsx", "utf8");
  assert.match(page, /generateStaticParams/);
  assert.match(page, /dynamicParams = false/);
  assert.match(page, /revalidate = 3600/);
  for (const path of ["src/lib/travel/stadiums.ts", "src/lib/travel/stadium-affiliates.ts", "src/app/stadiums/page.tsx", "src/app/stadiums/[slug]/page.tsx"]) {
    assert.doesNotMatch(readFileSync(path, "utf8"), /supabase|fetch\(|setInterval/);
  }
});
