import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';
function load(path,imports={},globals={}) {
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module,exports:module.exports,require:n=>{if(n in imports)return imports[n];throw Error(n)},URL,URLSearchParams,Response,AbortSignal,...globals});return module.exports;
}
function find(tree,predicate){if(!tree||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(n=>find(n,predicate));return [...(predicate(tree)?[tree]:[]),...find(tree.props?.children,predicate)];}
const search=load('src/lib/real-estate/registry-search.ts');
test('registry homepage API rejects ambiguous, injected or unsupported filters before database work',async()=>{
 let reads=0;
 const {GET}=load('src/app/api/real-estate/registry-preview/route.ts',{'@/lib/real-estate/registry-search':search,'@/lib/real-estate/registry-reader':{readRegistryRecords:async()=>{reads++;return {rows:[],error:false}}}});
 for(const query of ['?q=a&q=b','?page=1','?q=a%2Cor%28id.gt.0%29','?q='+('a'.repeat(71))])assert.equal((await GET(new Request('https://example.test'+query))).status,400);
 assert.equal(reads,0);
});
test('homepage projection limits records, excludes private data and preserves outage/recovery distinction',async()=>{
 let down=true;
 const {GET}=load('src/app/api/real-estate/registry-preview/route.ts',{'@/lib/real-estate/registry-search':search,'@/lib/real-estate/registry-reader':{readRegistryRecords:async f=>{assert.equal(f.page,1);assert.equal(f.q,'Thane');return {error:down,rows:Array.from({length:9},(_,i)=>({slug:'project-'+i,title:'Project '+i,rera_id:'P12345678901',developer:null,builder_name:'Recorded promoter',city:null,district:'Thane',private_email:'private',price:2000000,image:'unapproved'}))}}}});
 const request=new Request('https://example.test?q=Thane');const failure=await GET(request);assert.equal(failure.status,503);assert.equal(failure.headers.get('cache-control'),'no-store');assert.equal((await failure.json()).items,undefined);
 down=false;const response=await GET(request),body=await response.json();assert.equal(response.status,200);assert.equal(body.items.length,6);assert.equal(body.items[0].city,'Thane');assert.equal(body.items[0].developer,'Recorded promoter');assert.deepEqual(Object.keys(body.items[0]).sort(),['city','developer','rera_id','slug','title']);
});
test('compact command search keeps all intents, routes submitted query once and binds quick filters',()=>{
 const icons=new Proxy({},{get:()=> 'icon'}),styles=new Proxy({},{get:(_,k)=>k});const events=[];
 const {default:Hero}=load('src/components/real-estate/ExplorerHero.tsx',{'react/jsx-runtime':jsx,'next/link':{default:'a'},'lucide-react':icons,'./Explorer.module.css':{default:styles}});
 const props={query:'  Thane  ',intent:'buy',loading:false,onQuery(){},onIntent:v=>events.push(['intent',v]),onSearch:v=>events.push(['search',v]),onRefine:v=>events.push(['filter',v]),onFilters:()=>events.push(['open']),onInfo(){}};
 let tree=Hero(props);assert.equal(find(tree,n=>n.type==='img').length,0);assert.equal(find(tree,n=>n.type==='h1').length,1);
 const buttons=find(tree,n=>n.type==='button');for(const value of ['buy','rent','new_launch','commercial','plots','registry']){const button=buttons.find(n=>n.key===value);assert.ok(button);button.props.onClick();}
 const form=find(tree,n=>n.type==='form')[0];form.props.onSubmit({preventDefault(){}});assert.equal(events.filter(e=>e[0]==='search').length,1);assert.deepEqual(events.at(-1),['search','Thane']);
 find(tree,n=>n.props['aria-label']==='Quick bedrooms')[0].props.onChange({target:{value:'4+'}});assert.equal(events.at(-1)[1].bedrooms,'4+');
 tree=Hero({...props,intent:'commercial'});assert.equal(find(tree,n=>n.props['aria-label']==='Quick bedrooms')[0].props.disabled,true);
 tree=Hero({...props,intent:'registry'});assert.equal(find(tree,n=>n.type==='select').length,0);assert.equal(find(tree,n=>n.type==='input')[0].props.maxLength,70);
});
test('portal command search stays within the selected registry or offer data source',async()=>{
 const values=[],effects=[];let cursor=0;const react={useState(initial){const i=cursor++;if(!(i in values))values[i]=initial;return [values[i],v=>{values[i]=typeof v==='function'?v(values[i]):v}]},useRef:v=>({current:v}),useCallback:v=>v,useEffect(fn){effects.push(fn)}};
 let href='https://example.test/real-estate';const urls=[];
 const channel={on(){return this},subscribe(){return this}};
 const db={auth:{getUser:async()=>({data:{user:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},channel:()=>channel,removeChannel(){}};
 const imports=new Proxy({'@/lib/supabase':{supabase:db},'react/jsx-runtime':jsx,react,'next/link':{default:'a'},'next/dynamic':{default:()=> 'map'},'@/lib/real-estate/registry-search':search,'@/lib/real-estate/propertyService':{clearPropertyCache(){}},'@/lib/real-estate/saved':{SAVED_KEY:'saved',normalizeSaved:()=>[]},'@/lib/real-estate/explorer':{compareSelection:()=>[]},'@/app/real-estate/registry/explorer-presentation':{isPropertyVisualCard:()=>true}}, {get:(target,key)=>key in target?target[key]:String(key).endsWith('.css')?{default:new Proxy({},{get:(_,k)=>k})}:String(key).includes('lucide')?new Proxy({},{get:()=> 'icon'}):{default:String(key)},has:()=>true});
 const {default:Page}=load('src/app/real-estate/page.tsx',imports,{window:{location:{get href(){return href},get search(){return new URL(href).search}},history:{replaceState(_a,_b,url){href=String(url)}},dispatchEvent(){},addEventListener(){},removeEventListener(){},innerWidth:375},document:{getElementById(){return null}},Event:class {},fetch:async url=>{urls.push(url);return {ok:true,json:async()=>({items:[],hasNext:false})}}});
 const render=()=>{cursor=0;effects.length=0;return Page()};const hero=tree=>find(tree,n=>String(n.type).endsWith('/ExplorerHero'))[0];
 let tree=render();effects[0]();const cleanup=effects[1]();assert.equal(urls.length,0,'unfiltered registry landing must not start an unused inventory RPC');cleanup();assert.equal(hero(tree).props.intent,'registry');hero(tree).props.onSearch('Thane');tree=render();const registry=find(tree,n=>String(n.type).endsWith('/RegistryDiscovery'))[0];assert.equal(registry.props.query,'Thane');assert.equal(urls.length,0);
 href='https://example.test/real-estate?bedrooms=3&currency=INR&maxPrice=9000000&page=2';hero(tree).props.onIntent('commercial');tree=render();assert.equal(new URL(href).searchParams.get('listing'),'commercial');assert.equal(new URL(href).searchParams.has('bedrooms'),false);assert.equal(new URL(href).searchParams.has('page'),false);assert.equal(new URL(href).searchParams.get('maxPrice'),'9000000');assert.equal(urls.length,1);
 for(const filter of ['sort=price_high','currency=AED','page=2']){href='https://example.test/real-estate?'+filter;tree=render();const before=urls.length;effects[1]();assert.equal(urls.length,before+1,'direct offer filter links load inventory');}
});
