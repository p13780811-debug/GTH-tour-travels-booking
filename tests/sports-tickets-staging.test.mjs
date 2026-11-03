import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

function runtimeModule(path, options = {}) {
  const { outputText, diagnostics } = ts.transpileModule(read(path), {
    fileName: path,
    reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  assert.equal(diagnostics?.filter((d) => d.category === ts.DiagnosticCategory.Error).length, 0);
  const mod = { exports: {} };
  vm.runInNewContext(outputText, {
    exports: mod.exports, module: mod,
    require: options.require || (() => { throw Error("Unexpected import"); }),
    process: options.process || { env: {} },
    URL, URLSearchParams, Date, AbortController, setTimeout, clearTimeout,
  }, { filename: path });
  return mod.exports;
}

test("sports search accepts valid worldwide location, sport and event date", () => {
  const { parseSportsTicketFilters } = runtimeModule("src/lib/sports-tickets/validation.ts");
  const parsed = parseSportsTicketFilters({ country: "India", city: "Mumbai", sport: "cricket", team: "Mumbai Indians", date: "2027-04-15", stadium: "Wankhede Stadium" });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.sport, "cricket");
  assert.equal(parsed.value.stadium, "Wankhede Stadium");
  assert.equal(parseSportsTicketFilters({}).value.city, "");
});

test("sports filters reject malformed dates, injection, duplicates and arbitrary parameters", () => {
  const { parseSportsTicketFilters } = runtimeModule("src/lib/sports-tickets/validation.ts");
  for (const input of [
    { date: "2027-02-30" }, { date: "javascript:alert(1)" },
    { city: "<script>" }, { stadium: "a".repeat(150) },
    { sport: "unsupported" }, { redirect: "https://evil.example" },
    { team: ["Team One", "Team Two"] },
    new URLSearchParams("city=London&city=Paris"),
  ]) assert.equal(parseSportsTicketFilters(input).ok, false);
});

test("affiliate checkout is restricted to written-authorized HTTPS origins", () => {
  const { approvedTicketUrl } = runtimeModule("src/lib/sports-tickets/providers.ts");
  const allow = ["https://tickets.approved.example"];
  assert.equal(approvedTicketUrl("https://tickets.approved.example/event/123", allow), "https://tickets.approved.example/event/123");
  for (const link of [
    "http://tickets.approved.example/event", "https://tickets.approved.example.evil.invalid/",
    "javascript:alert(1)", "https://user:password@tickets.approved.example/event",
    "https://other.example/", "https://tickets.approved.example@evil.invalid/",
  ]) assert.equal(approvedTicketUrl(link, allow), null);
  assert.equal(approvedTicketUrl("https://tickets.approved.example/", []), null);
});

test("stale, past-date, malformed and unauthorized supplier data is blocked", () => {
  const { normalizeAuthorizedEvent } = runtimeModule("src/lib/sports-tickets/providers.ts");
  const now = Date.parse("2026-11-04T00:00:00.000Z");
  const provider = {
    id: "authorized", name: "Authorized Provider", authorizationReference: "contract-ref",
    approvedTicketOrigins: ["https://tickets.approved.example"], search: async () => [],
  };
  const event = {
    providerEventId: "match-1", title: "Verified sports event", sport: "football",
    startsAt: "2026-11-10T18:00:00Z", country: "Spain", city: "Madrid",
    stadium: "Stadium", ticketUrl: "https://tickets.approved.example/event/1",
    availability: "available", verifiedAt: "2026-11-03T23:00:00Z",
  };
  assert.equal(normalizeAuthorizedEvent(provider, event, now)?.providerName, "Authorized Provider");
  assert.equal(normalizeAuthorizedEvent(provider, { ...event, verifiedAt: "2026-10-01T00:00:00Z" }, now), null);
  assert.equal(normalizeAuthorizedEvent(provider, { ...event, ticketUrl: "https://evil.invalid/" }, now), null);
  assert.equal(normalizeAuthorizedEvent(provider, { ...event, startsAt: "2026-11-01T00:00:00Z" }, now), null);
  assert.equal(normalizeAuthorizedEvent(provider, { ...event, title: "<script>" }, now), null);
  assert.equal(normalizeAuthorizedEvent({ ...provider, authorizationReference: "" }, event, now), null);
});

test("public route stays off even when production flag is set without approved suppliers", () => {
  const m = runtimeModule("src/lib/sports-tickets/service.ts", {
    require: (id) => id === "./providers"
      ? { AUTHORIZED_TICKET_PROVIDERS: [], normalizeAuthorizedEvent: () => null }
      : (() => { throw Error("Unexpected module " + id); })(),
    process: { env: { NODE_ENV: "production", GTH_SPORTS_TICKETS_PUBLIC_ENABLED: "true", GTH_SPORTS_TICKETS_LOCAL_PREVIEW: "true" } },
  });
  assert.equal(m.sportsTicketingPubliclyEnabled(), false);
  assert.equal(m.sportsTicketingPageAccessible(), false);
});

test("local-only UI preview creates no fake results or booking calls", async () => {
  const m = runtimeModule("src/lib/sports-tickets/service.ts", {
    require: (id) => id === "./providers"
      ? { AUTHORIZED_TICKET_PROVIDERS: [], normalizeAuthorizedEvent: () => null }
      : (() => { throw Error("Unexpected module " + id); })(),
    process: { env: { NODE_ENV: "development", GTH_SPORTS_TICKETS_LOCAL_PREVIEW: "true" } },
  });
  assert.equal(m.sportsTicketingPageAccessible(), true);
  const results = await m.searchAuthorizedSportsEvents({ country: "", city: "", date: "", sport: "", team: "", stadium: "" });
  assert.equal(results.length, 0);
});

test("screenshot flow, separate architecture, noindex and booking safety remain intact", () => {
  const ui = read("src/components/sports-tickets/SportsTicketsExperience.tsx");
  const page = read("src/app/sports-tickets/page.tsx");
  const api = read("src/app/api/sports-tickets/events/route.ts");
  const registry = read("src/lib/sports-tickets/providers.ts");
  for (const label of ["Country & City", "Match Date", "Sport & Team", "Stadium", "Available Matches & Tickets", "Authorized Ticketing Partner"]) {
    assert.ok(ui.includes(label), "Missing " + label);
  }
  for (const path of ["/flights", "/hotels", "/bus", "/train"]) assert.ok(ui.includes(path));
  for (const field of ["country", "city", "date", "sport", "team", "stadium"]) assert.ok(ui.includes('name="' + field + '"'));
  assert.match(page, /if \(!sportsTicketingPageAccessible\(\)\) notFound\(\)/);
  assert.match(api, /if \(!sportsTicketingPageAccessible\(\)\) return new Response\(null, \{ status: 404/);
  assert.match(page, /robots: \{ index: false, follow: false, nocache: true \}/);
  assert.match(registry, /AUTHORIZED_TICKET_PROVIDERS: readonly AuthorizedTicketProvider\[\] = Object\.freeze\(\[\]\)/);
  assert.doesNotMatch(ui, /ticketmaster\.com|sportsevents365\.com|mockPrice|fakeTickets|seatCount|NEXT_PUBLIC_/i);
  assert.doesNotMatch(registry, /fetch\(|process\.env\.[A-Za-z0-9_]+_KEY/i);
});

test("staged sports branch disables all automatic Vercel previews", () => {
  const config = JSON.parse(read("vercel.json"));
  assert.equal(config.git.deploymentEnabled["feat/sports-stadium-ticketing-staging-20261104"], false);
});
