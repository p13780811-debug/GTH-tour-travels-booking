export type Coordinates = { lat: number; lng: number };
export type NearbyPlace = { name: string; latitude: number; longitude: number; distanceMeters: number; osmUrl: string };
export function validCoordinates(value: unknown): value is Coordinates {
 if (!value || typeof value !== "object") return false;
 const v = value as Record<string,unknown>;
 return typeof v.lat === "number" && typeof v.lng === "number" &&
  Number.isFinite(v.lat) && Number.isFinite(v.lng) && Math.abs(v.lat) <= 90 && Math.abs(v.lng) <= 180 &&
  !(v.lat === 0 && v.lng === 0);
}
export function greatCircleMeters(a:Coordinates,b:Coordinates):number {
 const r = Math.PI / 180, dLat=(b.lat-a.lat)*r, dLng=(b.lng-a.lng)*r;
 const x=Math.sin(dLat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLng/2)**2;
 return 6371000*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));
}
export type OsmElement = { type?:string; id?:number; lat?:number; lon?:number; center?:{lat:number;lon:number}; tags?:Record<string,string> };
export function nearestOsm(elements:OsmElement[], origin:Coordinates, category:"metro"|"airport"):NearbyPlace|null {
 const options:NearbyPlace[]=[];
 for (const item of elements) {
  const lat=item.type==="node"?item.lat:item.center?.lat;
  const lng=item.type==="node"?item.lon:item.center?.lon;
  if(!validCoordinates({lat,lng})||!Number.isSafeInteger(item.id)||!["node","way","relation"].includes(item.type||"")) continue;
  const tags=item.tags||{};
  const isMetro=tags.station==="subway"||tags.station==="light_rail"||tags.subway==="yes"||
   tags.railway==="subway_entrance";
  const isAirport=tags.aeroway==="aerodrome"&&/^[A-Z]{3}$/.test(tags.iata||"");
  if(category==="metro"&&!isMetro||category==="airport"&&!isAirport)continue;
  const distanceMeters=Math.round(greatCircleMeters(origin,{lat,lng}));
  if(distanceMeters>(category==="metro"?6000:90000))continue;
  const name=(tags.name||tags["name:en"]||"").trim().slice(0,120);
  if(!name)continue;
  options.push({name,latitude:lat,longitude:lng,distanceMeters,osmUrl:`https://www.openstreetmap.org/${item.type}/${item.id}`});
 }
 return options.sort((a,b)=>a.distanceMeters-b.distanceMeters)[0]||null;
}
export function safeRoutingBase(raw:string|undefined):URL|null {
 if(!raw)return null;
 try {const u=new URL(raw);if(u.protocol!=="https:"||u.username||u.password||u.search||u.hash||u.port||u.pathname!=="/")return null;
 if(["localhost","127.0.0.1","::1"].includes(u.hostname)||!u.hostname.includes(".")||/^(?:\\d{1,3}\\.){3}\\d{1,3}$/.test(u.hostname)||u.hostname.endsWith(".local"))return null;
 return u;
 }catch{return null}
}
