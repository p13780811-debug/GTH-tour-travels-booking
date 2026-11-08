import test from "node:test";
import assert from "node:assert/strict";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";
function budget(configured){let tick=0,calls=0;const env=configured?{UPSTASH_REDIS_REST_URL:"https://fixture.upstash.io",UPSTASH_REDIS_REST_TOKEN:"fixture"}:{};
 class RequestError extends Error{constructor(message,status){super(message);this.status=status;}}
 const api=loadTenderTs("src/lib/tender/read-budget.ts",{"server-only":{},"@/lib/security/request":{RequestError},"@/lib/security/rate-limit":{enforceRateLimit:async(req,scope,id)=>{calls++;assert.equal(scope,"tender_reads");assert.equal(id,"shared-public-catalogue");assert.equal(new URL(req.url).hostname,"www.gthproglobal.com");}}},{process:{env},Date:class extends Date{static now(){return tick;}}});
 return {api,calls:()=>calls,advance:ms=>tick+=ms};
}
test("configured limiter uses an environment-separated shared public refresh bucket without visitor identifiers",async()=>{const h=budget(true);await h.api.reserveTenderRefresh();assert.equal(h.calls(),1);assert.equal(h.api.tenderReadProtection(),"shared");});
test("no-Redis fallback rejects excess refreshes and resets by minute, while remaining explicitly per worker",async()=>{const h=budget(false);for(let i=0;i<30;i++)await h.api.reserveTenderRefresh();await assert.rejects(h.api.reserveTenderRefresh(),error=>error.status===429);h.advance(60000);await h.api.reserveTenderRefresh();assert.equal(h.api.tenderReadProtection(),"per-worker");assert.equal(h.calls(),0);});
