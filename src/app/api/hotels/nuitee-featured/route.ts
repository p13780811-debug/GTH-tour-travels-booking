import {NextResponse} from "next/server";
import {getHotelMarket} from "@/lib/travel/nuitee-hotel-markets";
import {getNuiteeMarketFeed} from "@/lib/travel/nuitee-hotel-catalog";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const NO_CACHE={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
/** Public, allowlisted and bounded hotel metadata only. No secrets, rates, booking or database traffic. */
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;
 const market=params.get("market")||"";
 if(params.size!==1||!getHotelMarket(market))
   return NextResponse.json({error:"Invalid hotel destination"},{status:400,headers:NO_CACHE});
 const feed=await getNuiteeMarketFeed(market);
 if(feed.status!=="ready")
   return NextResponse.json({error:"Supplier listing currently unavailable",status:feed.status},
     {status:503,headers:NO_CACHE});
 return NextResponse.json({market,sandbox:feed.sandbox,hotels:feed.hotels},
   {headers:{"Cache-Control":"public, s-maxage=86400, stale-while-revalidate=86400","X-Content-Type-Options":"nosniff"}});
}
