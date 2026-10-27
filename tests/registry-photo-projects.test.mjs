import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import {renderToStaticMarkup} from "react-dom/server";

const source = readFileSync(new URL("../src/components/real-estate/RegistryPhotoProjects.tsx", import.meta.url), "utf8");
const photoId = "11111111-1111-4111-8111-111111111111";
async function render(media, records) {
  let state = [], effect;
  let settled;
  const done = new Promise(resolve => {settled = resolve;});
  const queries = [];
  const supabase = {from(table) {
    const query = {table, filters: []}; queries.push(query);
    const builder = new Proxy({}, {get(_target, name) {
      if (name === "then") return (resolve) => {resolve({data: table === "properties" ? records : media, error: null}); if (!media.length) settled();};
      return (...args) => {query.filters.push([name, ...args]); return builder;};
    }});
    return builder;
  }};
  const imports = {
    react: {useState: () => [state, value => {state = value; settled();}], useEffect: callback => {effect = callback;}},
    "react/jsx-runtime": jsx,
    "next/link": {default: ({children, ...props}) => React.createElement("a", props, children)},
    "next/image": {default: ({fill, unoptimized, ...props}) => React.createElement("img", props)},
    "@/lib/supabase": {supabase},
    "@/lib/property-media/published-media": {publishedMediaUrl: id => /^[a-f0-9-]{36}$/.test(id) ? "/api/property-media/" + id : ""},
    "@/lib/real-estate/property-seo": {validPropertySlug: slug => typeof slug === "string" && /^[a-z0-9-]+$/.test(slug)},
  };
  const testModule = {exports: {}};
  vm.runInNewContext(ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX}}).outputText,
    {module: testModule, exports: testModule.exports, require: name => {if (name in imports) return imports[name]; throw new Error(name);}, AbortController, setTimeout, clearTimeout}, {timeout: 2000});
  const Component = testModule.exports.default;
  Component();
  const cleanup = effect();
  await done;
  const html = renderToStaticMarkup(Component());
  cleanup();
  return {html, queries};
}
test("registry photo discovery stays hidden when no photos are approved", async () => {
  const {html, queries} = await render([], []);
  assert.equal(html, ""); assert.equal(queries.length, 1);
});
test("approved registry photos are deduplicated, labelled and kept separate from offers", async () => {
  const media = [{id: photoId, project_id: 1, attribution: "Project owner"}, {id: photoId, project_id: 1}, {id: photoId, project_id: 2}];
  const records = [{id: 1, slug: "sample-project", title: "Sample Project", city: "Mumbai", rera_id: "P12345678901"}, {id: 2, slug: "archived-project", title: "Archived project", rera_id: "P12345678902", status: "archived"}];
  const {html, queries} = await render(media, records);
  assert.equal((html.match(/<article/g) || []).length, 1);
  assert.match(html, /Availability unconfirmed/); assert.match(html, /not sale or rental offers/);
  assert.match(html, /Photo: Project owner/); assert.match(html, /\/api\/property-media\//);
  assert.doesNotMatch(html, /Archived project|₹|Buy now|Schedule site visit/);
  assert.ok(queries[0].filters.some(([name, column, value]) => name === "eq" && column === "media_type" && value === "photo"));
  assert.ok(queries[1].filters.some(([name, column]) => name === "in" && column === "source_type"));
  // Public status is protected: publication filtering belongs to existing RLS.
  assert.ok(!queries[0].filters.some(([name, column]) => name === "eq" && column === "status"));
  assert.doesNotMatch(source, /\.image\b|hero_image|gallery_images|service_role/);
});
