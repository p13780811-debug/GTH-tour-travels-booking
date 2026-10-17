import {NextResponse} from "next/server";
import {listPlaces,sourceProgress,validFilters,type DirectoryFilters} from "@/lib/travel/osmAttractions";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"public, s-maxage=120, stale-while-revalidate=240","X-Content-Type-Options":"nosniff"};
const ALLOWED=new Set(["country","region","category","q","city","after","limit","view"]);
export async function GET(req:Request){
  const p=new URL(req.url).searchParams;
  if([...p.keys()].some(k=>!ALLOWED.has(k))||[...p.keys()].some(k=>p.getAll(k).length>1))
    return NextResponse.json({error:"Invalid filters"},{status:400});
  if(p.get("view")==="progress"){
    if(p.size>1)return NextResponse.json({error:"Invalid filters"},{status:400});
    try{return NextResponse.json({...await sourceProgress(),attribution:"© OpenStreetMap contributors · ODbL 1.0",verified_places:0},{headers:HEADERS});}
    catch{return NextResponse.json({error:"Progress currently unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});}
  }
  if(p.has("view")||(p.has("limit")&&!/^(?:[1-9]|[1-3][0-9]|4[0-8])$/.test(p.get("limit")||"")))
    return NextResponse.json({error:"Invalid filters"},{status:400});
  const filters:DirectoryFilters={
    country:p.get("country")||undefined,region:p.get("region")||undefined,
    category:p.get("category")||undefined,city:p.get("city")||undefined,
    q:p.get("q")||undefined,after:p.get("after")||undefined,
    limit:p.has("limit")?Number(p.get("limit")):24,
  };
  if(!validFilters(filters))return NextResponse.json({error:"Invalid filters"},{status:400});
  try{
    const result=await listPlaces(filters);
    return NextResponse.json({...result,
      items:result.items.map(item=>({...item,verified_tickets:false,available_for_booking:false,
        independently_verified:false,photo_url:null})),
      filters,attribution:"© OpenStreetMap contributors (ODbL 1.0), via Geofabrik.",
      note:"Country inferred from licensed extract scope, not independently certified. Mapped places are not bookable tickets."},{headers:HEADERS});
  }catch{return NextResponse.json({error:"Source directory temporarily unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});}
}
