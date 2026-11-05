import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';
function load(path,imports={},globals={}){
 const testModule={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module:testModule,exports:testModule.exports,require:n=>{if(n in imports)return imports[n];throw Error(n);},URL,URLSearchParams,TextEncoder,AbortSignal,...globals},{timeout:2000});return testModule.exports;
}
const repayment=load('src/lib/real-estate/repayment.ts');
const finance=load('src/lib/real-estate/buyer-planning.ts',{'./repayment':repayment});
const notes=load('src/lib/real-estate/research-notes.ts');
const search=load('src/lib/real-estate/registry-search.ts');
const seo=load('src/lib/real-estate/property-seo.ts');
const saved=load('src/lib/real-estate/saved-searches.ts',{'./search-region':load('src/lib/real-estate/search-region.ts')});
const assumptions={price:1000000,downPayment:200000,upfrontCosts:50000,annualRate:0,years:10,annualTax:1200,annualInsurance:1200,monthlyMaintenance:100,monthlyOther:50};
test('ownership scenario includes initial cash, finance and ongoing charges without double counting',()=>{
 const r=finance.ownershipEstimate(assumptions);assert.equal(r.loan,800000);assert.equal(r.cashRequired,250000);assert.equal(r.recurringMonthly,350);assert.ok(Math.abs(r.monthlyTotal-(800000/120+350))<1e-8);assert.equal(r.repayment.interest,0);assert.equal(r.stress.length,2);assert.ok(r.stress[1].monthly>r.monthlyTotal);
 const cash=finance.ownershipEstimate({...assumptions,downPayment:1000000});assert.equal(cash.repayment.monthly,0);assert.equal(cash.monthlyTotal,350);
 for(const change of [{price:Infinity},{downPayment:2000000},{years:1.5},{annualRate:41},{monthlyOther:NaN},{upfrontCosts:-1}])assert.equal(finance.ownershipEstimate({...assumptions,...change}),null);
});
test('affordability inversion agrees with repayment at zero, normal and stress rates',()=>{
 for(const rate of [0,6,8.5,40]){const cost=finance.ownershipEstimate({...assumptions,annualRate:rate});const a=finance.affordabilityEstimate(cost.monthlyTotal,cost.recurringMonthly,200000,rate,10);assert.ok(Math.abs(a.purchaseBudget-1000000)<.001);}
 assert.equal(finance.affordabilityEstimate(100,200,1000,6,30),null);assert.equal(finance.affordabilityEstimate(Infinity,0,0,6,30),null);
});
test('rental scenario incorporates vacancy, expenses and negative outcomes',()=>{
 const r=finance.rentalYieldEstimate(1000000,0,10000,1,20000);assert.equal(r.grossYield,12);assert.equal(r.collectedRent,110000);assert.equal(r.netYield,9);assert.ok(finance.rentalYieldEstimate(1000000,0,10000,12,20000).netYield<0);assert.equal(finance.rentalYieldEstimate(1000000,0,10000,13,0),null);
});
test('yearly schedule repays the original principal and reconciles total interest',()=>{
 for(const rate of [0,6,20]){const rows=finance.yearlyAmortization(100000,rate,30),r=repayment.estimateRepayment(100000,rate,30);assert.equal(rows.length,30);assert.equal(rows.at(-1).balance,0);assert.ok(Math.abs(rows.reduce((s,r)=>s+r.principal,0)-100000)<.001);assert.ok(Math.abs(rows.reduce((s,r)=>s+r.interest,0)-r.interest)<.001);}
 assert.equal(finance.yearlyAmortization(0,6,30).length,0);
});
test('research accepts only bounded notes, stages, checklist keys and valid dates',()=>{
 const r=notes.normalizeResearch({'project-one':{stage:'gth_verified',notes:'a'.repeat(4000),checks:['registration','registration','verified'],visitDate:'2026-02-30',visitTime:'25:99'},'../bad':{notes:'bad'}});assert.deepEqual(Object.keys(r),['project-one']);assert.equal(r['project-one'].stage,'shortlisted');assert.equal(r['project-one'].notes.length,3000);assert.deepEqual([...r['project-one'].checks],['registration']);assert.equal(r['project-one'].visitDate,'');assert.equal(Object.keys(notes.normalizeResearch(Object.fromEntries(Array.from({length:70},(_,i)=>['project-'+i,{}])))).length,50);
});
test('personal calendar export folds UTF-8 lines and cannot inject an attendee or book a visit',()=>{
 const e={...notes.emptyResearch(),visitDate:'2026-11-02',visitTime:'14:30'};const text=notes.personalVisitCalendar('project-one','Building\rATTENDEE:evil@example.test,'+'世'.repeat(100),e);assert.match(text,/DTSTART:20261102T143000/);assert.match(text.replace(/\r\n /g,''),/No appointment has been booked/);assert.doesNotMatch(text,/\r\nATTENDEE:|METHOD:REQUEST|ORGANIZER:/);for(const line of text.split('\r\n'))assert.ok(new TextEncoder().encode(line).length<=75);assert.equal(notes.personalVisitCalendar('project-one','Building',{...e,visitDate:'2026-02-30'}),null);
});
test('saved search preserves all hybrid modes, possession, decimals and 4+ bedrooms',()=>{
 for(const listing of ['buy','rent','new_launch','commercial','plots']){const p=new URLSearchParams(saved.normalizeSearchQuery(new URLSearchParams({listing,bedrooms:'4+',possession:'under_construction',currency:'INR',minPrice:'100.50'}).toString()));assert.equal(p.get('listing'),listing);assert.equal(p.get('bedrooms'),'4+');assert.equal(p.get('possession'),'under_construction');assert.equal(p.get('minPrice'),'100.50');}
 const p=new URLSearchParams(saved.normalizeSearchQuery('city=London,or(id.gt.0)&currency=INR&minPrice=100&maxPrice=10&redirect=https://evil.test'));for(const key of ['city','minPrice','maxPrice','redirect'])assert.equal(p.has(key),false);
});
test('advanced registry filter links preserve every field and reject query expression injection',()=>{
 const p=search.parseRegistryFilters({q:' Lake View ',developer:'A & B Homes',district:'Thane',year:'2028',sort:'completion_earliest',page:'2'});assert.equal(p.ok,true);const url=new URL(search.registryHref(p.filters,3),'https://www.gthproglobal.com');for(const [key,value] of Object.entries({q:'Lake View',developer:'A & B Homes',district:'Thane',year:'2028',sort:'completion_earliest',page:'3'}))assert.equal(url.searchParams.get(key),value);
 for(const raw of [{q:'A,or(id.gt.0)'},{developer:'A%'},{district:['Thane']},{year:'2028.5'},{sort:'price'},{page:'1001'},{q:'a'.repeat(71)}])assert.equal(search.parseRegistryFilters(raw).ok,false);
});
test('comparison accepts only two or three distinct project slugs',()=>{
 assert.deepEqual([...search.registryCompareSlugs('project-one,project-two')],['project-one','project-two']);for(const value of [undefined,['one','two'],'one','one,one','one,two,three,four','one,../bad','one,https://evil.test'])assert.equal(search.registryCompareSlugs(value),null);assert.deepEqual([...search.normalizeRegistrySelection(['one','one','two','three','four'])],['one','two','three']);
});
function reader(){let failure=null,rows=[],reads=0;const calls=[];
 const chain=new Proxy({},{get(_t,name){if(name==='then')return resolve=>resolve({data:failure?null:rows,error:failure});return(...args)=>{calls.push([name,...args]);return chain;};}});
 const cache=(fn)=>{const m=new Map();return async(...args)=>{const key=JSON.stringify(args);if(m.has(key))return m.get(key);const value=await fn(...args);m.set(key,value);return value;};};
 const api=load('src/lib/real-estate/registry-reader.ts',{'./property-seo':seo,'./registry-search':search,'next/cache':{unstable_cache:cache},'@supabase/supabase-js':{createClient(){reads++;return chain;}}},{process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:'public-test-key'}}});
 return {api,calls,setRows:v=>{rows=v;},fail:v=>{failure=v;},count:()=>reads};
}
const row=(slug,status=null)=>({slug,title:'Project '+slug,rera_id:'P12345678901',status});
test('temporary registry failures retry once, never cache an outage as empty, and recover on the next request',async()=>{
 const h=reader(),f=search.parseRegistryFilters({}).filters;h.fail({code:'PGRST003',message:'PRIVATE timeout'});const failed=await h.api.readRegistryRecords(f);assert.equal(failed.error,true);assert.equal(h.count(),2);assert.doesNotMatch(JSON.stringify(failed),/PRIVATE/);h.fail(null);h.setRows([row('one')]);const recovered=await h.api.readRegistryRecords(f);assert.equal(recovered.error,false);assert.equal(recovered.rows.length,1);assert.equal(h.count(),3);await h.api.readRegistryRecords(f);assert.equal(h.count(),3);
 const denied=reader();denied.fail({code:'42501',message:'permission denied'});assert.equal((await denied.api.readRegistryRecords(f)).error,true);assert.equal(denied.count(),1);
});
test('public registry queries combine project/developer groups once and preserve stable pagination',async()=>{
 const h=reader(),f=search.parseRegistryFilters({q:'Lake',developer:'Builder',district:'Thane',year:'2028',sort:'registered_newest',page:'2'}).filters;await h.api.readRegistryRecords(f);const c=h.calls;assert.equal(c.filter(([n])=>n==='or').length,1);assert.match(c.find(([n])=>n==='or')[1],/^and\(or\(title\.ilike/);assert.ok(c.some(([n,a,b])=>n==='range'&&a===35&&b===69));assert.ok(c.some(([n,a,b])=>n==='ilike'&&a==='ingestion_source'&&b==='%maharera%'));assert.ok(c.some(([n,a,b])=>n==='in'&&a==='source_type'&&[...b].join(',')==='registry,rera'));assert.doesNotMatch(c.find(([n])=>n==='select')[1],/price|image|raw_json|agent_phone/);
 const invalid=reader();assert.equal((await invalid.api.readRegistryRecords({...f,q:'bad,or(id.gt.0)'})).error,true);assert.equal(invalid.count(),0);
});
test('registry comparison preserves request order, excludes archives and never substitutes unrelated projects',async()=>{
 const h=reader();h.setRows([row('two'),row('one'),row('old','archived')]);const r=await h.api.readRegistryComparison(['one','two','old']);assert.deepEqual([...r.rows.map(x=>x.slug)],['one','two']);assert.equal((await h.api.readRegistryComparison(['one'])).error,true);
});
function uiHarness(path,imports={}){let slots=[],cursor=0,mount;const hooks={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef(initial){const i=cursor++;return slots[i]||=( {current:initial});},useEffect(fn){mount||=fn;}};const mod=load(path,{react:hooks,'react/jsx-runtime':jsx,'next/link':{default:'a'},...imports});return {render:props=>{cursor=0;return mod.default(props);},mount:()=>mount?.()};}
function find(node,p){if(Array.isArray(node))return node.flatMap(x=>find(x,p));if(!node||typeof node!=='object'||!node.props)return [];return [...(p(node)?[node]:[]),...find(node.props.children,p)];}
test('ownership UI inputs reach the calculator and affordability controls remain independently usable',()=>{
 const h=uiHarness('src/components/real-estate/BuyerPlanningStudio.tsx',{'@/lib/real-estate/buyer-planning':finance,'@/lib/real-estate/browser-download':{downloadResearchText:()=>true}});let tree=h.render();for(const [key,value] of Object.entries(assumptions)){find(tree,n=>n.type==='input'&&n.props.name===key)[0].props.onChange({target:{value:String(value)}});tree=h.render();}assert.ok(find(tree,n=>n.type==='dd').some(n=>String(n.props.children).includes('250,000')));find(tree,n=>n.type==='button'&&n.props.children==='Affordability')[0].props.onClick();tree=h.render();find(tree,n=>n.type==='input'&&n.props.name==='monthlyBudget')[0].props.onChange({target:{value:String(800000/120+350)}});tree=h.render();assert.ok(find(tree,n=>n.type==='dd').some(n=>String(n.props.children).includes('1,000,000')));
});
test('research storage failures retain session notes through later checklist edits',()=>{
 const storage=new Map();let blocked=false;const globals={localStorage:{getItem:k=>storage.get(k)??null,setItem(k,v){if(blocked)throw Error('denied');storage.set(k,v);}},window:{addEventListener(){},removeEventListener(){}}};
 // Pass the fake browser into a fresh module so no real device storage is touched.
 let slots=[],cursor=0,mount;const hooks={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>{slots[i]=v;}];},useRef(initial){const i=cursor++;return slots[i]||={current:initial};},useEffect(fn){mount||=fn;}};
 const {default:Workspace}=load('src/components/real-estate/ResearchWorkspace.tsx',{react:hooks,'react/jsx-runtime':jsx,'next/link':{default:'a'},'@/lib/real-estate/research-notes':notes,'@/lib/real-estate/browser-download':{downloadResearchText:()=>true}},globals);const render=()=>{cursor=0;return Workspace({properties:[{slug:'project-one',title:'Project One'}]});};storage.set(notes.RESEARCH_KEY,JSON.stringify({'project-one':{notes:'Old'},'project-two':{notes:'Deleted elsewhere'}}));render();mount();let tree=render();storage.set(notes.RESEARCH_KEY,JSON.stringify({'project-one':{notes:'Changed in another tab'}}));find(tree,n=>n.type==='select')[0].props.onChange({target:{value:'visited'}});assert.equal(JSON.parse(storage.get(notes.RESEARCH_KEY))['project-two'],undefined);assert.equal(JSON.parse(storage.get(notes.RESEARCH_KEY))['project-one'].notes,'Changed in another tab');const durable=storage.get(notes.RESEARCH_KEY);blocked=true;tree=render();find(tree,n=>n.type==='textarea')[0].props.onChange({target:{value:'Private questions'}});tree=render();find(tree,n=>n.type==='input'&&n.props.type==='checkbox')[0].props.onChange({target:{checked:true}});tree=render();assert.equal(find(tree,n=>n.type==='textarea')[0].props.value,'Private questions');assert.equal(find(tree,n=>n.type==='input'&&n.props.type==='checkbox')[0].props.checked,true);assert.match(find(tree,n=>n.props.role==='status')[0].props.children,/lost on reload/);assert.equal(storage.get(notes.RESEARCH_KEY),durable);
});

test('registry shell renders before any database read and rejects invalid filters without querying',async()=>{
 let reads=0;const {default:Page}=load('src/app/real-estate/registry/page.tsx',{'react/jsx-runtime':jsx,react:{Suspense:'suspense'},'next/link':{default:'a'},'./RegistryTable':{default:'registry-table'},'@/lib/seo/site':{isPublicLaunch:()=>false,siteUrl:p=>'https://www.gthproglobal.com'+p},'@/lib/real-estate/registry-search':search,'@/lib/real-estate/registry-reader':{readRegistryRecords:async()=>{reads++;return {rows:[],error:true,hasNext:false};}}});
 const shell=await Page({searchParams:Promise.resolve({})});assert.equal(reads,0);assert.ok(find(shell,n=>n.type==='h1').length);assert.ok(find(shell,n=>n.type==='suspense')[0].props.fallback);
 const invalid=await Page({searchParams:Promise.resolve({q:'a,or(id.gt.0)'})});assert.equal(reads,0);assert.ok(find(invalid,n=>n.props.role==='alert').length);
});
