import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const code=readFileSync(new URL("../src/app/api/bookings/route.ts",import.meta.url),"utf8");
test("hotel booking request writer stays server-only and never opens public RLS",()=>{
  assert.match(code,/process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(code,/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE|import \{ supabase \}/);
  assert.match(code,/persistSession:false/);
  assert.match(code,/enforceRateLimit\(req, "bookings"\)/);
  assert.match(code,/safeHotelId\(hotelId\)/);
});
test("booking requests must refer to an actual public property or OSM directory entry",()=>{
  assert.match(code,/from\("hotel_catalog"\)/);
  assert.match(code,/from\("hotels"\)/);
  assert.match(code,/media_rights_verified/);
  assert.match(code,/is_public/);
  assert.match(code,/Hotel not found/);
  assert.doesNotMatch(code,/select\("\*"\)/);
});
test("booking requests remain requests, never fabricated confirmed reservations",()=>{
  assert.match(code,/request_received/);
  assert.match(code,/reservation is not confirmed/);
  assert.match(code,/checkin < today/);
  assert.match(code,/nights > 90/);
});
