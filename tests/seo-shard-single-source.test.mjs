import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
function compile(path, deps, globals = {}) {
  const compiledModule = {exports:{}};
  const js = ts.transpileModule(read(path), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText;
  vm.runInNewContext(js, {
    module:compiledModule,exports:compiledModule.exports,
    require:name=>{
      if (name in deps) return deps[name];
      throw new Error("Unexpected dependency "+name);
    },
    Response,URL,
    process:{env:{NEXT_PUBLIC_SUPABASE_URL:"https://test.supabase.co",NEXT_PUBLIC_SUPABASE_ANON_KEY:"public-mock-key"}},
    AbortSignal:{timeout:ms=>{assert.equal(ms,12000);return {timeoutMs:ms};}},
    ...globals,
  });
  return compiledModule.exports;
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

test("sitemap routes read one requested shard without exact counts",async()=>{
  const h=setup();
  const requestedShards=[];
  const route=compile("src/app/seo-sitemaps/[kind]/[page]/route.ts",{
    "@/lib/seo/large-sitemaps":{
      knownSeoKind:kind=>kind==="properties",
      seoShard:async(kind,page)=>{
        requestedShards.push({kind,page});
        return page===0?[{
          url:"https://www.gthproglobal.com/real-estate/sample-project",
          changeFrequency:"weekly",priority:0.5,
        }]:[];
      },
    },
    "@/lib/seo/site":h.site,
  });
  const valid=await route.GET(new Request("https://www.gthproglobal.com/seo-sitemaps/properties/0.xml"),{
    params:Promise.resolve({kind:"properties",page:"0.xml"}),
  });
  assert.equal(valid.status,200);
  assert.match(valid.headers.get("content-type"),/application\\/xml/);
  assert.match(await valid.text(),/real-estate\\/sample-project/);
  assert.equal(h.requested.length,0,"no extra expensive count requests");
  const outOfRange=await route.GET(new Request("https://www.gthproglobal.com/seo-sitemaps/properties/2.xml"),{
    params:Promise.resolve({kind:"properties",page:"2.xml"}),
  });
  assert.equal(outOfRange.status,404);
  const invalid=await route.GET(new Request("https://www.gthproglobal.com/seo-sitemaps/other/0.xml"),{
    params:Promise.resolve({kind:"other",page:"0.xml"}),
  });
  assert.equal(invalid.status,404);
  assert.deepEqual(requestedShards,[{kind:"properties",page:0},{kind:"properties",page:2}]);
});

test("source read failures remain HTTP 503 and do not invent an empty sitemap",async()=>{
  const route=compile("src/app/seo-sitemaps/[kind]/[page]/route.ts",{
    "@/lib/seo/large-sitemaps":{
      knownSeoKind:kind=>kind==="properties",
      seoShard:async()=>{throw new Error("temporary backend outage");},
    },
    "@/lib/seo/site":{isPublicLaunch:()=>true},
  });
  const response=await route.GET(new Request("https://www.gthproglobal.com/seo-sitemaps/properties/0.xml"),{
    params:Promise.resolve({kind:"properties",page:"0.xml"}),
  });
  assert.equal(response.status,503);
  assert.equal(response.headers.get("Cache-Control"),"no-store");
  assert.equal((await response.text()).includes("backend outage"),false);
});

test("sitemap index still owns whole-catalogue counts, individual shards are one-query only",()=>{
  const root=read("src/app/sitemap-index.xml/route.ts");
  const shard=read("src/app/seo-sitemaps/[kind]/[page]/route.ts");
  assert.match(root,/seoShardCounts/);
  assert.match(shard,/seoShard\\(kind,index\\)/);
  assert.match(shard,/if\\(!urls.length\\)/);
  assert.doesNotMatch(shard,/seoShardPages|seoShardCounts/);
});
