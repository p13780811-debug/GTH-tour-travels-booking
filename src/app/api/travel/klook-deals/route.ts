import {NextResponse} from "next/server";
import {buildTrackedKlookDealsHref} from "@/lib/travel/approved-klook-promos";

// No user-selected URL, coupon or arbitrary redirect destination is accepted.
export function GET(request:Request){
 const url=new URL(request.url);
 if(url.search || url.hash) return NextResponse.json({error:"Invalid deal link."},{status:400});
 const response=NextResponse.redirect(buildTrackedKlookDealsHref(),302);
 response.headers.set("Cache-Control","no-store");
 response.headers.set("Referrer-Policy","no-referrer");
 response.headers.set("X-Robots-Tag","noindex, nofollow");
 return response;
}
