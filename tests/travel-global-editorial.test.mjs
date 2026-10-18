import test from "node:test";
import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const newEditorial = read("src/data/blogGlobalRoutes.ts");
const articleBlocks = newEditorial.split("  {\n").slice(1);

function field(block, name) {
  const line = block.split("\n").find(item => item.trimStart().startsWith(name + ": "));
  assert.ok(line, "Missing " + name);
  const encoded = line.trim().slice(name.length + 2).replace(/,$/, "");
  return JSON.parse(encoded);
}

test("Ten new articles join the existing dynamic Blog routes without replacing SEO", () => {
  const parent = read("src/data/blogs.ts");
  const detail = read("src/app/blog/[slug]/page.tsx");
  assert.ok(parent.includes('import {globalRouteBlogs} from "./blogGlobalRoutes";'));
  assert.ok(parent.includes("...globalRouteBlogs,"));
  assert.ok(detail.includes("return blogs.map((blog) => ({ slug: blog.slug }));"));
  assert.equal(articleBlocks.length, 10);
});

test("Destination articles have distinct slugs, matching city assets and complete planning advice", () => {
  const ids = new Set();
  const older = read("src/data/blogExpansion.ts") + read("src/data/blogs.ts");
  for (const block of articleBlocks) {
    const slug = field(block, "slug");
    const image = field(block, "image");
    const description = field(block, "description");
    const content = field(block, "content");
    assert.match(slug, /^[a-z]+(?:-[a-z]+)+$/);
    assert.ok(!ids.has(slug), "New slug repeated: " + slug);
    assert.ok(!older.includes('slug:"' + slug + '"') && !older.includes('slug: "' + slug + '"'), "Existing slug collision: " + slug);
    ids.add(slug);
    assert.ok(description.length >= 65, "Description too thin: " + slug);
    assert.ok(content.split(/\s+/).length >= 200, "Article too thin: " + slug);
    assert.ok(content.includes("## "));
    assert.ok(content.includes("/hotels/results?city="));
    assert.ok(content.includes("/tours?city="));
    assert.match(content, /check|confirm|verify/i);
    assert.doesNotMatch(content, /guaranteed tickets|confirmed reservation|exclusive deal|live ticket prices/i);
    assert.match(image, /^\/images\/cities\/[a-z-]+\.jpg$/);
    assert.ok(existsSync(new URL("../public" + image, import.meta.url)), "Image missing: " + image);
  }
});

test("Five travel hubs show up to 48 real city tags with country-balanced rails", () => {
  for (const route of ["tours", "attractions", "guides", "blog", "destinations"]) {
    const page=read("src/app/" + route + "/page.tsx");
    assert.ok(page.includes("listMappedCities({pageSize:48})"), route + " window not expanded");
    assert.ok(page.includes("MappedCityDiscovery"), route + " mapped discovery missing");
  }
  const rail=read("src/components/travel/MappedCityDiscovery.tsx");
  assert.ok(rail.includes("new Map<string,MappedCity[]>()"));
  assert.ok(rail.includes("diverseCities.map(item=>"));
  assert.ok(rail.includes("mappedCityLink(item.country_code,item.city)"));
  assert.doesNotMatch(rail, /Math.random|sampleCities|fakeCity/);
});
