/** Pure, conservative check preventing a Google Place/photo from being attributed to a different OSM property. */
export type HotelAnchor = {name:string;lat:number;lon:number};
export type PlacesMatch = {
  displayName?: {text?:string};
  location?: {latitude?:number;longitude?:number};
  types?: string[];
  photos?: {name?:string}[];
};
export function normalizedHotelName(value:string):string {
  return value.normalize("NFKD").replace(/\p{M}/gu,"").toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");
}
export function distanceMeters(a:{lat:number;lon:number},b:{lat:number;lon:number}):number {
  const radians=(n:number)=>n*Math.PI/180;
  const dLat=radians(b.lat-a.lat),dLon=radians(b.lon-a.lon);
  const h=Math.sin(dLat/2)**2+Math.cos(radians(a.lat))*Math.cos(radians(b.lat))*Math.sin(dLon/2)**2;
  return 2*6371008.8*Math.asin(Math.min(1,Math.sqrt(Math.max(0,h))));
}
const ACCOMMODATION_TYPES=new Set(["lodging","hotel","motel","hostel","guest_house","resort_hotel","extended_stay_hotel"]);
export function isExactHotelPlace(anchor:HotelAnchor,place:PlacesMatch):boolean {
  if(!anchor.name||anchor.name.length>240||!Number.isFinite(anchor.lat)||!Number.isFinite(anchor.lon))return false;
  const name=place.displayName?.text;
  const lat=place.location?.latitude,lon=place.location?.longitude;
  if(typeof name!=="string"||typeof lat!=="number"||typeof lon!=="number"||
     !Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return false;
  const normalized=normalizedHotelName(anchor.name);
  if(normalized.length<5||normalized!==normalizedHotelName(name))return false;
  if(!place.types?.some(t=>ACCOMMODATION_TYPES.has(t)))return false;
  // OSM area centroids may differ from entrances, but don't attach nearby unrelated photos.
  return distanceMeters(anchor,{lat,lon})<=450;
}
