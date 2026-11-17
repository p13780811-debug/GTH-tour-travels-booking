import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

function transpile(path) {
  return ts.transpileModule(source(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

function loadRouter() {
  const catalog = { exports: {} };
  vm.runInNewContext(transpile("src/lib/travel/bookaway-routes.ts"), {
    module: catalog, exports: catalog.exports,
  }, { timeout: 2000 });

  const router = { exports: {} };
  vm.runInNewContext(transpile("src/app/go/transport/bookaway/route.ts"), {
    module: router, exports: router.exports,
    Date, URL, URLSearchParams, Response,
    require: (name) => {
      if (name === "@/lib/travel/bookaway-routes") return catalog.exports;
      if (name === "next/server") return {
        NextResponse: {
          redirect: (target, status) => new Response(null, {
            status, headers: { location: String(target) },
          }),
          json: (data, init) => new Response(JSON.stringify(data), {
            status: init?.status ?? 200,
            headers: { "Content-Type": "application/json" },
          }),
        },
      };
      throw new Error("Unexpected module: " + name);
    },
  }, { timeout: 2000 });
  return { ...router.exports, catalog: catalog.exports };
}

function request(params) {
  const url = "https://www.gthproglobal.com/go/transport/bookaway?" + new URLSearchParams(params);
  return { url, nextUrl: new URL(url) };
}

function journey(fields = {}) {
  return {
    mode: "bus", from: "Bangkok", to: "Chiang Mai",
    date: new Date(Date.now() + 3 * 86400_000).toISOString().slice(0, 10),
    people: "2", ...fields,
  };
}

test("Bookaway is an independent optional route; original 12Go search gateway is preserved", () => {
  const twelveGo = source("src/app/go/transport/search/route.ts");
  const widget = source("src/components/travel/GTHTransportSearchWidget.tsx");
  assert.match(twelveGo, /const PROVIDER_ORIGIN = "https:\/\/12go\.asia"/);
  assert.match(twelveGo, /const AFFILIATE_ID = "17380992"/);
  assert.match(twelveGo, /NextResponse\.redirect\(supplier, 303\)/);
  assert.match(widget, /<form method="GET" action="\/go\/transport\/search"/);
  assert.match(widget, /formAction="\/go\/transport\/bookaway"/);
  assert.match(widget, /findBookawayRoute\(activeMode, from, to\)/);
  assert.match(widget, /<button type="submit"/);
  assert.doesNotMatch(widget, /Bookaway.*guaranteed availability|live price comparison/i);
});

test("only fixed, curated routes may become affiliate handoffs", async () => {
  const { GET } = loadRouter();
  for (const [mode, from, to, expectedPath] of [
    ["bus", "Bangkok", "Chiang Mai", "/bus/bangkok/chiang-mai"],
    ["train", "Bangkok", "Chiang Mai", "/train/bangkok/chiang-mai"],
    ["bus", "Hanoi", "Sapa", "/bus/hanoi/sapa"],
    ["train", "Hanoi", "Sapa", "/train/hanoi/sapa"],
    ["ferry", "Koh Phi Phi", "Phuket", "/ferry/koh-phi-phi/phuket"],
    ["bus", "Dubrovnik", "Split", "/bus/dubrovnik/split"],
    ["ferry", "Dubrovnik", "Split", "/ferry/dubrovnik/split"],
  ]) {
    const res = await GET(request(journey({ mode, from, to })));
    assert.equal(res.status, 303);
    const destination = new URL(res.headers.get("location"));
    assert.equal(destination.origin, "https://www.bookaway.com");
    assert.equal(destination.pathname, expectedPath);
    assert.equal(destination.searchParams.get("offer_id"), "34");
    assert.equal(destination.searchParams.get("aff_id"), "4344");
    assert.equal(destination.searchParams.has("date"), false,
      "Supplier date must be explicitly reconfirmed; don't invent query semantics");
    assert.equal(res.headers.get("Cache-Control"), "private, no-store, max-age=0");
  }
});

test("Bookaway does not guess unsupported routes, reverse direction, or flight inventory", async () => {
  const { GET } = loadRouter();
  for (const changes of [
    { from: "Mumbai", to: "Pune" },
    { from: "Chiang Mai", to: "Bangkok" },
    { mode: "flight" },
    { mode: "ferry", from: "Hanoi", to: "Sapa" },
    { from: "https://evil.example", to: "Chiang Mai" },
  ]) {
    const result = await GET(request(journey(changes)));
    assert.equal(result.status, 404);
    assert.equal(result.headers.get("location"), null);
  }
});

test("Bookaway handoff rejects duplicate fields, invalid dates and tampered passenger input", async () => {
  const { GET } = loadRouter();
  for (const extra of ["&mode=bus", "&to=evil", "&people=999", "&date=1900-01-01"]) {
    const url = request(journey());
    url.nextUrl = new URL(url.url + extra);
    url.url = url.nextUrl.toString();
    const result = await GET(url);
    assert.equal(result.status, 400);
    assert.equal(result.headers.get("location"), null);
  }
});
