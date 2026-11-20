import {NextResponse, type NextRequest} from "next/server";
import {maldivesHotelHandoff} from "@/lib/maldives/elite-handoff";

export const dynamic="force-dynamic";
type Context={params:Promise<{hotelId:string}>};

/** Exact Nuitee property-level redirect, no generic GTH/White Label homepage. */
export async function GET(request:NextRequest,{params}:Context){
  const {hotelId}=await params;
  const result=maldivesHotelHandoff(request.nextUrl.searchParams,hotelId);
  if(result.status!=="supplier_hotel"){
    return new NextResponse("Invalid Maldives hotel or stay details.",{
      status:400,headers:{"Cache-Control":"no-store",
        "Content-Type":"text/plain; charset=utf-8"},
    });
  }
  const response=NextResponse.redirect(result.href,307);
  response.headers.set("Cache-Control","no-store");
  return response;
}
