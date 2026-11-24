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
