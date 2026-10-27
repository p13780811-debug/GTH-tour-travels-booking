import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function load(path,deps={}){const exports={};new Function('exports','require',ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exports,n=>{if(!(n in deps))throw Error(n);return deps[n]});return exports;}
const validators=load('src/lib/security/validators.ts');
const request=load('src/lib/security/request.ts',{'./validators':validators});
const search=load('src/lib/real-estate/hybrid-search.ts',{'@/lib/security/request':request});
const parse=value=>search.parseHybridSearch(new URLSearchParams(value));

test('hybrid search rejects operator injection, invalid budgets, enums and fractional pages',()=>{
 for(const q of ['query=x%2Cor%28id.gt.0%29','query=%3Cscript%3E','bedrooms=0','bedrooms=5','page=1.1','page=0','page=10001','minPrice=5','currency=INR&minPrice=100&maxPrice=50','currency=BAD','possession=completed-yesterday','listing=registry'])assert.throws(()=>parse(q),{status:400},q);
 for(const mode of ['buy','rent','new_launch','commercial','plots'])assert.equal(parse(`listing=${mode}`).mode,mode);
 assert.equal(parse('bedrooms=4%2B').bedrooms,'4+');
 assert.equal(parse('city=Thane+West&currency=INR&minPrice=100&maxPrice=200').city,'Thane West');
});

test('search fails closed on supplier timeout and never returns database diagnostics',async()=>{
 let called=0;
 const route=load('src/app/api/real-estate/search/route.ts',{'@supabase/supabase-js':{createClient:()=>({rpc:()=>({abortSignal:async()=>{called++;return {error:{message:'private connection string'},data:null}}})})},'@/lib/real-estate/hybrid-search':search,'@/lib/security/request':request});
 const prior={url:process.env.NEXT_PUBLIC_SUPABASE_URL,key:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY};
 try{
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='public-test-key';
 const invalid=await route.GET(new Request('https://gth.test/api/real-estate/search?minPrice=100'));assert.equal(invalid.status,400);assert.equal(called,0);
 const failed=await route.GET(new Request('https://gth.test/api/real-estate/search'));assert.equal(failed.status,503);assert.doesNotMatch(await failed.text(),/private connection/);
 }finally{if(prior.url===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=prior.url;if(prior.key===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=prior.key;}
});

const area=load('src/lib/real-estate/area.ts');
test('unit conversion preserves area basis; basis estimates require documented ratio',()=>{
 assert.ok(Math.abs(area.convertArea(100,'sqm','sqft')-1076.39104167)<1e-6);
 assert.equal(area.convertArea(1,'acre','sqft'),43560);assert.equal(area.convertArea(1,'sqyd','sqft'),9);
 assert.equal(area.estimateAreaBasis(750,'carpet',75),1000);
 assert.equal(area.estimateAreaBasis(1000,'built_up',75),750);
 for(const v of [NaN,Infinity,-1,0,1e12])assert.equal(area.convertArea(v,'sqft','sqm'),null);
 for(const ratio of [0,-5,101,NaN])assert.equal(area.estimateAreaBasis(1000,'carpet',ratio),null);
});
const photo={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',project_id:42,media_type:'photo',published_at:'2026-10-26',is_primary:false};
const media=load('src/lib/property-media/published-media.ts',{'@/lib/supabase':{}});
const schema=load('src/lib/real-estate/listing-schema.ts',{'@/lib/property-media/published-media':media});
const presentation=load('src/app/real-estate/registry/explorer-presentation.ts');
const property={id:42,slug:'actual-listing',title:'Actual listing',city:'Mumbai'};
const units=[{id:'unit-1',project_id:42,listing_type:'rent',price_amount:25000,currency:'INR'}];
test('registry, renders and unpublished property records cannot become marketplace cards or listing schema',()=>{
 assert.equal(schema.realEstateListingSchema(property,[],[photo],'https://gth.test/real-estate/actual-listing'),null);
 assert.equal(schema.realEstateListingSchema(property,units,[{...photo,media_type:'render'}],'https://gth.test/real-estate/actual-listing'),null);
 assert.equal(schema.realEstateListingSchema(property,units,[{...photo,project_id:99}],'https://gth.test/real-estate/actual-listing'),null);
 assert.equal(presentation.isPropertyVisualCard({...property,publishedMedia:[photo]}),false);
 assert.equal(presentation.isPropertyVisualCard({...property,registry_only:true,active_inventory_count:1,publishedMedia:[photo]}),false);
 assert.equal(presentation.isPropertyVisualCard({...property,active_inventory_count:1,publishedMedia:[photo]}),true);
});
test('RealEstateListing describes the actual rental offer and omits unknown price',()=>{
 const result=schema.realEstateListingSchema(property,units,[photo],'https://gth.test/real-estate/actual-listing');
 assert.equal(result['@type'],'RealEstateListing');assert.equal(result.mainEntity[0].price,25000);assert.equal(result.mainEntity[0].priceCurrency,'INR');assert.match(result.mainEntity[0].businessFunction,/#LeaseOut$/);
 const unknown=schema.realEstateListingSchema(property,[{...units[0],price_amount:null}],[photo],'https://gth.test/real-estate/actual-listing');
 assert.equal('price' in unknown.mainEntity[0],false);assert.equal('availability' in result.mainEntity[0],false);
});
const ownedMedia=load('src/lib/property-media/submission-media.ts');
test('submission media is bound to exact project origin and owner, without traversal or alternate hosts',()=>{
 const owner='11111111-1111-4111-8111-111111111111',file='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp';
 const prefix=`https://project.supabase.co/storage/v1/object/public/property-images/properties/${owner}/`;
 assert.equal(ownedMedia.submissionMediaObject(prefix+file,owner,'https://project.supabase.co'),`properties/${owner}/${file}`);
 for(const raw of [prefix+file+'?download=1',prefix+file+'#x',prefix.replace('project.supabase.co','evil.test')+file,prefix.replace(owner,'22222222-2222-4222-8222-222222222222')+file,prefix+'../'+file,'javascript:alert(1)',prefix+'malicious.svg',prefix+'%2e%2e/'+file])assert.equal(ownedMedia.submissionMediaObject(raw,owner,'https://project.supabase.co'),null,raw);
});
