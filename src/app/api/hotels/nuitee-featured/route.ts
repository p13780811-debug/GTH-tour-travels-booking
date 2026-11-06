import {NextResponse} from "next/server";
import {hotelSourceImageUrl} from "@/lib/travel/hotel-source-image";

/** Nuitee hotel metadata only. No live rate or availability assertions. */
export const runtime="nodejs";
export const dynamic="force-dynamic";
const MARKETS={india:{country:"IN",city:"Mumbai"},world:{country:"GB",city:"London"}} as const;
const HTTP_HEADERS={"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=86400","X-Content-Type-Options":"nosniff"};
const ERR_HEADERS={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const ID=/^[A-Za-z0-9_-]{2,100}$/;
type RawHotel={id?:unknown;name?:unknown;city?:unknown;address?:unknown;main_photo?:unknown;thumbnail?:unknown;stars?:unknown;rating?:unknown};
type Card={id:string;name:string;city:string;address:string;photo:string|null;stars:number|null;rating:number|null};
function label(input:unknown,limit:number):string{
 return typeof input==="string"&&input.length<=limit?input.replace(/[\u0000-\u001f\u007f]/g," ").trim():"";
}
function card(row:RawHotel,city:string):Card|null{
 const id=label(row.id,100),name=label(row.name,180);
 if(!ID.test(id)||name.length<3)return null;
 return {id,name,city:label(row.city,100)||city,address:label(row.address,300),
  photo:hotelSourceImageUrl(row.main_photo)||hotelSourceImageUrl(row.thumbnail),
  stars:typeof row.stars==="number"&&Number.isFinite(row.stars)&&row.stars>=1&&row.stars<=5?row.stars:null,
  rating:typeof row.rating==="number"&&Number.isFinite(row.rating)&&row.rating>=0&&row.rating<=10?row.rating:null};
}
function credentials():{key:string;sandbox:boolean}|null{
 // Never accidentally serve sandbox content on the production domain.
 if(process.env.VERCEL_ENV==="production"){
  if(process.env.GTH_NUITEE_PRODUCTION_ENABLED!=="true"||!process.env.NUITEE_PRODUCTION_API_KEY)return null;
  return {key:process.env.NUITEE_PRODUCTION_API_KEY,sandbox:false};
 }
 const key=process.env.NUITEE_SANDBOX_API_KEY;
 return key?{key,sandbox:true}:null;
}
export async function GET(req:Request){
 const params=new URL(req.url).searchParams;
 const market=params.get("market");
 if(params.size!==1||!market||!(market in MARKETS))
  return NextResponse.json({error:"Invalid hotel market"},{status:400,headers:ERR_HEADERS});
 const auth=credentials();
 if(!auth)return NextResponse.json({error:"Nuitee hotel content not available in this environment"},{status:503,headers:ERR_HEADERS});
 const region=MARKETS[market as keyof typeof MARKETS];
 try{
  const url=new URL("https://api.liteapi.travel/v3.0/data/hotels");
  url.searchParams.set("countryCode",region.country);
  url.searchParams.set("cityName",region.city);
  url.searchParams.set("limit","24");
  url.searchParams.set("language","en");
  const response=await fetch(url.toString(),{
    headers:{"X-API-Key":auth.key,"Accept":"application/json"},
    signal:AbortSignal.timeout(9000),next:{revalidate:3600}});
  if(!response.ok)throw Error("Nuitee data lookup failed");
  const json:unknown=await response.json();
  if(!json||typeof json!=="object"||!Array.isArray((json as {data?:unknown}).data))
   throw Error("Unexpected hotel catalogue response");
  const hotels:Card[]=[];
  const seen=new Set<string>();
  for(const entry of (json as {data:RawHotel[]}).data){
   if(!entry||typeof entry!=="object")continue;
   const next=card(entry,region.city);
   if(next&&!seen.has(next.id)){seen.add(next.id);hotels.push(next);}
  }
  hotels.sort((a,b)=>Number(Boolean(b.photo))-Number(Boolean(a.photo)));
  return NextResponse.json({market,city:region.city,sandbox:auth.sandbox,hotels:hotels.slice(0,6)},
   {headers:HTTP_HEADERS});
 }catch{
  return NextResponse.json({error:"Hotel supplier listing unavailable"},{status:502,headers:ERR_HEADERS});
 }
}
