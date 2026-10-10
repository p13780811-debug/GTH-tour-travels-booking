import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';
function load(path,deps={}) {
 const exports={};
 new Function('exports','require',ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exports,name=>deps[name]);
 return exports;
}
class RequestError extends Error { constructor(message,status) { super(message); this.status=status } }
function setup(current, error=null) {
 const calls=[];
 const client={from(){return {
  select(fields){calls.push(['select',fields]);return this},
  eq(field,value){calls.push(['eq',field,value]);return this},
  neq(field,value){calls.push(['neq',field,value]);return this},
  async maybeSingle(){return {data:current,error}},
  order(field){calls.push(['order',field]);return this},
  async limit(value){calls.push(['limit',value]);return {data:[{slug:'actual-related'}],error:null}},
 }}};
 const helper=load('src/lib/real-estate/related-properties.ts',{'@/lib/supabase':{supabase:client},'./propertyService':{PUBLIC_PROPERTY_FIELDS:'id,title,slug,city',transformProperty:row=>row},'@/lib/security/request':{RequestError}});
 return {helper,calls};
}
test('related inventory projects public fields, uses actual city, excludes current and bounds output',async()=>{
 const {helper,calls}=setup({city:'Mumbai',property_type:'Apartment'});
 await helper.relatedProperties('actual-project',6);
 assert.deepEqual(calls.filter(call=>call[0]==='select').map(call=>call[1]),['id,city,property_type','id,title,slug,city']);
 assert.ok(calls.some(call=>call[0]==='eq' && call[1]==='city' && call[2]==='Mumbai'));
 assert.ok(calls.some(call=>call[0]==='neq' && call[2]==='actual-project'));
 assert.ok(calls.some(call=>call[0]==='limit' && call[1]===6));
});
test('missing geography falls back only to recorded property type',async()=>{
 const {helper,calls}=setup({city:null,property_type:'Plot'});
 await helper.relatedProperties('actual-project');
 assert.ok(calls.some(call=>call[0]==='eq' && call[1]==='property_type' && call[2]==='Plot'));
});
test('missing relationship fields return no unrelated suggestions',async()=>{
 const {helper,calls}=setup({city:null,property_type:null});
 assert.deepEqual(await helper.relatedProperties('actual-project'),[]);
 assert.equal(calls.some(call=>call[0]==='limit'),false);
});
test('lookup failure is unavailable rather than empty success or fabricated property',async()=>{
 const {helper}=setup(null,{message:'private database error'});
 await assert.rejects(helper.relatedProperties('actual-project'),error=>error.status===503 && !error.message.includes('private'));
});
