import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function harness(launched=true){
 const signals=[];
 const publicEnv={NEXT_PUBLIC_SUPABASE_URL:"https://test.supabase.co",NEXT_PUBLIC_SUPABASE_ANON_KEY:"public-test-key",
  VERCEL_ENV:"production",GTH_PUBLIC_LAUNCH_ENABLED:String(launched)};
 function compile(path,dependencies={}){
  const compiledModule={exports:{}};
  const code=ts.transpileModule(readFileSync(new URL("../"+path,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{module:compiledModule,exports:compiledModule.exports,URL,process:{env:publicEnv},
   AbortSignal:{timeout:ms=>{assert.equal(ms,5000);return AbortSignal.abort();}},
   require:name=>{if(name in dependencies)return dependencies[name];throw Error("Unexpected dependency "+name);},
  });
  return compiledModule.exports;
 }
 const client={from(table){
  let signal;
  const query=new Proxy({}, {get(_target,key){
   if(key==="abortSignal")return value=>{signal=value;signals.push({table,signal});return query;};
   if(key==="then")return (resolve,reject)=>signal?.aborted
    ?Promise.resolve({data:null,count:null,error:{message:"private database detail"}}).then(resolve,reject)
    :new Promise(()=>{}).then(resolve,reject);
   return ()=>query;
  }});
  return query;
 }};
 const deps={"server-only":{},"@supabase/supabase-js":{createClient:()=>client}};
 const site={isPublicLaunch:()=>launched,siteOrigin:()=>"https://www.gthproglobal.com"};
 const listings={isIndexableHotel:()=>false,isIndexableTender:()=>false};
 const shards=compile("src/lib/seo/large-sitemaps.ts",{...deps,"@/lib/real-estate/property-seo":{isIndexableProperty:()=>false},"@/lib/seo/site":site,"@/lib/seo/public-listings":listings});
 const guides=compile("src/lib/travel/guideMedia.ts",{...deps,"@/lib/travel/open-attractions":{safeCommonsMedia:()=>null},
  "@/lib/travel/guideCatalog":{GUIDE_CONTENT_VERSION:1,contentReady:()=>true,guideBySlug:()=>null,topicGuides:[],guideCatalog:[{slug:"london"}]}});
 const sitemap=compile("src/app/sitemap.ts",{...deps,"@/lib/seo/large-sitemaps":shards,"@/data/destinations":{destinations:[]},"@/data/blogs":{blogs:[]},"@/lib/seo/site":site,"@/lib/seo/public-listings":listings,"@/lib/travel/guideMedia":guides}).default;
 return {sitemap,shards,signals};
}

test("production-launch sitemap completes through timed-out DB sources and retains static navigation",async()=>{
 const h=harness();let timer;
 const timeout=new Promise((_resolve,reject)=>{timer=setTimeout(()=>reject(Error("Sitemap left waiting on an unbounded read")),1000);});
 try{
  const entries=await Promise.race([h.sitemap(),timeout]);
  assert.ok(entries.some(entry=>entry.url==="https://www.gthproglobal.com/tours"));
  assert.ok(entries.some(entry=>entry.url==="https://www.gthproglobal.com/real-estate"));
  assert.ok(entries.every(entry=>!entry.url.includes("/stay/")&&!entry.url.includes("/guides/")));
  assert.equal(h.signals.length,6);assert.ok(h.signals.every(({signal})=>signal.aborted));
  assert.doesNotMatch(JSON.stringify(entries),/private database/);
 }finally{clearTimeout(timer);}
});

test("SEO shard count outages fail explicitly and the launch gate avoids all DB reads",async()=>{
 const h=harness();
 await assert.rejects(h.shards.seoShardCounts(),/SEO count unavailable/);
 assert.equal(h.signals.length,6);
 const preview=harness(false);
 assert.equal((await preview.sitemap()).length,0);
 assert.equal((await preview.shards.seoShardCounts()).length,0);
 assert.equal(preview.signals.length,0);
});
