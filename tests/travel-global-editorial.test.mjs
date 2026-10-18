import test from "node:test";
import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const newEditorial = read("src/data/blogGlobalRoutes.ts");
const articleBlocks = newEditorial.split('  {\n    slug:').slice(1);

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
