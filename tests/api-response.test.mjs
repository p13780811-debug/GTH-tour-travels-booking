import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';
const exports = {};
const source = ts.transpileModule(fs.readFileSync('src/lib/api-response.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
new Function('exports', source)(exports);
const { readApiJson, readAIReply } = exports;

test('AI client shows rate-limit retry and never exposes provider error details', async () => {
  await assert.rejects(readApiJson(Response.json({ error: 'private provider details' }, { status: 429, headers: { 'Retry-After': '45' } })), { message: 'Request limit reached. Try again in 45 seconds.' });
  await assert.rejects(readApiJson(Response.json({ error: 'private provider details' }, { status: 503 })), { message: 'This service is temporarily unavailable. Please try again later.' });
});
test('AI client rejects missing or malformed replies before adding chat history', async () => {
  for (const body of [null, {}, { reply: null }, { reply: [] }, { reply: '  ' }]) {
    await assert.rejects(readAIReply(Response.json(body)));
  }
  assert.equal(await readAIReply(Response.json({ reply: 'Valid answer' })), 'Valid answer');
});
