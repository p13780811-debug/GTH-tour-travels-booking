import {NextResponse, type NextRequest} from "next/server";
import {maldivesStayHandoff,verifiedMaldivesPlaceId} from "@/lib/maldives/elite-handoff";

export const dynamic="force-dynamic";

/** Fixed-destination form endpoint. Strict input validation and zero paid API calls. */
export async function GET(request:NextRequest) {
  const result=maldivesStayHandoff(request.nextUrl.searchParams,await verifiedMaldivesPlaceId());
  if(result.status==="invalid") {
    return new NextResponse("Choose a valid upcoming stay, guests, child ages and currency.",{
      status:400,headers:{"Cache-Control":"no-store","Content-Type":"text/plain; charset=utf-8"},
    });
  }
  const target = result.status==="supplier_listing"
    ? result.href : new URL(result.href,request.url).toString();
  const response=NextResponse.redirect(target,307);
  response.headers.set("Cache-Control","no-store");
  return response;
}
