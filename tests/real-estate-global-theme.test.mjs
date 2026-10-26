import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import postcss from 'postcss';

const require=createRequire(import.meta.url);
const styles=new Proxy({},{get:(_target,key)=>String(key)});
function load(path,extra={}){
 const exports={};
 const js=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('exports','require',js)(exports,name=>name in extra?extra[name]:name.endsWith('.module.css')?{default:styles}:require(name));
 return exports;
}
const link={default:({children,...props})=>React.createElement('a',props,children)};
const buyer=load('src/lib/real-estate/buyer-leads.ts');
const buttons=html=>[...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map(match=>match[0]);
function findButton(tags,text){
 const tag=tags.find(tag=>tag.includes(text));
 assert.ok(tag,`Missing button: ${text}`);
 return tag;
}
function globalCta(tag){
 assert.match(tag,/<button\b[^>]*class="[^"]*\bgth-btn\b/);
}
function neutralControl(tag){
 assert.doesNotMatch(tag,/<button\b[^>]*class="[^"]*\bgth-btn\b/);
}

test('all marketplace categories remain visible as neutral filter selections, not conversion buttons',()=>{
 const {default:Filters}=load('src/components/real-estate/DiscoveryFilters.tsx');
 const html=renderToStaticMarkup(React.createElement(Filters,{expanded:true,onApply(){}}));
 const tags=buttons(html);
 assert.equal(tags.length,8); // All, five inventory types, Apply and Reset
 for(const name of ['All property categories','Apartment','Villa','Commercial','Penthouse','Individual plot']){
  neutralControl(findButton(tags,name));
  assert.ok(html.includes(name));
 }
 globalCta(findButton(tags,'Apply filters'));
 neutralControl(findButton(tags,'Reset filters'));
 assert.doesNotMatch(html,/overflow-[xy]-auto|max-h-|line-clamp/);
 assert.match(html,/aria-pressed="true"/);
});

test('hero purpose tabs and info links stay neutral; Explore properties is the branded CTA',()=>{
 const {default:Hero}=load('src/components/real-estate/ExplorerHero.tsx',{'next/link':link});
 const html=renderToStaticMarkup(React.createElement(Hero,{query:'',onQuery(){},onSearch(){},loading:false,intent:'',onIntent(){},onInfo(){}}));
 const tags=buttons(html);
 assert.equal(tags.length,18);
 for(const label of ['Ranking explained','Source &amp; review status','Buy','Rent','New Launches','Commercial','Plots','Registry Lookup','About this data'])neutralControl(findButton(tags,label));
 globalCta(findButton(tags,'Explore properties'));
 assert.match(html,/aria-label="Property search purpose"/);
});

test('buyer enquiry modes are tabs, submit is the real CTA, and consent stays required',()=>{
 const {default:Modal}=load('src/components/property/LeadModal.tsx',{'next/link':link,'@/lib/real-estate/buyer-leads':buyer,'./PropertyDialog':{default:({children})=>React.createElement('section',{role:'dialog'},children)}});
 const html=renderToStaticMarkup(React.createElement(Modal,{property:{id:1,title:'Registered project',slug:'registered-project'},initialIntent:'pricing_enquiry',onClose(){}}));
 const tags=buttons(html);
 assert.equal(tags.length,4);
 for(const label of ['Price breakup','Brochure &amp; plans','Site visit'])neutralControl(findButton(tags,label));
 globalCta(findButton(tags,'Send project enquiry'));
 assert.match(html,/<input(?=[^>]*name="consent")(?=[^>]*required)[^>]*>/);
 assert.match(html,/aria-label="Enquiry type"/);
});

test('scoped Real Estate control styling uses existing global theme tokens and preserves full-height sidebar',()=>{
 const css=postcss.parse(readFileSync('src/components/real-estate/Explorer.module.css','utf8'));
 const selectors=new Map();
 css.walkRules(rule=>{
  const defs=[];rule.walkDecls(d=>defs.push([d.prop,d.value]));
  selectors.set(rule.selector,defs);
  if(rule.selector==='.sidebar'){
   for(const [property,value] of defs){
    if(property==='position')assert.equal(value,'static');
    if(property==='max-height')assert.equal(value,'none');
    if(property==='overflow')assert.equal(value,'visible');
   }
  }
 });
 for(const selector of ['.searchIntent button','.searchIntent button[aria-pressed=true]','.iconButton','.save','.rank']){
  assert.ok(selectors.has(selector),`Missing scoped neutral control rule: ${selector}`);
 }
 assert.ok(selectors.get('.searchIntent button[aria-pressed=true]').some(([p,v])=>p==='border-bottom-color'&&v==='var(--gold)'));
 const global=postcss.parse(readFileSync('src/app/globals.css','utf8'));
 for(const selector of ['.gth-btn','.gth-btn-gold']){
  const declarations=[];global.walkRules(selector,r=>r.walkDecls(d=>declarations.push([d.prop,d.value])));
  assert.ok(declarations.some(([p,v])=>p==='background'&&v==='var(--btn-bg)'));
  assert.ok(declarations.some(([p,v])=>p==='color'&&v==='var(--btn-text)'));
 }
});
