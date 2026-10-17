/**
 * Hotel discovery uses existing public OSM coordinates without inventing or
 * overwriting administrative city assignments. A radius is a search hint,
 * not evidence that an accommodation belongs to city boundaries.
 */
export type HotelGeoBounds = {
  minLat:number;maxLat:number;minLon:number;maxLon:number;
};
type Coordinate={latitude:number;longitude:number};
const normalize=(value:string)=>value.trim().toLocaleLowerCase("en");
export function cityLabels(city:string):string[]{
  const key=normalize(city);
  const alternatives:Record<string,string[]>={
    "bangalore":["Bengaluru","Bangalore"],
    "bengaluru":["Bengaluru","Bangalore"],
    "delhi":["New Delhi","Delhi"],
    "new delhi":["New Delhi","Delhi"],
    "cochin":["Kochi","Fort Cochin","Cochin"],
    "kochi":["Kochi","Fort Cochin","Cochin"],
    "bombay":["Mumbai","Bombay"],
    "mumbai":["Mumbai","Bombay"]
  };
  return alternatives[key]||[city];
}
export function hotelBounds(city:string, samples:Coordinate[]):HotelGeoBounds|null{
  if(normalize(city)==="goa")
    return {minLat:14.8,maxLat:15.9,minLon:73.6,maxLon:74.5};
  const coords=samples.filter(p=>Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&
    p.latitude>=-90&&p.latitude<=90&&p.longitude>=-180&&p.longitude<=180);
  if(coords.length<3)return null;
  const lat=coords.map(p=>p.latitude).sort((a,b)=>a-b)[Math.floor(coords.length/2)];
  const lon=coords.map(p=>p.longitude).sort((a,b)=>a-b)[Math.floor(coords.length/2)];
  // Refuse widely scattered, ambiguous names (e.g. same name in many countries).
  const local=coords.filter(p=>Math.abs(p.latitude-lat)<=0.75&&
    Math.abs(p.longitude-lon)*Math.cos(lat*Math.PI/180)<=0.75);
  if(local.length<Math.max(3,Math.ceil(coords.length*0.75)))return null;
  const radius=30; // approximate nearby-property search, not city administration
  const latitudeDelta=radius/111.2;
  const longitudeDelta=radius/(111.2*Math.max(0.2,Math.cos(lat*Math.PI/180)));
  return {
    minLat:Number((lat-latitudeDelta).toFixed(5)),
    maxLat:Number((lat+latitudeDelta).toFixed(5)),
    minLon:Number((lon-longitudeDelta).toFixed(5)),
    maxLon:Number((lon+longitudeDelta).toFixed(5))
  };
}
export function hotelLocationFilter(cityLike:string,bounds:HotelGeoBounds|null):string{
  const clauses=[
    "city.ilike."+cityLike,
    "region.ilike."+cityLike,
    "address.ilike."+cityLike,
    "name.ilike."+cityLike
  ];
  if(bounds)clauses.push("and(latitude.gte."+bounds.minLat+
    ",latitude.lte."+bounds.maxLat+",longitude.gte."+bounds.minLon+
    ",longitude.lte."+bounds.maxLon+")");
  return clauses.join(",");
}
export function isInHotelBounds(lat:number,lon:number,bounds:HotelGeoBounds|null):boolean{
  return !!bounds&&Number.isFinite(lat)&&Number.isFinite(lon)&&
    lat>=bounds.minLat&&lat<=bounds.maxLat&&lon>=bounds.minLon&&lon<=bounds.maxLon;
}
