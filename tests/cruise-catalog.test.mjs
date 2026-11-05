import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path,imports={}){const mod={exports:{}};vm.runInNewContext(ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module:mod,exports:mod.exports,URL,URLSearchParams,Response,require:n=>{if(n in imports)return imports[n];throw Error(n);}});return mod.exports;}
const catalog=load('src/lib/travel/cruises.ts');
const {GET}=load('src/app/go/cruises/[slug]/route.ts',{'@/lib/travel/cruises':catalog,'next/server':{NextResponse:{json:(v,i)=>Response.json(v,i),redirect:(v,s)=>new Response(null,{status:s,headers:{location:v}})}}});
test('every displayed cruise opens its exact product through the existing Klook campaign',async()=>{
 assert.equal(catalog.cruises.length,7);
 const ids=new Set();
 for(const item of catalog.cruises){
  assert.ok(!ids.has(item.slug));ids.add(item.slug);
  const r=await GET(new Request('https://www.gthproglobal.com/go/cruises/'+item.slug),{params:Promise.resolve({slug:item.slug})});
  assert.equal(r.status,302);assert.equal(r.headers.get('cache-control'),'no-store');
  const tracked=new URL(r.headers.get('location'));assert.equal(tracked.origin,'https://tp.media');
  for(const [k,v] of Object.entries({campaign_id:'137',marker:'417668',p:'4110',trs:'504342'}))assert.equal(tracked.searchParams.get(k),v);
  assert.equal(tracked.searchParams.get('u'),item.sourceUrl);
  assert.match(new URL(item.sourceUrl).pathname,/\/activity\/[1-9]\d*-/);
  assert.ok(!('price' in item)&&!('rating' in item)&&!('available' in item));
 }
});
test('cruise redirects reject unknown products and supplied redirect overrides',async()=>{
 for(const [slug,query] of [['missing',''],['disney-adventure-3-nights','?url=https://evil.example'],['singapore-river-cruise','?u=https://evil.example'],['..','']]){
  const r=await GET(new Request('https://www.gthproglobal.com/go/cruises/'+slug+query),{params:Promise.resolve({slug})});assert.equal(r.status,404);assert.equal(r.headers.get('location'),null);
 }
});
test('destination and cruise-type filtering preserves the actual collection',()=>{
 assert.equal(catalog.filterCruises('Singapore','holiday').length,3);
 assert.equal(catalog.filterCruises('dubai','dining')[0].slug,'dubai-marina-dinner');
 assert.equal(catalog.filterCruises('Hong Kong','sightseeing')[0].slug,'aqua-luna-harbour');
 assert.equal(catalog.filterCruises('Mumbai','').length,0);
});

test('every statically generated app service, including cruises, has a renderable gateway',async()=>{
 const dashboard=load('src/lib/mobile/app-dashboard.ts');
 const element=(type,props)=>({type,props});
 const gateway=load('src/app/app/services/[id]/page.tsx',{
  'react/jsx-runtime':{jsx:element,jsxs:element,Fragment:'fragment'},
  'next/link':{default:'link'},'next/navigation':{notFound:()=>{throw Error('not found');}},
  'lucide-react':{ArrowLeft:'icon',ArrowUpRight:'icon',ExternalLink:'icon',ShieldCheck:'icon'},
  '@/components/mobile/MobileAppHeader':{default:'header'},
  '@/lib/mobile/app-dashboard':dashboard,
 });
 const params=gateway.generateStaticParams();assert.ok(params.some(p=>p.id==='cruises'));
 for(const p of params)assert.ok(await gateway.default({params:Promise.resolve(p)}));
});
