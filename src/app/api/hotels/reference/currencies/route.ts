import {NextResponse} from "next/server";
import {getHotelCurrencyCatalog} from "@/lib/travel/nuitee-free-currencies";
export async function GET(request:Request){
  if(new URL(request.url).searchParams.size)return NextResponse.json({error:"This reference endpoint takes no parameters"},{status:400,headers:{"Cache-Control":"no-store"}});
  const result=await getHotelCurrencyCatalog();
  return NextResponse.json(result,{headers:{"Cache-Control":result.source==="nuitee"?"public, s-maxage=86400, stale-while-revalidate=3600":"public, s-maxage=300","X-Content-Type-Options":"nosniff"}});
}
