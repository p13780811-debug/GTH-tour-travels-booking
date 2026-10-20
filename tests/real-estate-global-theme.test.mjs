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
const appearances=/^(?:bg-|rounded|border|shadow|font-|p[xytrbl]?-[\d[]|text-(?!left$|center$|right$|justify$))/;
function brandedButtons(html){
 const tags=[...html.matchAll(/<button\b[^>]*>/g)];assert.ok(tags.length,'Rendered controls are required');
 for(const [tag] of tags){
  const classes=/class="([^"]*)"/.exec(tag)?.[1].split(/\s+/)||[];
  assert.ok(classes.includes('gth-btn'),tag);
  assert.deepEqual(classes.filter(x=>appearances.test(x)),[],tag);
 }
 return tags.length;
}
test('all eleven category choices remain visible and use the shared global button system',()=>{
 const {default:Filters}=load('src/components/real-estate/DiscoveryFilters.tsx');
 const html=renderToStaticMarkup(React.createElement(Filters,{expanded:true,onApply(){}}));
 assert.equal(brandedButtons(html),13); // All + ten categories + Apply / Reset.
 for(const name of ['Residential / Group Housing','Mixed-use development','Commercial','Penthouse','Individual plot'])assert.ok(html.includes(name));
 assert.doesNotMatch(html,/overflow-[xy]-auto|max-h-|line-clamp/);
 assert.match(html,/aria-pressed="true"/);
});
test('hero search, purposes and ranking controls inherit global button appearance',()=>{
 const {default:Hero}=load('src/components/real-estate/ExplorerHero.tsx',{'next/link':link});
 const html=renderToStaticMarkup(React.createElement(Hero,{query:'',onQuery(){},onSearch(){},loading:false,intent:'',onIntent(){},onInfo(){}}));
 assert.equal(brandedButtons(html),7);
 assert.match(html,/aria-label="Property search purpose"/);
});
test('buyer modal modes and submission keep the global theme and accessible native controls',()=>{
 const {default:Modal}=load('src/components/property/LeadModal.tsx',{'next/link':link,'@/lib/real-estate/buyer-leads':buyer,'./PropertyDialog':{default:({children})=>React.createElement('section',{role:'dialog'},children)}});
 const html=renderToStaticMarkup(React.createElement(Modal,{property:{id:1,title:'Registered project',slug:'registered-project'},initialIntent:'pricing_enquiry',onClose(){}}));
 assert.equal(brandedButtons(html),4);
 assert.match(html,/<input(?=[^>]*name="consent")(?=[^>]*required)[^>]*>/);
 assert.match(html,/aria-label="Enquiry type"/);
});
test('Explorer CSS controls layout without overriding global button appearance or locking the category sidebar',()=>{
 const css=postcss.parse(readFileSync('src/components/real-estate/Explorer.module.css','utf8'));
 const controlled=/\bbutton\b|\.(?:button|iconButton|filterToggle|save|rank|compareClear)(?![\w-])/;
 const protectedProperty=/^(?:background|color|border|box-shadow|font|padding|outline|letter-spacing|filter|opacity)(?:-|$)/;
 css.walkRules(rule=>{
  if(controlled.test(rule.selector))rule.walkDecls(d=>assert.equal(protectedProperty.test(d.prop),false,`${rule.selector}: ${d.prop}`));
  if(rule.selector==='.sidebar')rule.walkDecls(d=>{
   if(d.prop==='position')assert.equal(d.value,'static');
   if(d.prop==='max-height')assert.equal(d.value,'none');
   if(d.prop==='overflow')assert.equal(d.value,'visible');
  });
 });
 const global=postcss.parse(readFileSync('src/app/globals.css','utf8'));
 for(const selector of ['.gth-btn','.gth-btn-gold']){
  const declarations=[];global.walkRules(selector,r=>r.walkDecls(d=>declarations.push([d.prop,d.value])));
  assert.ok(declarations.some(([p,v])=>p==='background'&&v==='var(--btn-bg)'));
  assert.ok(declarations.some(([p,v])=>p==='color'&&v==='var(--btn-text)'));
 }
});
