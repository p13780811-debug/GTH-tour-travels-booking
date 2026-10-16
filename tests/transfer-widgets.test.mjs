import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("airport transfer page connects the full journey hub, supplier tools and route planner", () => {
  const page = read("src/app/transfers/page.tsx");
  assert.match(page, /TransferProviderWidgets/);
  assert.match(page, /AirportJourneyServices/);
  assert.match(page, /TransportPlanner mode="transfer"/);
  assert.match(page, /canonical: "\/transfers"/);
  assert.match(page, /external provider/);
  assert.doesNotMatch(page, /Math\.random|guaranteed fares|instant booking confirmed/i);
});

test("provider widgets retain all three supplied tracking and campaign identifiers", () => {
  const code = read("src/components/travel/TransferProviderWidgets.tsx");
  assert.equal((code.match(/https:\/\/tpwidg\.com\/content\?/g) || []).length, 3);
  for (const id of ["trs=504342", "shmarker=417668", "campaign_id=22&promo_id=1504", "campaign_id=1&promo_id=3879", "campaign_id=627&promo_id=8951"]) {
    assert.match(code, new RegExp(id));
  }
  assert.match(code, /transfer_options=MCR/);
  assert.match(code, /transfer_options_limit=10/);
  assert.match(code, /b_faq=true/);
  assert.match(code, /currency=USD/);
  assert.match(code, /show_header=true/);
  assert.match(code, /active === "additional"/);
});

test("third-party scripts are limited to transfer page and cleaned up on view switch", () => {
  const code = read("src/components/travel/TransferProviderWidgets.tsx");
  assert.match(code, /"use client"/);
  assert.match(code, /document\.createElement\("script"\)/);
  assert.match(code, /mount\.appendChild\(script\)/);
  assert.match(code, /mount\.replaceChildren\(\)/);
  assert.match(code, /script\.onerror/);
  assert.match(code, /aria-pressed/);
  assert.match(code, /rel="noopener noreferrer sponsored"/);
  assert.doesNotMatch(code, /dangerouslySetInnerHTML|eval\(|document\.write|NEXT_PUBLIC_.*KEY|localStorage/);
  assert.doesNotMatch(read("src/app/layout.tsx"), /tpwidg\.com/);
  assert.doesNotMatch(read("src/app/flights/page.tsx"), /tpwidg\.com/);
});

test("booking disclosure never claims first-party fare availability or confirmation", () => {
  const page = read("src/app/transfers/page.tsx");
  const widget = read("src/components/travel/TransferProviderWidgets.tsx");
  assert.match(page, /does not dispatch vehicles, guarantee availability, or process transport reservations/);
  assert.match(widget, /payments and confirmations are handled by the external provider/);
  assert.match(widget, /Affiliate disclosure/);
});


test("airport extras connect only known internal routes, approved affiliate URLs or genuine provider pages", () => {
  const source = read("src/components/travel/AirportJourneyServices.tsx");
  for (const route of ["/flights", "/transfers", "/hotels", "/tours", "/activities", "/destinations", "/bus", "/train", "/insurance"]) {
    if (route === "/transfers") assert.match(source, /#transfer-provider-heading/);
    else assert.ok(source.includes('href: "' + route + '"'), route);
  }
  assert.match(source, /https:\/\/airhelp\.tpo\.lv\/W9baN8JY/);
  assert.match(source, /https:\/\/tpo\.lv\/GFuzmgYk/);
  assert.match(source, /https:\/\/in\.trip\.com\/carhire\//);
  assert.match(source, /https:\/\/www\.prioritypass\.com\/en-GB\/airport-lounges/);
  assert.match(source, /Independent provider website/);
  assert.match(source, /rel=\{service\.kind === "partner" \? "noopener noreferrer sponsored"/);
  assert.doesNotMatch(source, /Math\.random|live guaranteed|booked successfully/i);
});
