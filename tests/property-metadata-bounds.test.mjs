import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=readFileSync(new URL('../src/lib/real-estate/property-seo.ts',import.meta.url),'utf8');
const module={exports:{}};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,URL});
const {propertySeo}=module.exports;
const long={title:'1771 EWS AND 88 LIG TENEMENTS AT SURVEY NO 13 BHANDARLI TAL DIST THANE PMAY PROJECT '.repeat(4),location:'Mumbai Metropolitan Region '.repeat(5),rera_id:'P51800012345'};
test('long registry metadata fits search bounds without changing full source identity or its caveats',()=>{
 const before=JSON.stringify(long),meta=propertySeo(long);
 assert.ok(meta.title.length<=120); assert.ok(meta.description.length<=300);
 assert.match(meta.title,/MahaRERA.*GTH PRO$/); assert.match(meta.description,/P51800012345/);
 assert.match(meta.description,/does not confirm price, possession or availability/);
 assert.equal(JSON.stringify(long),before);
});
test('short names remain intact and reviewed inventory metadata never becomes a registry or valuation claim',()=>{
 const row={title:'Example Project',location:'Andheri East',active_inventory_count:1};
 const meta=propertySeo(row);
 assert.match(meta.title,/^Example Project Andheri East.*Reviewed Property Details.*GTH PRO$/);
 assert.doesNotMatch(meta.title,/MahaRERA|valuation|guaranteed/i);
 const huge=propertySeo({...row,title:'🏠 बहुमंजिला आवास '.repeat(30),location:'Location '.repeat(50)});
 assert.ok(huge.title.length<=118); assert.ok(huge.description.length<=300);
 assert.doesNotMatch(huge.title,/\uD800(?![\uDC00-\uDFFF])/u);
});
