import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';
const exports = {};
new Function('exports',ts.transpileModule(fs.readFileSync('src/lib/real-estate/saved.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exports);
test('saved references reject malformed storage, duplicates, URLs and path traversal',()=>{
 assert.deepEqual(exports.normalizeSaved(null),[]);
 assert.deepEqual(exports.normalizeSaved(['valid-slug','valid-slug','../admin','https://example.com',1]),['valid-slug']);
 assert.equal(exports.normalizeSaved(Array.from({length:80},(_,i)=>`listing-${i}`)).length,50);
});
