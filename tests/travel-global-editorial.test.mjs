import test from "node:test";
import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";

const read = path => readFileSync(new URL("../"+path, import.meta.url), "utf8");
const newEditorial = read("src/data/blogGlobalRoutes.ts");
const articleBlocks = newEditorial.split(/\\n  \\{\\n    slug:/).slice(1);
const field = (block, name) => {
  const match = block.match(new RegExp("    " + name + ": (\\\"(?:\\\\.|[^\\\"\\\\])*\\\")"));
  assert.ok(match, "Missing " + name);
  return JSON.parse(match[1]);
};

test("Ten original global travel articles are part of the existing dynamic blog routes", () => {
  const parent = read("src/data/blogs.ts");
  const page = read("src/app/blog/[slug]/page.tsx");
  assert.match(parent, /import \\{globalRouteBlogs\\} from "\\.\\/blogGlobalRoutes"/);
  assert.match(parent, /\\.\\.\\.globalRouteBlogs/);
  assert.match(page, /blogs\\.map\\(\\(blog\\) => \\(\\{ slug: blog\\.slug \\}\\)\\)/);
  assert.equal(articleBlocks.length, 10);
});

test("Every new guide has unique slug, local city-named cover and substantive consumer guidance", () => {
  const ids = new Set();
  const older = read("src/data/blogExpansion.ts") + read("src/data/blogs.ts");
  for (const block of articleBlocks) {
    const slug = field(block, "slug");
    const description = field(block, "description");
    const image = field(block, "image");
    const content = field(block, "content");
    assert.match(slug, /^[a-z]+(?:-[a-z]+)+$/);
    assert.equal(ids.has(slug), false, "Duplicate new slug " + slug);
    assert.equal(older.includes('slug:"'+slug+'"') || older.includes('slug: "'+slug+'"'), false, "Collision with existing blog " + slug);
    ids.add(slug);
    assert.ok(description.length >= 65, "Thin description "+slug);
    assert.ok(content.split(/\\s+/).length >= 200, "Thin article "+slug);
    assert.match(content, /## /);
    assert.match(content, /\\/hotels\\/results\\?city=/);
    assert.match(content, /\\/tours\\?city=/);
    assert.match(content, /confirm|verify|check/i);
    assert.doesNotMatch(content, /guaranteed tickets|confirmed reservation|exclusive deal|live ticket prices/i);
    assert.match(image, /^\\/images\\/cities\\/[a-z-]+\\.jpg$/);
    assert.ok(existsSync(new URL("../public" + image, import.meta.url)), "Missing existing asset "+image);
  }
});
