import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source=readFileSync(new URL("../src/lib/tender/intelligence.ts",import.meta.url),"utf8");
const transpiled=ts.transpileModule(source,{
  compilerOptions:{target:ts.ScriptTarget.ES2021,module:ts.ModuleKind.CommonJS,strict:true}
}).outputText;
const mod={exports:{}};
vm.runInNewContext(transpiled,{module:mod,exports:mod.exports,Date,Set,Number,RegExp},{timeout:2000});
const {prepareTenderIntelligence,industrySignals}=mod.exports;
const basic={
 title:"Procurement of solar and diagnostic laboratory equipment",
 summary:"Hospital equipment for a public health authority",
 sector:"goods",country_code:"IN",buyer:"Public Hospital",
 deadline_at:"2027-06-01T00:00:00Z",source_name:"World Bank",
 requirements_verified:false,eligibility_requirements:{}
};

test("Industry classification is transparent title/summary signal, not fake qualifications",()=>{
 const tags=Array.from(industrySignals(basic.title,basic.summary));
 assert.ok(tags.some(x=>x.id==="equipment"));
 assert.ok(tags.some(x=>x.id==="energy"));
 assert.ok(tags.some(x=>x.id==="health"));
 assert.equal(industrySignals("Ordinary procurement notice",null).length,0);
});
test("No independently verified requirements means no mandatory document invented",()=>{
 const report=prepareTenderIntelligence(basic,new Date("2026-10-15T00:00:00Z"));
 assert.equal(report.criteriaStatus,"not-published");
 assert.ok(report.tasks.length>4);
 assert.ok(Array.from(report.tasks).every(x=>x.source==="suggested"&&x.required===false));
 assert.ok(Array.from(report.attendance).every(x=>x.status==="confirm-at-source"));
 assert.equal(report.noticeStatus,"accepting-notices");
});
test("Only explicitly reviewed source requirements can be labelled mandatory",()=>{
 const unreviewed=prepareTenderIntelligence({...basic,eligibility_requirements:{
   required_documents:["Financial audit report"]
 }},new Date("2026-10-15T00:00:00Z"));
 assert.ok(Array.from(unreviewed.tasks).every(x=>!x.required));
 const reviewed=prepareTenderIntelligence({...basic,requirements_verified:true,eligibility_requirements:{
   required_documents:["Financial audit report","Financial audit report","", "X".repeat(400)]
 }},new Date("2026-10-15T00:00:00Z"));
 const required=Array.from(reviewed.tasks).filter(x=>x.required);
 assert.equal(required.length,1);
 assert.equal(required[0].title,"Financial audit report");
});
test("Expired notice is not presented as accepting new bids",()=>{
 const report=prepareTenderIntelligence({...basic,deadline_at:"2024-01-01T00:00:00Z"},new Date("2026-10-15T00:00:00Z"));
 assert.equal(report.noticeStatus,"deadline-passed");
});

const css=readFileSync(new URL("../src/app/globals.css",import.meta.url),"utf8");
test("Day readability tokens improved without changing size or night tokens",()=>{
 const root=css.split("html.dark {")[0];
 const dark=css.slice(css.indexOf("html.dark {"),css.indexOf("/* 🔥 BODY */"));
 assert.match(root,/--text-soft:\s*rgba\(17, 24, 39, 0\.83\)/);
 assert.match(root,/--text-muted:\s*rgba\(17, 24, 39, 0\.72\)/);
 assert.match(root,/--bg:\s*#f7f8fb/);
 assert.match(dark,/--bg:\s*#060b12/);
 assert.match(dark,/--text-soft:\s*rgba\(255, 255, 255, 0\.74\)/);
 assert.match(css,/\.gth-btn-gold\s*\{[\s\S]*?min-height:\s*46px/);
 assert.match(css,/\.gth-master-home\s*\{/);
});
