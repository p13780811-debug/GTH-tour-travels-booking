import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=readFileSync(new URL('../src/lib/mobile/app-dashboard.ts',import.meta.url),'utf8');
const module={exports:{}};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:module.exports,module},{timeout:2000});
const {filterAppServices,appServices}=module.exports;
test('service category selection does not mix property records with travel bookings',()=>{
 const result=filterAppServices('property','');
 assert.ok(result.some(service=>service.href==='/app/property'));
 assert.ok(result.every(service=>service.pillar==='property'));
 assert.equal(filterAppServices('property','flights').length,0);
});
test('service search accepts case/whitespace and discovers useful airport synonyms',()=>{
 assert.equal(filterAppServices('all','  TAXI  ')[0]?.href,'/transfers');
 assert.equal(filterAppServices('travel','roaming')[0]?.href,'/flights/out/yesim');
 assert.ok(filterAppServices('tender','help').some(service=>service.href==='/tender/services'));
});
test('search input cannot create destinations outside the fixed service catalog',()=>{
 const before=JSON.stringify(appServices);
 for(const input of ['https://bad.example','<script>alert(1)</script>','x'.repeat(5000)])assert.equal(filterAppServices('all',input).length,0);
 assert.equal(JSON.stringify(appServices),before);
 assert.ok(appServices.every(service=>service.href.startsWith('/')&&!service.href.startsWith('//')));
});
