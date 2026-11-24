import type {MobilityCity} from "./city";

export type MapKind="camera"|"transit"|"roadwork";
export type MobilityMapFeature={name:string;kind:MapKind;href:string};
export type MobilityMapData={updatedAt:string;features:MobilityMapFeature[]};

export function mobilityOverpassQuery(city:MobilityCity):string|null{
  if(!/^[A-Z]{2}$/.test(city.countryCode)||!/^[-\p{L}\p{M}\p{N} .,()&'’‘]{1,120}$/u.test(city.name))return null;
  const name=JSON.stringify(city.name);
  return `[out:json][timeout:9];
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

export function parseMobilityMap(value:unknown):MobilityMapData|null{
  if(!value||typeof value!=="object")return null;
  const body=value as {elements?:unknown;remark?:unknown;osm3s?:{timestamp_osm_base?:unknown}};
  const timestamp=body.osm3s?.timestamp_osm_base;
  if(body.remark||typeof timestamp!=="string"||!Number.isFinite(Date.parse(timestamp))||
    !Array.isArray(body.elements)||body.elements.length>40)return null;
  const elements=body.elements as OsmElement[];
  // The first output identifies the exact city centre. Decline ambiguous place matches.
  if(elements.filter(item=>item?.type==="node"&&!item.tags).length!==1)return null;
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
