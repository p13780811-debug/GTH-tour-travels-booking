import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const page=read("src/app/destinations/page.tsx");
const client=read("src/components/destination/DestinationExplorerResults.tsx");

test("destination explorer retains search, geography, sort, pagination and source-backed catalog",()=>{
 for(const field of ["search","region","country","sort"])assert.ok(page.includes('name="'+field+'"'));
 for(const p of ['params.set("search", search)','params.set("country", country)','params.set("region", region)','params.set("sort", sort)','params.set("view", "list")'])assert.ok(page.includes(p),p);
 assert.match(page,/const perPage = 18/);
 assert.match(page,/filtered\.slice/);
 assert.match(page,/\.eq\("is_active", true\)/);
 assert.match(page,/<DestinationExplorerResults items=\{visible\} initialView=\{view\} page=\{page\}\/>/);
});

test("destination shortlist, 3-item comparison, private notes and grid/list have working handlers",()=>{
 assert.match(client,/useState<"grid"\|"list">/);
 assert.match(client,/onClick=\{\(\)=>changeView\("grid"\)\}/);
 assert.match(client,/onClick=\{\(\)=>changeView\("list"\)\}/);
 assert.match(client,/if\(selected\.length>=3\)/);
 assert.match(client,/localStorage\.setItem\(SAVED_KEY/);
 assert.match(client,/localStorage\.setItem\(NOTES_KEY/);
 assert.match(client,/dialog\.current\?\.showModal\(\)/);
 assert.match(client,/overflow-x-auto p-4 sm:p-6/);
 assert.match(client,/encodeURIComponent\(item\.slug\)/);
 for(const route of ['/hotels/results?city=','/tours?city=','/flights'])assert.ok(client.includes(route),route);
});

test("mobile sidebar, honest data labels, region rails and public SEO stay intact",()=>{
 assert.match(page,/lg:hidden/);
 assert.match(page,/lg:sticky lg:top-28 lg:block/);
 assert.match(client,/sm:grid-cols-2 xl:grid-cols-3/);
 assert.match(page,/Featured destinations horizontal rail/);
 assert.match(page,/rail\.items\.map/);
 assert.match(page,/Cities recently mapped by contributors/);
 assert.match(page,/editorial references/);
 assert.doesNotMatch(page,/AI Verified|guaranteed ticket|guaranteed hotel|Math\.random/);
 assert.doesNotMatch(page,/\.module\.css|\.css["']/);
});
