import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read = p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const compiled={exports:{}};
vm.runInNewContext(
 ts.transpileModule(read("src/lib/real-estate/property-seo.ts"),
  {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
 {module:compiled,exports:compiled.exports,URL}
);
const {propertySeo,isIndexableProperty}=compiled.exports;
const sample={
 title:"Oswal Heights",slug:"oswal-heights-dc52e6a6040c52d5",
 city:"Mumbai",district:"Mumbai Suburban",rera_id:"P51800026069",
 official_source_url:"https://maharera.maharashtra.gov.in/projects-search-result",
 developer:"Oswal Developers",source_type:"registry",registry_only:true,
 ingestion_source:"MahaRERA historic CSV 2024",active_inventory_count:0,
};
test("MahaRERA page metadata identifies exact RERA registration, location and recorded developer",()=>{
 assert.ok(isIndexableProperty(sample));
 const m=propertySeo(sample);
 assert.match(m.title,/Oswal Heights Mumbai/);
 assert.match(m.title,/MahaRERA P51800026069 Project Record \| GTH PRO/);
 assert.match(m.description,/Oswal Developers/);
 assert.match(m.description,/official MahaRERA portal/);
 assert.match(m.description,/does not confirm price, possession or availability/);
 assert.ok(m.title.length<=120 && m.description.length<=300);
});
test("historical registry must never produce a fake status or promotion claim",()=>{
 const m=propertySeo(sample);
 assert.doesNotMatch(m.description,/approved today|guaranteed|available now|ready to move/i);
 assert.equal(isIndexableProperty({...sample,rera_id:"not-rera"}),false);
 assert.equal(isIndexableProperty({...sample,status:"archived"}),false);
 assert.equal(isIndexableProperty({...sample,official_source_url:"https://maharera.maharashtra.gov.in.evil.example"}),false);
});
test("canonical detail route serves source-backed structured data and truthful breadcrumbs",()=>{
 const page=read("src/app/real-estate/[slug]/page.tsx");
 const svc=read("src/lib/real-estate/propertyService.ts");
 const details=read("src/components/real-estate/RegistryDetails.tsx");
 assert.match(page,/indexedRegistry=isIndexableProperty\(property\)/);
 assert.match(page,/MahaRERA Project Registry/);
 assert.match(page,/sourceUpdated \? \{ dateModified: sourceUpdated \}/);
 assert.match(page,/realEstateListingSchema/);
 assert.match(page,/robots: \{ index:/);
 assert.match(svc,/registration_date,updated_at,source_type/);
 assert.match(details,/imported MahaRERA data snapshot/);
 assert.match(details,/not an individually verified project-detail deep link/);
 assert.match(details,/Last source verification recorded/);
});
test("existing sharded property sitemap is the only dynamic property URL source",()=>{
 const main=read("src/app/sitemap.ts");
 const shard=read("src/lib/seo/large-sitemaps.ts");
 const index=read("src/app/sitemap-index.xml/route.ts");
 const robots=read("src/app/robots.ts");
 assert.doesNotMatch(main,/seoShard\("properties",0\)/);
 assert.match(main,/Property URLs are already partitioned/);
 assert.match(shard,/SEO_PAGE_SIZE=1000/);
 assert.match(shard,/properties:\{view:"gth_seo_properties_v1"/);
 assert.match(index,/seoShardCounts/);
 assert.match(robots,/sitemap-index\.xml/);
});
test("only scoped SEO changes: no paid API, no database DDL and no second registry route",()=>{
 const page=read("src/app/real-estate/[slug]/page.tsx");
 const source=read("src/lib/real-estate/property-seo.ts");
 assert.doesNotMatch(page+source,/SUPABASE_SERVICE_ROLE|ALTER TABLE|CREATE TABLE|maharera\/\[slug\]/i);
});
