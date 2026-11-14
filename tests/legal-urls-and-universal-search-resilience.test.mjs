import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("legacy policy shortcuts permanently redirect to exactly one indexable canonical destination", async () => {
  const source = read("next.config.ts");
  const js = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};
  vm.runInNewContext(js,{module:mod,exports:mod.exports},{timeout:2000});
  const entries = await mod.exports.default.redirects();
  for(const [oldPath,newPath] of [["/privacy","/privacy-policy"],["/terms","/terms-and-conditions"]]){
    const item=entries.find(r=>r.source===oldPath);
    assert.ok(item,oldPath+" should redirect");
    assert.equal(item.destination,newPath);
    assert.equal(item.permanent,true);
    assert.equal(entries.filter(r=>r.source===oldPath).length,1);
  }
  assert.ok(entries.some(r=>r.source==="/tender/guides"&&r.permanent===true));
  assert.ok(entries.some(r=>r.source==="/hotels"&&r.destination==="/hotels?view=booking"));
});

test("legal pages and partners are canonical, public, and sitemap-discoverable in production",()=>{
  const root=read("src/app/layout.tsx");
  const robots=read("src/app/robots.ts");
  const sitemap=read("src/app/sitemap.ts");
  for(const [path,meta] of [
    ["/privacy-policy","src/app/privacy-policy/layout.tsx"],
    ["/terms-and-conditions","src/app/terms-and-conditions/layout.tsx"],
    ["/partners","src/app/partners/page.tsx"],
  ]){
    const m=read(meta);
    assert.ok(m.includes('canonical:'+(path==="/partners"?'"/partners"':' "'+path+'"')),meta);
    assert.doesNotMatch(m,/robots:\s*\{[^}]*index:\s*false/s,meta);
    assert.ok(sitemap.includes('"'+path+'"'),"missing sitemap route "+path);
    assert.ok(!robots.includes('"'+path+'"'),"robots should not block "+path);
  }
  assert.match(root,/GTH_PUBLIC_LAUNCH_ENABLED === "true"/);
  assert.match(root,/index: true, follow: true/);
  assert.match(robots,/sitemap-index\.xml/);
  assert.match(read("src/app/search/page.tsx"),/robots: \{ index: false, follow: true \}/);
});

test("desktop universal search fails visibly but safely on upstream catalog timeouts",()=>{
  const search=read("src/app/search/page.tsx");
  assert.match(search,/let sourceSearchUnavailable = false/);
  assert.match(search,/AbortSignal\.timeout\(4_000\)/);
  assert.equal((search.match(/\.abortSignal\(signal\)/g)||[]).length,3);
  assert.match(search,/suppliers\.error \|\| catalog\.error \|\| properties\.error/);
  assert.match(search,/if \(!notices\.ok\) sourceSearchUnavailable = true/);
  assert.match(search,/sourceSearchUnavailable &&/);
  assert.match(search,/!sourceSearchUnavailable && !hotelMatches\.length/);
  assert.match(search,/The results above may be incomplete/);
  // Search-result combinations intentionally noindex, never block public legal content.
  assert.match(search,/title: "Master Search/);
  assert.doesNotMatch(search,/service.role|SUPABASE_SERVICE_ROLE_KEY|\.from\("private/);
});
