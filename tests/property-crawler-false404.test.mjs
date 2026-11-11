import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

function harness(outcome) {
  let calls = 0;
  const snapshots = new Map();
  let seenSlug = "";
  const query = {
    select(fields) { assert.equal(fields, "id,title,slug,registry_evidence"); return this; },
    eq(field,value) { assert.equal(field,"slug"); seenSlug=value; return this; },
    limit(value) { assert.equal(value,1); return this; },
    async abortSignal(signal) {
      assert.equal(signal.timeoutMs,8000);
      calls++;
      if (outcome.throwError) throw Error("transient network failure");
      return {data:outcome.data,error:outcome.error||null};
    },
  };
  const client = {from(table) {assert.equal(table,"properties");return query;}};
  const compiled = {exports:{}};
  const js = ts.transpileModule(read("src/lib/real-estate/public-property-page.ts"),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText;
  vm.runInNewContext(js,{
    module:compiled,exports:compiled.exports,AbortSignal:{timeout:ms=>({timeoutMs:ms})},
    require(name) {
      if(name==="server-only") return {};
      if(name==="next/cache")return {unstable_cache:(fn,keys,opts)=>{
        assert.equal(opts.revalidate,1800);
        assert.equal(keys[0],"gth-public-project-page-v1");
        return async slug=>{
          if(snapshots.has(slug))return snapshots.get(slug);
          const value=await fn(slug);
          snapshots.set(slug,value);
          return value;
        };
      }};
      if(name==="@/lib/supabase")return {supabase:client};
      if(name==="@/lib/real-estate/propertyService")return {
        PUBLIC_PROPERTY_FIELDS:"id,title,slug",
        transformProperty:row=>({...row,transformed:true}),
      };
      if(name==="@/lib/real-estate/property-seo")return {
        validPropertySlug:slug=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug),
      };
      throw Error("Unexpected dependency "+name);
    },
  });
  return {load:compiled.exports.readPublicProjectForPage,parse:compiled.exports.parseHistoricalProjectSnapshot,calls:()=>calls,slug:()=>seenSlug};
}

test("valid property stays indexable during repeated crawler requests with cached public data",async()=>{
 const h=harness({data:[{id:10,title:"Recorded RERA project",slug:"recorded-rera-project"}]});
 const first=await h.load("recorded-rera-project");
 const second=await h.load("recorded-rera-project");
 assert.equal(first.title,"Recorded RERA project");
 assert.equal(first.transformed,true);
 assert.equal(second.title,first.title);
 assert.equal(h.calls(),1);
 assert.equal(h.slug(),"recorded-rera-project");
});

test("genuine missing public project returns null, invalid slug never queries DB",async()=>{
 const h=harness({data:[]});
 assert.equal(await h.load("../bad"),null);
 assert.equal(h.calls(),0);
 assert.equal(await h.load("valid-but-missing"),null);
 assert.equal(h.calls(),1);
});

test("source timeout does not fabricate a not-found page or cache a false 404",async()=>{
 for(const outcome of [{data:null,error:{message:"timeout"}},{throwError:true}]){
  const h=harness(outcome);
  await assert.rejects(h.load("recorded-rera-project"),/Public project record temporarily unavailable/);
  await assert.rejects(h.load("recorded-rera-project"),/Public project record temporarily unavailable/);
  assert.equal(h.calls(),2);
 }
});

test("SEO detail route shares cached source for metadata and content, with existing canonical and index gate",()=>{
 const page=read("src/app/real-estate/[slug]/page.tsx");
 assert.match(page,/readPublicProjectForPage\(slug\)/);
 assert.match(page,/alternates: \{ canonical \}/);
 assert.match(page,/robots: \{ index: \(isIndexableProperty\(property\)/);
 assert.match(page,/if \(!property\) notFound\(\)/);
 assert.doesNotMatch(page,/PropertyService\.getBySlug/);
 assert.match(page,/Recorded historical project facts/);
 assert.match(page,/not a\s+verified live project-detail record/);
});

test("historical CSV evidence improves specific factual content without implying live verification",()=>{
 const h=harness({data:[]});
 const snapshot=h.parse({
  kind:"operator_supplied_historic_csv_snapshot",
  source_project_status:"On-Going Project",
  source_project_type:"Residential",
  source_postal_code:"400077",
  proposed_completion_date:"2018-11-30",
  source_last_modified:"2021-07-21",
  private_contact:"must not display",
 });
 assert.equal(snapshot.projectType,"Residential");
 assert.equal(snapshot.proposedCompletion,"2018-11-30");
 assert.equal(snapshot.postalCode,"400077");
 assert.equal(snapshot.recordedStatus,"On-Going Project");
 assert.equal(snapshot.sourceModified,"2021-07-21");
 assert.equal("private_contact" in snapshot,false);
 assert.equal(h.parse({...snapshot,kind:"unverified"}),null);
 assert.equal(h.parse({kind:"operator_supplied_historic_csv_snapshot",proposed_completion_date:"not-a-date"}),null);
});

test("database evidence JSON never leaks wholesale into the rendered public page payload",async()=>{
 const h=harness({data:[{id:20,title:"RERA record",slug:"rera-record",registry_evidence:{
  kind:"operator_supplied_historic_csv_snapshot",source_project_type:"Residential",private_contact:"secret",
 }}]});
 const page=await h.load("rera-record");
 assert.equal(page.title,"RERA record");
 assert.equal(page.historicalRegistry.projectType,"Residential");
 assert.equal("registry_evidence" in page,false);
 assert.equal(JSON.stringify(page).includes("secret"),false);
});
