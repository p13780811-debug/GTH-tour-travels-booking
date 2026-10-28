import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';
function load(path,imports={},globals={}){const testModule={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module:testModule,exports:testModule.exports,require:n=>{if(n in imports)return imports[n];throw Error(n)},URL,URLSearchParams,...globals});return testModule.exports;}
function find(tree,predicate){if(!tree||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(n=>find(n,predicate));return [...(predicate(tree)?[tree]:[]),...find(tree.props?.children,predicate)];}
function carousel(){
 const cells=[],pending=[],timers=new Map(),listeners=new Map();let cursor=0,serial=0,intersection,resizeObservers=0;
 const equal=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
 const react={useState(initial){const i=cursor++;if(!(i in cells))cells[i]={value:initial};return [cells[i].value,v=>cells[i].value=typeof v==='function'?v(cells[i].value):v]},useRef(initial){const i=cursor++;return cells[i]??(cells[i]={current:initial})},useCallback(fn,deps){const i=cursor++;if(!cells[i]||!equal(cells[i].deps,deps))cells[i]={value:fn,deps};return cells[i].value},useEffect(fn,deps){const i=cursor++;if(!cells[i]||!equal(cells[i].deps,deps)){const previous=cells[i];cells[i]={deps,cleanup:null};pending.push(()=>{previous?.cleanup?.();cells[i].cleanup=fn()})}}};
 const media={matches:false,addEventListener(_n,fn){listeners.set('motion',fn)},removeEventListener(){listeners.delete('motion')}};
 const doc={hidden:false,addEventListener(n,fn){listeners.set(n,fn)},removeEventListener(n){listeners.delete(n)}};
 const element={clientWidth:320,scrollLeft:0,scrollTo({left}){this.scrollLeft=left}};
 class Observer{constructor(fn){intersection=fn}observe(){intersection([{isIntersecting:true}])}disconnect(){}}
 class Resize{constructor(){resizeObservers++}observe(){}disconnect(){}}
 const {default:Carousel}=load('src/components/real-estate/PortalCarousel.tsx',{'react/jsx-runtime':jsx,react,'lucide-react':new Proxy({},{get:()=> 'icon'})},{document:doc,window:{matchMedia:()=>media,setInterval(fn){const id=++serial;timers.set(id,fn);return id},clearInterval(id){timers.delete(id)}},IntersectionObserver:Observer,ResizeObserver:Resize});
 const render=()=>{cursor=0;const tree=Carousel({label:'Gallery',slides:[{id:'a',label:'A',content:'A'},{id:'b',label:'B',content:'B'},{id:'c',label:'C',content:'C'}]});find(tree,n=>n.props['aria-label']==='Gallery slides')[0].props.ref.current=element;while(pending.length)pending.shift()();return tree};
 let tree=render();tree=render();
 return {render,timers,media,doc,listeners,element,get resizeObservers(){return resizeObservers},offscreen(){intersection([{isIntersecting:false}])},unmount(){for(const cell of cells)cell?.cleanup?.()},button(name){return find(tree,n=>n.type==='button'&&n.props['aria-label']===name)[0]},setTree(t){tree=t}};
}
test('carousel rotates, wraps, preserves one resize observer and keeps offscreen slides inert',()=>{
 const f=carousel();assert.equal(f.timers.size,1);f.timers.values().next().value();let tree=f.render();assert.equal(f.element.scrollLeft,320);assert.equal(find(tree,n=>n.props['aria-roledescription']==='slide'&&!n.props.inert)[0].props['aria-label'],'2 of 3: B');assert.equal(f.resizeObservers,1);
 for(let i=0;i<2;i++){f.timers.values().next().value();tree=f.render()}assert.equal(f.element.scrollLeft,0);assert.equal(f.resizeObservers,1);f.unmount();assert.equal(f.timers.size,0);assert.equal(f.listeners.size,0);
});
test('autoplay pauses for pointer, focus, explicit pause, hidden pages, reduced motion and offscreen slots',()=>{
 for(const condition of ['pointer','focus','pause','hidden','motion','offscreen']){const f=carousel();let tree=f.render();if(condition==='pointer')tree.props.onPointerEnter({pointerType:'mouse'});if(condition==='focus')tree.props.onFocusCapture();if(condition==='pause')find(tree,n=>n.props['aria-label']==='Pause Gallery')[0].props.onClick();if(condition==='hidden'){f.doc.hidden=true;f.listeners.get('visibilitychange')()}if(condition==='motion'){f.media.matches=true;f.listeners.get('motion')()}if(condition==='offscreen')f.offscreen();tree=f.render();assert.equal(f.timers.size,0,condition);find(tree,n=>n.props['aria-label']==='Next Gallery slide')[0].props.onClick();f.render();assert.equal(f.element.scrollLeft,320,'manual navigation remains available');f.unmount();}
});
test('existing buyer actions retain their destinations in distinct research sections',()=>{
 const page=fs.readFileSync('src/app/real-estate/page.tsx','utf8');
 for(const [text,href] of [['Private buyer workspace','/real-estate/saved#research-workspace'],['Ownership cost & affordability','/real-estate/tools#buyer-planning-studio'],['Search & compare registry projects','/real-estate/registry']])assert.ok(page.includes(`href="${href}" className="gth-btn`)&&page.includes(text));
 const preview=fs.readFileSync('src/components/real-estate/RegistryDiscovery.tsx','utf8');assert.match(preview,/Search, filter & compare registry projects/);assert.doesNotMatch(page,/aria-label="Buyer research tools"/);
});
test('affiliate promotion cards reuse validated single-click tracked routes without retired banner embeds',()=>{
 const partner=load('src/lib/travel/partner-search.ts');
 const {default:Promotions}=load('src/components/real-estate/CampaignPromotions.tsx',{'react/jsx-runtime':jsx,'next/image':{default:'image'},'lucide-react':{ArrowUpRight:'icon'},'@/lib/travel/partner-search':partner,'./PortalCarousel':{default:'carousel'}});
 const tree=Promotions({slot:'discovery'}),slides=find(tree,n=>n.type==='carousel')[0].props.slides;assert.equal(slides.length,3);
 for(const slide of slides){const link=slide.content;assert.equal(link.props.target,'_blank');assert.match(link.props.rel,/sponsored/);const params=new URL(link.props.href,'https://example.test').searchParams;const outbound=new URL(partner.buildPartnerSearch(Object.fromEntries(params)));assert.equal(outbound.hostname,'tp.media');assert.equal(outbound.searchParams.get('campaign_id'),'137');assert.equal(outbound.searchParams.get('marker'),'417668');assert.equal(outbound.searchParams.get('trs'),'504342');assert.ok(new URL(outbound.searchParams.get('u')).searchParams.get('query').includes(params.get('destination')))}
});
