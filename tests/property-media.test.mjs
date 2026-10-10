import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';
const exports = {};
const source = ts.transpileModule(fs.readFileSync('src/lib/real-estate/approved-media.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
new Function('exports', source)(exports);
test('database URL alone never establishes property image approval', () => {
 assert.equal(exports.approvedMedia('unreviewed', 'https://images.unsplash.com/example'), undefined);
});
test('approval binds exact image to exact listing with source and permission evidence', () => {
 const media = { url: 'https://example.test/photo.jpg', kind: 'photo', source: 'Builder', permissionReference: 'review-1' };
 exports.APPROVED_PROPERTY_MEDIA.test = [media];
 assert.equal(exports.approvedMedia('test', media.url), media);
 assert.equal(exports.approvedMedia('other', media.url), undefined);
 assert.equal(exports.approvedMedia('test', 'https://example.test/other.jpg'), undefined);
 media.permissionReference = '';
 assert.equal(exports.approvedMedia('test', media.url), undefined);
 delete exports.APPROVED_PROPERTY_MEDIA.test;
});
