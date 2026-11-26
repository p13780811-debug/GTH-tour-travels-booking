import {readFileSync} from "node:fs";
import {test} from "node:test";
import assert from "node:assert/strict";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";

const traffic=loadTenderTs("src/lib/mobility/traffic.ts");
const language=loadTenderTs("src/lib/mobility/traffic-language.ts");
const {trafficDraft}=loadTenderTs("src/lib/mobility/traffic-voice.ts",{"./traffic":traffic,"./traffic-language":language});
const zones=[
  {id:"dadar",label:"Dadar",localLabel:"दादर"},
  {id:"bkc",label:"Bandra Kurla Complex",localLabel:"वांद्रे कुर्ला संकुल"},
];

test("traffic languages have translated labels and resolve device locale",()=>{
  assert.equal(Object.keys(language.TRAFFIC_LANGUAGES).length,13);
  assert.equal(language.trafficLanguage("ta-IN"),"ta");
  assert.equal(language.trafficLanguage("ur-PK"),"ur");
  assert.equal(language.trafficLanguage("de-DE"),"en");
  for(const locale of Object.keys(language.TRAFFIC_LANGUAGES)){
    const labels=Object.values(language.trafficLabels(locale));
    assert.equal(labels.length,36);
    assert.ok(labels.every(value=>typeof value==="string"&&value.length>0),locale);
  }
});

test("multilingual speech fills a draft conservatively",()=>{
  const tamil=trafficDraft("தாதர் போக்குவரத்து நெரிசல்",zones,"ta");
  assert.equal(tamil.zone,"dadar");
  assert.equal(tamil.kind,"jam");
  const hindi=trafficDraft("दादर सड़क बंद",zones,"hi");
  assert.equal(hindi.zone,"dadar");
  assert.equal(hindi.kind,"closure");
  const ambiguous=trafficDraft("Dadar and BKC, road closed and road clear",zones,"en");
  assert.equal(ambiguous.zone,null);
  assert.equal(ambiguous.kind,null);
  assert.equal(trafficDraft("traffic update",zones,"en").zone,null);
});

test("unsupported cities and expired reports never enter the city feed",()=>{
  assert.equal(traffic.trafficCityFor({name:"Mumbai",countryCode:"US"}),null);
  assert.equal(traffic.trafficCityFor({name:"Kolkata",countryCode:"IN"}),"kolkata");
  const reports=[
    {id:"old",zone:"dadar",expiresAt:"2026-11-24T12:00:00Z"},
    {id:"new",zone:"dadar",expiresAt:"2026-11-24T13:00:00Z"},
    {id:"other",zone:"bkc",expiresAt:"2026-11-24T13:00:00Z"},
  ];
  assert.equal(traffic.reportsForZone(reports,"dadar",Date.parse("2026-11-24T12:00:00Z")).map(report=>report.id).join(","),"new");
});

const osm=loadTenderTs("src/lib/mobility/osm.ts");
test("global traffic keys and map requests are city scoped",()=>{
  assert.equal(traffic.trafficCityFor({name:"Paris",slug:"paris-fr",countryCode:"FR"}),"d:paris-fr");
  assert.equal(traffic.trafficCityFor({name:"Kolkata",slug:"kolkata",countryCode:"IN"}),"kolkata");
  assert.equal(traffic.isTrafficCity("d:paris?x"),false);
  const query=osm.mobilityOverpassQuery({name:"Paris",countryCode:"FR"});
  assert.match(query,/ISO3166-1"="FR/);
  assert.match(query,/around\.place:8000/);
  assert.equal(osm.mobilityOverpassQuery({name:'Paris");out;',countryCode:"FR"}),null);
});
test("OSM mapped features reject ambiguous, incomplete or untrusted responses",()=>{
  const base={osm3s:{timestamp_osm_base:"2026-11-24T12:00:00Z"}};
  const center={type:"node",id:10};
  const camera={type:"node",id:20,tags:{highway:"speed_camera",website:"https://example.com"}};
  const station={type:"way",id:30,tags:{railway:"station",name:"Central"}};
  assert.equal(osm.parseMobilityMap({...base,remark:"timed out",elements:[center,camera]}),null);
  assert.equal(osm.parseMobilityMap({...base,elements:[center,{...center,id:11},camera]}),null);
  const result=osm.parseMobilityMap({...base,elements:[center,camera,camera,station]});
  assert.equal(result.features.length,2);
  assert.equal(result.features[0].href,"https://www.openstreetmap.org/node/20");
  assert.equal(result.features[1].kind,"transit");
});

