import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
function compile(path, deps, globals = {}) {
  const module = {exports:{}};
  const js = ts.transpileModule(read(path), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText;
  vm.runInNewContext(js, {
    module,exports:module.exports,
    require:name=>{
      if (name in deps) return deps[name];
      throw new Error("Unexpected dependency "+name);
    },
    Response,URL,
    AbortSignal:{timeout:ms=>{assert.equal(ms,12000);return {timeoutMs:ms};}},
    ...globals,
  });
  return module.exports;
}
function setup(opts = {}) {
  const requested = [];
  const live = opts.live !== false;
  const client = {
    from(view) {
      requested.push(view);
      return {
        select(key,{head,count}) {
          assert.equal(head,true);
          assert.equal(count,"exact");
          assert.equal(key, "slug");
          return {
            async abortSignal(signal) {
              assert.equal(signal.timeoutMs,12000);
              if (opts.fail) return {count:null,error:{message:"private source unavailable"}};
              return {count:1201,error:null};
            }
          };
        }
      };
    }
  };
  const site = {isPublicLaunch:()=>live,siteOrigin:()=> "https://www.gthproglobal.com"};
  const deps = {
    "server-only":{},
    "@supabase/supabase-js":{createClient:()=>client},
    "@/lib/real-estate/property-seo":{isIndexableProperty:()=>false},
    "@/lib/seo/public-listings":{isIndexableHotel:()=>false,isIndexableTender:()=>false},
    "@/lib/seo/site":site,
  };
  const shards = compile("src/lib/seo/large-sitemaps.ts",deps);
  return {shards,site,requested};
}

test("property shard count reads only the property view, not five unrelated catalogues",async()=>{
  const h=setup();
  assert.equal(await h.shards.seoShardPages("properties"),2);
  assert.deepEqual(h.requested,["gth_seo_properties_v1"]);
});

test("preview or unlaunched website never accesses the database for shard pages",async()=>{
  const h=setup({live:false});
  assert.equal(await h.shards.seoShardPages("properties"),0);
  assert.equal(h.requested.length,0);
});

test("an outage of the requested source is a retryable error, not a missing sitemap",async()=>{
  const h=setup({fail:true});
  await assert.rejects(h.shards.seoShardPages("properties"),/SEO count unavailable: properties/);
  assert.deepEqual(h.requested,["gth_seo_properties_v1"]);
});

test("property sitemap route uses only its own count and preserves XML and 404/503 behavior",async()=>{
  const h=setup();
  const route=compile("src/app/seo-sitemaps/[kind]/[page]/route.ts",{
    "@/lib/seo/large-sitemaps":{
      seoShardPages:h.shards.seoShardPages,
      knownSeoKind:kind=>kind==="properties",
      seoShard:async()=>[{
        url:"https://www.gthproglobal.com/real-estate/sample-project",
        changeFrequency:"weekly",priority:0.5,
      }],
    },
    "@/lib/seo/site":h.site,
  });
  const valid=await route.GET(new Request("https://www.gthproglobal.com/seo-sitemaps/properties/0.xml"),{
    params:Promise.resolve({kind:"properties",page:"0.xml"}),
  });
  assert.equal(valid.status,200);
  assert.match(valid.headers.get("content-type"),/application\/xml/);
  assert.match(await valid.text(),/real-estate\/sample-project/);
  assert.deepEqual(h.requested,["gth_seo_properties_v1"]);
  const outOfRange=await route.GET(new Request("https://www.gthproglobal.com/seo-sitemaps/properties/2.xml"),{
    params:Promise.resolve({kind:"properties",page:"2.xml"}),
  });
  assert.equal(outOfRange.status,404);
  const invalid=await route.GET(new Request("https://www.gthproglobal.com/seo-sitemaps/other/0.xml"),{
    params:Promise.resolve({kind:"other",page:"0.xml"}),
  });
  assert.equal(invalid.status,404);
});

test("sitemap index still owns whole-catalogue counts, while individual shards do not",()=>{
  const root=read("src/app/sitemap-index.xml/route.ts");
  const shard=read("src/app/seo-sitemaps/[kind]/[page]/route.ts");
  assert.match(root,/seoShardCounts/);
  assert.match(shard,/seoShardPages\(kind\)/);
  assert.doesNotMatch(shard,/seoShardCounts/);
});
