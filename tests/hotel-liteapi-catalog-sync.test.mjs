import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeLiteApiHotel,normalizeLiteApiList} from "../src/lib/travel/liteapi-view-model.ts";
import {parseArgs,summaryRow,nextSync} from "../scripts/hotels/sync-liteapi-catalog.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("LiteAPI documented list stars property is correctly shown",()=>{
 const source={id:"lp123",name:"Hotel Example",stars:3.5,city:"Dubai",country:"AE",main_photo:"https://images.example.com/123.jpg",hotelTypeId:204,facilityIds:[1,2]};
 const row=normalizeLiteApiList({data:[source]})[0];
 assert.equal(row.stars,3.5);
 assert.equal(row.image,source.main_photo);
 assert.deepEqual(row.amenities,[]); // ID codes are not facility descriptions
 const stored=summaryRow(source,"AE");
 assert.equal(stored.stars,3.5);
 assert.equal(stored.hotel_type_id,204);
 assert.equal(stored.country_code,"AE");
 assert.equal(stored.primary_image_url,source.main_photo);
});
test("Staged sync deduplicates by provider ID and resumes offsets",()=>{
 assert.deepEqual(nextSync({},200,100,100,700),{next_offset:300,status:"partial"});
 assert.deepEqual(nextSync({},300,100,70,370),{next_offset:0,status:"complete"});
 const opt=parseArgs(["--countries","AE,IN,AE","--pages","2"]);
 assert.deepEqual(opt.countries,["AE","IN"]);
 assert.equal(opt.dryRun,true);
 assert.throws(()=>parseArgs(["--all-countries","--city","Dubai"]));
 assert.throws(()=>parseArgs(["--country","NotACountry"]));
});
test("Source content storage is isolated from existing OSM and prevents public writes",()=>{
 const migration=read("supabase/migrations/20261020102000_liteapi_catalog.sql");
 const code=read("scripts/hotels/sync-liteapi-catalog.mjs");
 assert.match(migration,/is_published boolean NOT NULL DEFAULT false/);
 assert.match(migration,/ENABLE ROW LEVEL SECURITY/);
 assert.match(migration,/GRANT EXECUTE ON FUNCTION public\.liteapi_upsert_summaries\(jsonb\) TO service_role/);
 assert.match(migration,/PRIMARY KEY\(country_code,city_name\)/);
 assert.match(migration,/ON CONFLICT\(hotel_id\) DO UPDATE/);
 assert.doesNotMatch(code,/\.from\("hotel_catalog"\)|\.from\("hotels"\)/);
 assert.match(code,/detail\.id!==target\.hotel_id/);
 assert.match(code,/lastUpdatedAt:since/);
 assert.match(code,/--write/);
});
