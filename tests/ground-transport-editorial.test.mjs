import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const load = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("ground transport guides are original substantial content with unique SEO slugs", () => {
  const file = load("src/data/blogGroundTransport.ts");
  const guides = JSON.parse(file.slice(file.indexOf("= [") + 2, file.lastIndexOf("]") + 1));
  assert.equal(guides.length, 5);
  assert.equal(new Set(guides.map((x) => x.slug)).size, guides.length);
  for (const guide of guides) {
    assert.match(guide.slug, /^[a-z0-9-]+$/);
    assert.ok(guide.content.split(/\s+/).length >= 150, guide.slug + " too short");
    assert.match(guide.content, /\]\(\/bus|\]\(\/train/);
    assert.ok(guide.description.length > 50);
    assert.ok(guide.image.startsWith("/images/cities/"));
    assert.ok(!/guaranteed live|book now for ₹|confirmed seat/i.test(guide.content));
  }
});

test("train and bus pages keep the provider checkout and existing planner", () => {
  for (const mode of ["bus", "train"]) {
    const file = load("src/app/" + mode + "/page.tsx");
    assert.match(file, /TransportPlanner/);
    assert.match(file, /TransportRouteDiscovery/);
    assert.match(file, /12go\.asia\/\?z=17380992/);
    assert.match(file, /busbud\.com\/en/);
    assert.match(file, /verifiedRouteValue/);
    assert.match(file, /noLiveDataNotice=/);
  }
  assert.match(load("src/app/train/page.tsx"), /irctc\.co\.in\/nget\/train-search/);
});

test("blog and provider source remain isolated from payment and hotel systems", () => {
  const blog = load("src/data/blogs.ts");
  const index = load("src/app/blog/page.tsx");
  const planner = load("src/components/travel/TransportPlanner.tsx");
  const corridors = load("src/components/travel/TransportRouteDiscovery.tsx");
  assert.match(blog, /\.\.\.groundTransportBlogs/);
  assert.match(index, /groundTransportBlogs\.map/);
  assert.match(planner, /initialFrom/);
  assert.match(planner, /id="journey-planner"/);
  assert.match(corridors, /encodeURIComponent\(route.from\)/);
  assert.match(corridors, /encodeURIComponent\(route.to\)/);
  assert.doesNotMatch(corridors, /NEXT_PUBLIC_|api[_-]?key|bookings\/create/i);
});
