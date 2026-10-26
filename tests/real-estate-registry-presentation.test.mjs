import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
function source(p){return readFileSync(new URL("../"+p,import.meta.url),"utf8");}
function harness(){
 const mod={exports:{}};
 const stub=source("src/app/real-estate/registry/explorer-presentation.ts").replace(
  'import {approvedMedia} from "@/lib/real-estate/approved-media";',
  'const approvedMedia = (slug, image) => slug==="rights-approved" && image==="https://approved.example/photo.jpg";'
 ).replace('import type {ExplorerProperty} from "@/lib/real-estate/explorer";',"");
 vm.runInNewContext(ts.transpileModule(stub,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
  module:mod,exports:mod.exports,URL,
 });
 return mod.exports;
}
const base={slug:"a-project",title:"Project",rera_id:"P12345678901",registry_only:true,image:""};

test("registry without images goes to table, not a misleading property card",()=>{
 const p=harness();
 const outcome=p.splitPropertyPresentation([base]);
 assert.equal(outcome.cards.length,0);
 assert.equal(outcome.registry.length,1);
 assert.equal(outcome.withheld,0);
});

test("only rights-approved real photos may create visual cards",()=>{
 const p=harness();
 const unpublished={...base,registry_only:false,rera_id:undefined};
 const withPhoto={...unpublished,slug:"rights-approved",image:"https://approved.example/photo.jpg"};
 assert.equal(p.isPropertyVisualCard(unpublished),false);
 assert.equal(p.isPropertyVisualCard(withPhoto),true);
 assert.equal(p.isPropertyVisualCard({...withPhoto,registry_only:true}),false);
 assert.equal(p.splitPropertyPresentation([unpublished]).withheld,1);
});

test("registry source links are restricted to official hostnames",()=>{
 const p=harness();
 assert.ok(p.officialMahaReraUrl("https://maharera.maharashtra.gov.in/"));
 for(const url of ["javascript:alert(1)","http://maharera.maharashtra.gov.in/","https://maharera.maharashtra.gov.in.evil.tld/","https://evil.tld/?url=maharera.maharashtra.gov.in"])
  assert.equal(p.officialMahaReraUrl(url),null);
});

test("registry titles do not claim that unpublished prices or floor plans exist",()=>{
 const seo=source("src/lib/real-estate/property-seo.ts");
 assert.match(seo,/MahaRERA Project Registration & Timeline/);
 assert.doesNotMatch(seo,/Floor Plans, Price & MahaRERA Details/);
 const view=source("src/app/real-estate/page.tsx");
 assert.match(view,/splitPropertyPresentation/);
 assert.match(view,/RegistryTable/);
 assert.doesNotMatch(view,/properties\.map\(property\s*=>\s*<ExplorerCard/);
});

test("public registry is dynamic, RLS scoped and does not invent delay verdicts",()=>{
 const page=source("src/app/real-estate/registry/page.tsx");
 assert.ok(page.includes('force-dynamic'));
 assert.ok(page.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'));
 assert.ok(page.includes('AbortSignal.timeout'));
 assert.ok(page.includes('delay certifications'));
 assert.ok(!page.includes('SERVICE_ROLE_KEY'));
 assert.ok(page.includes('Math.min(Number(rawPage),1000)'));
 assert.ok(!page.includes('isIndexableProperty(item)'));
 assert.ok(page.includes('Missing official project URLs are marked clearly'));
 assert.ok(page.includes('/hotels?view=booking'));
 assert.ok(!page.toLowerCase().includes('booking.com'));
});

test("historic registry visibility is independent of photo and missing official-link restrictions",()=>{
 const page=source("src/app/real-estate/registry/page.tsx");
 assert.match(page,/\.in\("source_type",\["registry","rera"\]\)/);
 assert.match(page,/\.ilike\("ingestion_source","%maharera%"\)/);
 assert.match(page,/item\.rera_id/);
 assert.doesNotMatch(page,/Boolean\(officialMahaReraUrl\(item\.official_source_url\)\)/);
 const table=source("src/app/real-estate/registry/RegistryTable.tsx");
 assert.match(table,/Not linked/);
 assert.match(table,/no delay verdict/);
});

test("accommodation handoff explicitly follows existing Nuitee white-label, never assumed Booking.com affiliate",()=>{
 const page=source("src/app/real-estate/registry/page.tsx");
 const provider=source("src/lib/travel/hotel-whitelabel.ts");
 assert.match(page,/\/hotels\?view=booking/);
 assert.match(page,/Nuitee white-label search/);
 assert.match(provider,/https:\/\/gthproglobal\.nuitee\.link/);
});
