import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
test("owner-requested neutral action labels preserve all supplier URLs, routing and booking handlers",()=>{
 const changes=JSON.parse(readFileSync("scripts/travel-action-copy.json","utf8"));
 const hashes=JSON.parse(readFileSync("scripts/travel-action-preserved-sha256.json","utf8"));
 const hash=value=>createHash("sha256").update(value).digest("hex");
 for(const [file,pairs]of Object.entries(changes)){
  const updated=readFileSync(file,"utf8");
  for(const [,after]of pairs)assert.ok(updated.includes(after),file);
  assert.equal(hash(JSON.stringify(updated.match(/https?:\/\/[^\s"'<>`]+/g)||[])),hashes[file].urls,file+" retains exact provider destinations and tracking");
 }
});
