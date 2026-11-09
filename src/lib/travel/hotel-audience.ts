import "server-only";
import {COUNTRY_CODES,validCountry,countryLabel} from "@/lib/tender/localization";
export const HOTEL_COUNTRIES=[...COUNTRY_CODES].map(code=>({code,name:countryLabel(code,"en")})).sort((a,b)=>a.name.localeCompare(b.name));
export type HotelAudience={country:string;city:string;explicit:boolean;page:number;point:{lat:number;lon:number}|null};
function cityName(raw:string|null){
  if(!raw)return "";
  let value:string;try{value=decodeURIComponent(raw);}catch{return "";}
  value=value.normalize("NFKC").trim().replace(/\s+/g," ");
  return value.length>=2&&value.length<=80&&/^[\p{L}\p{M} .'-]+$/u.test(value)?value:"";
}
export function resolveHotelAudience(request:Request):HotelAudience{
  const p=new URL(request.url).searchParams;
  for(const key of p.keys())if(!["country","city","page"].includes(key)||p.getAll(key).length!==1)throw Error("Invalid hotel area parameters");
  const page=p.get("page")||"1";if(!/^[1-9][0-9]{0,2}$/.test(page)||Number(page)>100)throw Error("Invalid hotel page");
  const explicit=p.has("country");
  if((p.has("city")||Number(page)>1)&&!explicit)throw Error("Choose a country first");
  const country=validCountry(explicit?p.get("country"):request.headers.get("x-vercel-ip-country"))||"";
  const rawCity=explicit?p.get("city"):request.headers.get("x-vercel-ip-city");
  const city=country?cityName(rawCity):"";
  if(explicit&&(!country||(rawCity&&!city)))throw Error("Invalid hotel area");
  const lat=request.headers.get("x-vercel-ip-latitude"),lon=request.headers.get("x-vercel-ip-longitude");
  const point=!explicit&&lat&&lon&&Number.isFinite(Number(lat))&&Number.isFinite(Number(lon))&&Math.abs(Number(lat))<=90&&Math.abs(Number(lon))<=180?{lat:Number(lat),lon:Number(lon)}:null;
  return {country,city,explicit,page:Number(page),point};
}
export function nearestHotelProfiles<T extends {latitude:number|null;longitude:number|null}>(items:T[],point:HotelAudience["point"]):T[]{
  if(!point)return items;
  const distance=(item:T)=>{
    if(item.latitude===null||item.longitude===null)return Infinity;
    const rad=Math.PI/180,a=Math.sin((item.latitude-point.lat)*rad/2)**2+Math.cos(point.lat*rad)*Math.cos(item.latitude*rad)*Math.sin((item.longitude-point.lon)*rad/2)**2;
    return 2*Math.atan2(Math.sqrt(Math.min(1,a)),Math.sqrt(Math.max(0,1-a)));
  };
  return [...items].sort((a,b)=>distance(a)-distance(b));
}
