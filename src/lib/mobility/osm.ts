import type {MobilityCity} from "./city";

export type MapKind="camera"|"transit"|"roadwork";
export type MobilityMapFeature={name:string;kind:MapKind;href:string};
export type MobilityMapData={updatedAt:string;features:MobilityMapFeature[];source?:"overpass"|"dated-osm-extract"};

// Reviewed city-centre coordinates from OpenStreetMap wiki Mumbai and Kolkata.
// Fixed, country-scoped centres avoid expensive nationwide name/area lookups.
const MAP_CENTRES:Readonly<Record<string,readonly [number,number]>>={
  "IN:mumbai":[19.0364194,72.8594694],
  "IN:kolkata":[22.56,88.42],
};
export function reviewedMapCentre(city:MobilityCity){
  const key=city.countryCode+":"+city.slug;
  return Object.prototype.hasOwnProperty.call(MAP_CENTRES,key)?MAP_CENTRES[key]:undefined;
}
export function mobilityOverpassQuery(city:MobilityCity):string|null{
  if(!/^[A-Z]{2}$/.test(city.countryCode)||!/^[-\p{L}\p{M}\p{N} .,()&'’‘]{1,120}$/u.test(city.name))return null;
  const centre=reviewedMapCentre(city);
  if(centre){
    const point=centre.join(",");
    return `[out:json][timeout:6];
nwr(around:8000,${point})["highway"="speed_camera"]; out tags 12;
(nwr(around:8000,${point})["railway"~"^(station|halt)$"];
nwr(around:8000,${point})["amenity"="bus_station"];
nwr(around:20000,${point})["aeroway"="aerodrome"]["iata"];); out tags 16;
way(around:8000,${point})["highway"="construction"]; out tags 8;`;
  }
  const name=JSON.stringify(city.name);
  return `[out:json][timeout:6];
area["ISO3166-1"="${city.countryCode}"]["admin_level"="2"]->.country;
(node["place"~"^(city|town|village)$"]["name"=${name}](area.country);
node["place"~"^(city|town|village)$"]["name:en"=${name}](area.country);)->.place;
.place out ids 2;
nwr(around.place:8000)["highway"="speed_camera"]; out tags 12;
(nwr(around.place:8000)["railway"~"^(station|halt)$"];
nwr(around.place:8000)["amenity"="bus_station"];
nwr(around.place:20000)["aeroway"="aerodrome"]["iata"];); out tags 16;
way(around.place:8000)["highway"="construction"]; out tags 8;`;
}

const fallbackNames={camera:"Mapped speed camera",transit:"Mapped transit hub",roadwork:"Mapped road construction"};
type OsmElement={type?:unknown;id?:unknown;tags?:Record<string,unknown>};

export function parseMobilityMap(value:unknown, fixedCentre=false):MobilityMapData|null{
  if(!value||typeof value!=="object")return null;
  const body=value as {elements?:unknown;remark?:unknown;osm3s?:{timestamp_osm_base?:unknown}};
  const timestamp=body.osm3s?.timestamp_osm_base;
  if(body.remark||typeof timestamp!=="string"||!Number.isFinite(Date.parse(timestamp))||
    !Array.isArray(body.elements)||body.elements.length>40)return null;
  const elements=body.elements as OsmElement[];
  // The first output identifies the exact city centre. Decline ambiguous place matches.
  if(!fixedCentre&&elements.filter(item=>item?.type==="node"&&!item.tags).length!==1)return null;
  const seen=new Set<string>();
  const features:MobilityMapFeature[]=[];
  for(const item of elements){
    if(!item?.tags||!["node","way","relation"].includes(String(item.type))||
      !Number.isSafeInteger(item.id)||Number(item.id)<=0)continue;
    const t=item.tags;
    const kind:MapKind|null=t.highway==="speed_camera"?"camera":t.highway==="construction"?"roadwork":
      t.railway==="station"||t.railway==="halt"||t.amenity==="bus_station"||t.aeroway==="aerodrome"?"transit":null;
    const href="https://www.openstreetmap.org/"+item.type+"/"+item.id;
    if(!kind||seen.has(href))continue;
    seen.add(href);
    const candidate=t["name:en"]??t.name;
    const name=typeof candidate==="string"&&candidate.trim()?candidate.trim().slice(0,100):fallbackNames[kind];
    features.push({kind,name,href});
  }
  return {updatedAt:timestamp,features};
}

/** A bounded, date-labelled extract, never represented as live traffic. */
export function validatedMumbaiSnapshot(value:unknown,city:MobilityCity,now=Date.now()):MobilityMapData|null{
  if(city.slug!=="mumbai"||city.countryCode!=="IN"||!value||typeof value!=="object")return null;
  const v=value as Record<string,unknown>;
  if(v.slug!=="mumbai"||v.countryCode!=="IN"||v.license!=="ODbL-1.0"||
    v.source!=="https://download.bbbike.org/osm/bbbike/Bombay/Bombay.osm.gz"||
    typeof v.sha256!=="string"||!(/^[a-f0-9]{64}$/).test(v.sha256)||typeof v.updatedAt!=="string"||
    !Array.isArray(v.features)||v.features.length>36)return null;
  const age=now-Date.parse(v.updatedAt);
  if(!Number.isFinite(age)||age<0||age>30*86400000)return null;
  const seen=new Set<string>();
  const features:MobilityMapFeature[]=[];
  for(const f of v.features){
    if(!f||!["camera","transit","roadwork"].includes(f.kind)||typeof f.name!=="string"||
      !f.name.trim()||f.name.length>100||typeof f.href!=="string"||
      !/^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/[1-9]\d*$/.test(f.href)||seen.has(f.href))return null;
    seen.add(f.href);features.push({kind:f.kind,name:f.name,href:f.href});
  }
  if(features.filter(f=>f.kind==="transit").length<5)return null;
  return {updatedAt:v.updatedAt,features,source:"dated-osm-extract"};
}
