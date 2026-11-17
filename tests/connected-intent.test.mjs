import test from 'node:test';
import assert from 'node:assert/strict';
import {parseGthIntent, connectedIntentLinks} from '../src/lib/search/connected-intent.ts';
const places=['Mumbai','Kolkata','Dubai','London'];
test('Dubai cross-sector query preserves unknown currency and requires verification',()=>{
  const plan=parseGthIntent('Dubai mein 5 crore ka luxury apartment jiske paas naya government tender aur metro project pass hua ho',places);
  assert.deepEqual(plan.sectors,['property','tender']);
  assert.equal(plan.place,'Dubai');
  assert.equal(plan.budget?.amount,50_000_000);
  assert.equal(plan.budget?.currency,null);
  assert.equal(plan.needsVerifiedCrossSectorMatch,true);
  assert.deepEqual(connectedIntentLinks(plan).map(x=>x.href),[
    '/real-estate?city=Dubai&type=Apartment#listing-results',
    '/tender?q=Dubai+metro&scope=world#tender-find',
  ]);
});
test('explicit INR ceiling adds a safe filter without FX conversion',()=>{
  const plan=parseGthIntent('Mumbai villa under INR 2 crore',places);
  assert.equal(plan.budget?.currency,'INR');
  assert.equal(plan.budget?.upperBound,true);
  assert.match(connectedIntentLinks(plan)[0].href,/maxPrice=20000000/);
});
test('no implicit currency for foreign market',()=>{
  const plan=parseGthIntent('Dubai apartment under 5 crore',places);
  assert.equal(plan.budget?.currency,null);
  assert.doesNotMatch(connectedIntentLinks(plan)[0].href,/maxPrice/);
});
test('unknown places are never geocoded or invented',()=>assert.equal(parseGthIntent('apartments in Imaginaryopolis',places).place,null));
test('only internal URLs for malicious looking input',()=>{
  const plan=parseGthIntent('Mumbai apartment tender https://evil.test',places);
  assert.ok(connectedIntentLinks(plan).every(x=>x.href.startsWith('/')));
});
test('unmatched text has no invented sector',()=>{
  const plan=parseGthIntent('hello there',places);
  assert.deepEqual(plan.sectors,[]);
  assert.deepEqual(connectedIntentLinks(plan),[]);
});
