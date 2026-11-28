import test from "node:test";
import assert from "node:assert/strict";
import {readdirSync,readFileSync} from "node:fs";
import {join} from "node:path";
import ts from "typescript";

function* sources(directory){
 for(const entry of readdirSync(directory,{withFileTypes:true})){
  const path=join(directory,entry.name);
  if(entry.isDirectory())yield* sources(path);
  else if(/\.[cm]?[jt]sx?$/.test(entry.name))yield path;
 }
}
test("private Nuitee REST access stays confined to the reviewed free-currency server module",()=>{
 const violations=new Set();
 for(const path of sources("src")){
  const text=readFileSync(path,"utf8");if(!/nuitee|liteapi/i.test(text))continue;
  if(path==="src/lib/travel/nuitee-free-hotels.ts"){
   assert.match(text,/import "server-only"/);assert.match(text,/await reserveNuiteeRefresh\(\)/);assert.match(text,/GTH_HOTEL_CONTENT/);assert.doesNotMatch(text,/https:\/\/api\.liteapi\.travel/);continue;
  }
  if(["src/lib/travel/nuitee-free-currencies.ts","src/lib/travel/nuitee-hotel-content-core.ts"].includes(path)){
   const urls=[...text.matchAll(/https:\/\/api\.liteapi\.travel[^\s"'`]+/g)].map(match=>match[0]);
   assert.deepEqual(urls,[path.endsWith("nuitee-free-currencies.ts")?"https://api.liteapi.travel/v3.0/data/currencies":"https://api.liteapi.travel/v3.0/data/hotels"]);
   if(path.endsWith("nuitee-free-currencies.ts"))assert.match(text,/import "server-only"/);else assert.doesNotMatch(text,/process\.env|NEXT_PUBLIC_/);assert.match(text,/method:"GET"/);
   assert.doesNotMatch(text,/method:["'](?:POST|PATCH|DELETE)|\/data\/places|price.?index|hotels\/rates|book\.liteapi/i);
   continue;
  }
  const file=ts.createSourceFile(path,text,ts.ScriptTarget.Latest,true);
  const check=node=>{
   if(ts.isStringLiteralLike(node)||ts.isTemplateHead(node)){
    const literal=node.text.toLowerCase();
    if(/(?:^|\/)api(?:[.-][\w-]+)*\.liteapi\.travel(?:[/:]|$)/.test(literal)||/^(?:next_public_)?(?:nuitee|liteapi).*?(?:key|token|secret)$/.test(literal))violations.add(path);
   }
   if(ts.isPropertyAccessExpression(node)&&node.expression.getText(file)==="process.env"&&/^(?:NEXT_PUBLIC_)?(?:NUITEE|LITEAPI).*?(?:KEY|TOKEN|SECRET)$/.test(node.name.text))violations.add(path);
   ts.forEachChild(node,check);
  };
  check(file);
 }
 assert.deepEqual([...violations],[],"New supplier REST calls/private credentials require a separately verified no-charge entitlement; use the existing public widgets and White Label handoff.");
});

test("the native hotel-content binding uses only the shared fixed GET reader and persistent budget",()=>{
 const worker=readFileSync("scripts/cloudflare-hotel-content.mjs","utf8");
 assert.match(worker,/readHotelContent/);assert.match(worker,/this\.store\.transaction/);
 assert.match(worker,/if\(!await this\.reserve\(\)\)return null/);
 assert.match(worker,/MAX_MINUTE=10,MAX_DAY=200/);
 assert.doesNotMatch(worker,/https:\/\/api\.liteapi\.travel|data\/places|hotels\/rates|price.?index/);
 for(const path of sources("src")){
  if(path==="src/lib/travel/nuitee-free-hotels.ts"||path==="src/lib/travel/nuitee-hotel-content-core.ts")continue;
  assert.doesNotMatch(readFileSync(path,"utf8"),/from\s*["'][^"']*nuitee-hotel-content-core["']/,"Private reader must not be imported by another app module: "+path);
 }
});