test("reviewed Mumbai and Kolkata map centres avoid nationwide queries without weakening generic city validation",()=>{
  for(const city of [{name:"Mumbai",slug:"mumbai",countryCode:"IN"},{name:"Kolkata",slug:"kolkata",countryCode:"IN"}]){
    assert.ok(osm.reviewedMapCentre(city));
    assert.match(osm.mobilityOverpassQuery(city),/around:8000,[\d.]+,[\d.]+/);
    assert.doesNotMatch(osm.mobilityOverpassQuery(city),/area\.country/);
  }
  assert.equal(osm.reviewedMapCentre({name:"Mumbai",slug:"mumbai",countryCode:"US"}),undefined);
  const snapshot={osm3s:{timestamp_osm_base:"2026-11-24T12:00:00Z"},elements:[{type:"node",id:30,tags:{railway:"station",name:"Central"}}]};
  assert.equal(osm.parseMobilityMap(snapshot),null);
  assert.equal(osm.parseMobilityMap(snapshot,true).features.length,1);
  assert.equal(osm.parseMobilityMap({...snapshot,remark:"partial"},true),null);
});

test("Mumbai dated extract is real, city-scoped, bounded and expires rather than faking live data",()=>{
  const raw=JSON.parse(readFileSync("src/lib/mobility/mumbai-osm-snapshot.json","utf8"));
  const city={name:"Mumbai",slug:"mumbai",countryCode:"IN"};
  const now=Date.parse(raw.updatedAt)+86400000;
  const result=osm.validatedMumbaiSnapshot(raw,city,now);
  assert.equal(result.source,"dated-osm-extract");
  assert.ok(result.features.length>=5);
  assert.equal(osm.validatedMumbaiSnapshot(raw,{...city,slug:"kolkata"},now),null);
  assert.equal(osm.validatedMumbaiSnapshot(raw,city,now+31*86400000),null);
  assert.equal(osm.validatedMumbaiSnapshot({...raw,features:[]},city,now),null);
  assert.equal(osm.validatedMumbaiSnapshot({...raw,features:[...raw.features,{kind:"transit",name:"bad",href:"https://example.com"}]},city,now),null);
});

 test("public Mumbai snapshot fast path preserves date, schema, cache and refresh semantics",async()=>{
 const raw=JSON.parse(readFileSync("src/lib/mobility/mumbai-osm-snapshot.json","utf8"));
 const {publicMumbaiMapResponse}=loadTenderTs("src/lib/mobility/public-map-snapshot.ts",{"./osm":osm,"./mumbai-osm-snapshot.json":{default:raw}});
 const now=Date.parse(raw.updatedAt)+86400000;
 const request=(query,method="GET",path="/api/mobility/map")=>new Request("https://example.com"+path+query,{method});
 const response=publicMumbaiMapResponse(request("?city=mumbai"),now);
 assert.equal(response.status,200);
 assert.match(response.headers.get("cache-control"),/s-maxage=21600/);
 const result=await response.json();
 assert.equal(result.state,"available");
 assert.equal(result.source,"dated-osm-extract");
 assert.equal(result.updatedAt,raw.updatedAt);
 assert.ok(result.features.length>=5);
 assert.equal(publicMumbaiMapResponse(request("?city=mumbai&refresh=1"),now),null);
 assert.equal(publicMumbaiMapResponse(request("?city=kolkata"),now),null);
 assert.equal(publicMumbaiMapResponse(request("?city=mumbai","POST"),now),null);
 assert.equal(publicMumbaiMapResponse(request("?city=mumbai","GET","/api/mobility/traffic"),now),null);
 assert.equal(publicMumbaiMapResponse(request("?city=mumbai"),now+31*86400000),null);
 });
