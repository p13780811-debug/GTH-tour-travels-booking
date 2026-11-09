import {NextResponse} from "next/server";
import {HOTEL_COUNTRIES,resolveHotelAudience,nearestHotelProfiles} from "@/lib/travel/hotel-audience";
import {getFreeHotelProfiles} from "@/lib/travel/nuitee-free-hotels";
export async function GET(request:Request){
  let area;try{area=resolveHotelAudience(request);}catch{return NextResponse.json({error:"Choose a valid country and optional city"},{status:400,headers:{"Cache-Control":"no-store"}});}
  const scope={country:area.country,city:area.city,page:area.page};
  const headers={"Cache-Control":area.explicit?"public, s-maxage=86400, stale-while-revalidate=3600":"private, no-store","X-Content-Type-Options":"nosniff"};
  if(!area.country)return NextResponse.json({scope,countries:HOTEL_COUNTRIES,nearby:[],items:[],hasMore:false,available:true},{headers});
  try{
    const [localResult,countryResult]=await Promise.allSettled([
      area.city&&area.page===1?getFreeHotelProfiles(area.country,area.city,1):Promise.resolve({items:[],hasMore:false}),
      getFreeHotelProfiles(area.country,"",area.page),
    ]);
    if(localResult.status==="rejected"&&countryResult.status==="rejected")throw Error("Hotel previews unavailable");
    const local=localResult.status==="fulfilled"?localResult.value:{items:[],hasMore:false};
    const country=countryResult.status==="fulfilled"?countryResult.value:{items:[],hasMore:false};
    if(countryResult.status==="rejected"&&!local.items.length)throw Error("Hotel previews unavailable");
    const partial=localResult.status==="rejected"||countryResult.status==="rejected";
    const nearby=nearestHotelProfiles(local.items,area.point).slice(0,4),seen=new Set(nearby.map(item=>item.id));
    return NextResponse.json({scope,countries:HOTEL_COUNTRIES,nearby,items:country.items.filter(item=>!seen.has(item.id)),hasMore:country.hasMore&&area.page<100,available:true,partial},{headers:partial?{...headers,"Cache-Control":"private, no-store"}:headers});
  }catch{return NextResponse.json({scope,countries:HOTEL_COUNTRIES,nearby:[],items:[],hasMore:false,available:false,error:"Local hotel previews could not be checked. Use the worldwide booking search or retry."},{status:503,headers:{"Cache-Control":"private, no-store"}});}
}
