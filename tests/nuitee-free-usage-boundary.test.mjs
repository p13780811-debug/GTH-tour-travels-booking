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
  if(path==="src/lib/travel/nuitee-free-currencies.ts"){
   const urls=[...text.matchAll(/https:\/\/api\.liteapi\.travel[^\s"'`]+/g)].map(match=>match[0]);
   assert.deepEqual(urls,["https://api.liteapi.travel/v3.0/data/currencies"]);
   assert.match(text,/import "server-only"/);assert.match(text,/method:"GET"/);
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
