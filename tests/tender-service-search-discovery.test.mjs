import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("public tender services are discoverable only on explicitly launched production", () => {
  const page = read("src/app/tender/services/page.tsx");
  assert.match(page, /process\.env\.VERCEL_ENV==="production"/);
  assert.match(page, /process\.env\.GTH_PUBLIC_LAUNCH_ENABLED==="true"/);
  assert.match(page, /alternates:\{canonical:"\/tender\/services"\}/);
  assert.match(page, /robots:\{index:publicLaunch,follow:true\}/);
  assert.match(page, /<TenderServiceForm /);
});

test("sitemap advertises only public quote landing, not private tender queues", () => {
  const sitemap = read("src/app/sitemap.ts");
  assert.match(sitemap, /"\/tender", "\/tender\/services"/);
  assert.match(sitemap, /if \(!publicLaunch\) return \[\]/);
  assert.doesNotMatch(sitemap, /"\/admin\/tender-services"/);
});

test("no accidental Vercel preview release for the staging branch", () => {
  const conf = JSON.parse(read("vercel.json"));
  assert.equal(conf.git.deploymentEnabled["fix/tender-service-search-discovery-20261104"], false);
});
