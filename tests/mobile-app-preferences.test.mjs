import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path,require=()=>{}){const mod={exports:{}};vm.runInNewContext(ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:mod.exports,module:mod,require},{timeout:2000});return mod.exports;}
const catalog=load('../src/lib/mobile/app-dashboard.ts');
const {emptyAppPreferences,parseAppPreferences,toggleAppFavourite,recordAppService,appServiceForPath}=load('../src/lib/mobile/app-preferences.ts',()=>catalog);
const json=value=>JSON.parse(JSON.stringify(value));
test('invalid, oversized and unsupported preferences reset safely',()=>{for(const raw of [null,'{','x'.repeat(4097),'null','{"version":2}'])assert.deepEqual(json(parseAppPreferences(raw)),{version:1,favourites:[],recent:[]});});
test('preferences allow only service IDs and discard arbitrary private fields',()=>{assert.deepEqual(json(parseAppPreferences(JSON.stringify({version:1,favourites:['hotels','hotels','https://bad.example','admin'],recent:['flights','flights','hotels'],customer:'private'}))),{version:1,favourites:['hotels'],recent:['flights','hotels']});});
test('favourites cap, removal and immutable updates preserve the original',()=>{const empty=emptyAppPreferences();let value=empty;for(const service of catalog.appServices)value=toggleAppFavourite(value,service.id);assert.equal(value.favourites.length,8);assert.equal(empty.favourites.length,0);const next=toggleAppFavourite(value,'hotels');assert.equal(next.favourites.length,7);assert.equal(value.favourites.length,8);assert.equal(toggleAppFavourite(value,'unknown'),value);});
test('recent history deduplicates, orders and caps without removing pins',()=>{let value={version:1,favourites:['hotels'],recent:[]};for(const id of ['hotels','flights','property','tenders','destinations','flights'])value=recordAppService(value,id);assert.deepEqual(json(value),{version:1,favourites:['hotels'],recent:['flights','destinations','tenders','property']});assert.equal(recordAppService(value,'unknown'),value);});
test('route history tracks only catalog app paths with segment boundaries',()=>{assert.equal(appServiceForPath('/app/hotels'),'hotels');assert.equal(appServiceForPath('/app/hotels/detail'),'hotels');assert.equal(appServiceForPath('/app/flights/prepare'),'flights');for(const path of ['/app','/admin','/app/flights-extra','https://bad.example/app/hotels'])assert.equal(appServiceForPath(path),undefined);});
