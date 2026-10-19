import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const code=readFileSync(new URL("../scripts/hotels/generate_travelpayouts_klook_links.py",import.meta.url),"utf8");
test("Bulk hotel affiliate generation uses the official API, token header and valid 10-link batches",()=>{
 assert.match(code,/https:\/\/api\.travelpayouts\.com\/links\/v1\/create/);
 assert.match(code,/X-Access-Token/);
 assert.match(code,/valid\[start:start\+10\]/);
 assert.match(code,/sleeper\(0\.75\)/);
 assert.match(code,/TRAVELPAYOUTS_TRS/);
 assert.match(code,/TRAVELPAYOUTS_MARKER/);
});
test("Actual Klook hotel identities, not name slugs alone, are required",()=>{
 assert.match(code,/KLOOK_PATH/);
 assert.match(code,/match\.group\(1\) != ident/);
 assert.match(code,/www\.klook\.com/);
 assert.match(code,/Duplicate OSM hotel and partner program/);
});
test("Link generation is safe, opt-in and separate from admin review/publication",()=>{
 assert.match(code,/parser\.add_argument\("--generate"/);
 assert.match(code,/if not args\.generate/);
 assert.match(code,/output\.open\("w"/);
 assert.match(code,/No verified affiliate response/);
 assert.match(code,/supabase_mutated": False/);
 assert.doesNotMatch(code,/service_role_key|supabase\.from|hotel_booking_links\?on_conflict|active": True/i);
});
