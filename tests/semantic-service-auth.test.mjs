import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=readFileSync(new URL('../supabase/functions/gth-semantic-intelligence/service-auth.ts',import.meta.url),'utf8');
const {isServiceCaller}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source,{mode:'strip'})).toString('base64'));
const token=(claims)=>'header.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.test-signature';
const valid={iss:'supabase',role:'service_role',exp:Math.floor(Date.now()/1000)+3600};
test('current configured service key uses the existing authenticated path',async()=>{
 assert.equal(await isServiceCaller('Bearer configured-key','configured-key',async()=>{throw Error('Probe not needed');}),true);
});
test('rotated service JWT requires a successful private-table capability check',async()=>{
 const t=token(valid);let checked='';
 assert.equal(await isServiceCaller('Bearer '+t,'old-key',async value=>{checked=value;return true;}),true);
 assert.equal(checked,t);
 assert.equal(await isServiceCaller('Bearer '+t,'old-key',async()=>false),false);
 assert.equal(await isServiceCaller('Bearer '+t,'old-key',async()=>{throw Error('unavailable');}),false);
});
test('forged service claims never authorize without database verification',async()=>{
 assert.equal(await isServiceCaller('Bearer '+token(valid),'key',async()=>false),false);
});
test('anonymous, user, expired, wrong issuer and malformed callers fail closed',async()=>{
 for(const claims of [{...valid,role:'anon'},{...valid,role:'authenticated'},{...valid,exp:0},{...valid,iss:'foreign'}]){
  assert.equal(await isServiceCaller('Bearer '+token(claims),'key',async()=>{throw Error('Must not probe');}),false);
 }
 for(const h of [null,'','Basic key','Bearer nonsense','Bearer '+ 'x'.repeat(4097)])
  assert.equal(await isServiceCaller(h,'key',async()=>true),false);
});
