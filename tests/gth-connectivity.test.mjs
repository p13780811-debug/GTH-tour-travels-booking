import test from "node:test";
import assert from "node:assert/strict";
import { validCoordinates, greatCircleMeters, nearestOsm, safeRoutingBase } from "../src/lib/real-estate/connectivity.ts";

test("coordinates reject imaginary 0,0, missing and invalid values",()=>{
 assert.equal(validCoordinates({lat:0,lng:0}),false);
 assert.equal(validCoordinates({lat:91,lng:73}),false);
 assert.equal(validCoordinates({lat:19.076,lng:72.8777}),true);
});
test("zero-distance and nearby metro straight-line measurements are deterministic",()=>{
 const origin={lat:19.076,lng:72.8777};
 assert.equal(greatCircleMeters(origin,origin),0);
 const subway=[
 {type:"node",id:1234,lat:19.078,lon:72.8777,tags:{name:"Example Station",railway:"station",station:"subway"}},
 {type:"node",id:999,lat:28.2,lon:77.3,tags:{name:"Far Station",railway:"station",station:"subway"}}];
 const result=nearestOsm(subway,origin,"metro");
 assert.ok(result&&result.distanceMeters>100&&result.distanceMeters<300);
 assert.equal(result.name,"Example Station");
 assert.equal(result.osmUrl,"https://www.openstreetmap.org/node/1234");
});
test("airport requires sourced IATA and never guesses drive minutes",()=>{
 const origin={lat:19.076,lng:72.8777};
 assert.equal(nearestOsm([{type:"node",id:1,lat:19.07,lon:72.88,tags:{aeroway:"aerodrome",name:"Unknown field"}}],origin,"airport"),null);
 const result=nearestOsm([{type:"node",id:2,lat:19.09,lon:72.87,tags:{aeroway:"aerodrome",iata:"BOM",name:"Airport"}}],origin,"airport");
 assert.equal(result?.name,"Airport");
});
test("unconfigured or internal routing endpoints are never used",()=>{
 assert.equal(safeRoutingBase(undefined),null);
 assert.equal(safeRoutingBase("http://localhost:5000/"),null);
 assert.equal(safeRoutingBase("https://127.0.0.1/"),null);
 assert.equal(safeRoutingBase("https://router.example.com/")?.origin,"https://router.example.com");
});
