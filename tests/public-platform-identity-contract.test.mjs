import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("public brand identity consistently covers all four platforms", () => {
  const about = read("src/app/about/page.tsx");
  const verify = read("src/app/verification/page.tsx");
  const system = read("src/app/system/page.tsx");
  const graph = read("src/components/seo/SiteIdentitySchema.tsx");
  for (const p of ["Travel", "Real Estate", "Tender", "Tickets"]) {
    assert.match(system.toLowerCase(), new RegExp(p.toLowerCase()), p);
  }
  assert.match(about, /Four connected fields/);
  assert.match(verify, /Four connected digital platforms/);
  assert.doesNotMatch(about, /three-part ecosystem|three connected fields/i);
  assert.match(graph, /siteUrl\("\/system"\)/);
  assert.match(system, /Affiliate referrals are one part of the platform/);
  assert.match(system, /first-party research and planning interfaces/);
});

test("public operating model has discoverable first-party routes and canonical metadata", () => {
  const system = read("src/app/system/page.tsx");
  const footer = read("src/components/sections/EcosystemFooter.tsx");
  const sitemap = read("src/app/sitemap.ts");
  const partners = read("src/app/partners/page.tsx");
  const verify = read("src/app/verification/page.tsx");
  assert.match(system, /canonical: "\/system"/);
  assert.match(footer, /\["How GTH PRO Works","\/system"\]/);
  assert.match(sitemap, /"\/system"/);
  assert.match(verify, /href="\/system"/);
  assert.match(partners, /href="\/system"/);
  for(const path of ["/real-estate","/real-estate/registry","/real-estate/tools","/travel","/hotels","/tours","/tender","/tender/services","/knowledge/tenders","/tickets","/stadiums","/blog"]){
    assert.ok(existsSync(new URL("../src/app" + path + "/page.tsx", import.meta.url)), "missing linked public page: " + path);
  }
});

test("new public identity page does not create paid usage, secret leaks or unsupported claims", () => {
  const sources = [
    "src/app/system/page.tsx",
    "src/app/about/page.tsx",
    "src/app/verification/page.tsx",
    "src/components/seo/SiteIdentitySchema.tsx"
  ];
  for (const source of sources) {
    const text = read(source);
    assert.doesNotMatch(text, /SUPABASE_SERVICE_ROLE_KEY|SMTP_PASSWORD|process\.env\.[A-Z_]*SECRET|api[_-]?key/i, source);
    assert.doesNotMatch(text, /guaranteed (?:bookings|indexing|results)|100% verified|government[- ]approved|certified security|aggregateRating/i, source);
  }
  const page = read("src/app/system/page.tsx");
  assert.doesNotMatch(page, /"use client"|fetch\(|useEffect|setInterval|createClient|<style|style=\{/);
  assert.match(page, /bg-\[var\(--bg\)\]/);
  assert.match(page, /SITE_CONFIG\.contactEmail/);
  assert.match(page, /supplier-operated handoffs/);
});
