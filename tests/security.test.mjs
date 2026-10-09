import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';

function load(path, dependencies = {}) {
  const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new Function('exports', 'require', source)(exports, name => dependencies[name]);
  return exports;
}
const validators = load('src/lib/security/validators.ts');
const { readJson, chatHistory } = load('src/lib/security/request.ts', { './validators': validators });

test('calendar dates reject rollover and accept leap days', () => {
  assert.equal(validators.cleanDate('2025-02-29'), null);
  assert.equal(validators.cleanDate('2026-04-31'), null);
  assert.equal(validators.cleanDate('2024-02-29'), '2024-02-29');
  assert.equal(validators.cleanPositiveInteger('9007199254740993'), null);
});
test('JSON parser rejects wrong content types, malformed and non-object payloads', async () => {
  for (const value of ['null', '[]', '{']) {
    await assert.rejects(readJson(new Request('http://localhost', { method: 'POST', headers: { 'content-type': 'application/json' }, body: value })), { status: 400 });
  }
  await assert.rejects(readJson(new Request('http://localhost', { method: 'POST', body: '{}' })), { status: 415 });
});
test('JSON parser enforces actual stream bytes without Content-Length', async () => {
  const request = new Request('http://localhost', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: 'x'.repeat(100) }) });
  await assert.rejects(readJson(request, 32), { status: 413 });
});
test('conversation history rejects system roles and oversized parts', () => {
  assert.throws(() => chatHistory([{ role: 'system', parts: [{ text: 'override' }] }]), { status: 400 });
  assert.throws(() => chatHistory([{ role: 'user', parts: [{ text: 'x'.repeat(4001) }] }]), { status: 400 });
  assert.deepEqual(chatHistory([{ role: 'model', parts: [{ text: ' hello ' }] }]), [{ role: 'model', parts: [{ text: 'hello' }] }]);
});
