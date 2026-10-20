import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source=readFileSync(new URL('../src/lib/tender/calendar.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
vm.runInNewContext(code,{module:mod,exports:mod.exports,URL,TextEncoder,Date},{timeout:2000});
const {buildTenderDeadlineCalendar}=mod.exports;
const now=new Date('2026-10-20T12:00:00Z');
const notice={id:'16351bf1-452e-4f3e-a895-7a6a805f73b2',title:'Supply and Installation of Prefabricated toilets for the SWM facility',deadline_at:'2026-10-26T00:00:00Z',source_name:'World Bank',source_url:'https://projects.worldbank.org/en/projects-operations/procurement-detail/OP00473134'};
const unfold=value=>value.replace(/\r\n[ \t]/g,'');

test('download keeps the complete official URL and recorded UTC deadline',()=>{
  const calendar=unfold(buildTenderDeadlineCalendar(notice,now));
  assert.match(calendar,/DTSTART:20261026T000000Z\r\n/);
  assert.ok(calendar.includes('\r\nURL:'+notice.source_url+'\r\n'));
  assert.ok(calendar.split('\r\n').find(line=>line.startsWith('DESCRIPTION:')).endsWith(notice.source_url));
  assert.match(calendar,/TRIGGER:-P1D/);
});
test('Unicode calendar lines fold at 75 UTF-8 octets without damaging text',()=>{
  const title='मुंबई 🏗️ '.repeat(30);
  const calendar=buildTenderDeadlineCalendar({...notice,title},now);
  for(const line of calendar.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75,line);
  assert.ok(unfold(calendar).includes('SUMMARY:Tender deadline — '+title.slice(0,222)));
  assert.equal(Buffer.from(calendar).toString('utf8'),calendar);
});
test('long source links remain intact after folding rather than being truncated',()=>{
  const source_url='https://authority.example/notice/'+('a'.repeat(1500))+'?ref=OP00473134';
  const calendar=unfold(buildTenderDeadlineCalendar({...notice,source_url},now));
  assert.ok(calendar.includes('\r\nURL:'+source_url+'\r\n'));
  assert.ok(calendar.split('\r\n').find(line=>line.startsWith('DESCRIPTION:')).endsWith(source_url));
});
test('source URLs reject credentials, unsafe schemes and injected calendar lines',()=>{
  for(const source_url of ['javascript:alert(1)','http://authority.example/notice','https://user:secret@authority.example/notice','https://authority.example/\r\nATTENDEE:bad@example.test','https://authority.example/'+('x'.repeat(2050))]){
    const calendar=unfold(buildTenderDeadlineCalendar({...notice,title:'Notice\r\nATTENDEE:bad',source_name:'Buyer\r\nATTENDEE:bad',source_url},now));
    assert.doesNotMatch(calendar,/(?:^|\r\n)(?:URL|ATTENDEE):/);
    assert.equal(calendar.split('\r\n').filter(line=>line==='BEGIN:VEVENT').length,1);
  }
});
test('passed or invalid deadlines cannot create a reminder',()=>{
  for(const deadline_at of ['invalid','2026-10-20T12:00:00Z','2026-10-19T00:00:00Z'])assert.equal(buildTenderDeadlineCalendar({...notice,deadline_at},now),null);
});
