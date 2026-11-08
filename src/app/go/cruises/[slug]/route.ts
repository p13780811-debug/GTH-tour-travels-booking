import {NextResponse} from "next/server";
import {cruiseAffiliateUrl} from "@/lib/travel/cruises";
export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const target=cruiseAffiliateUrl(slug);
 if(new URL(request.url).search||!target)return NextResponse.json({error:"Cruise link unavailable."},{status:404,headers:{"Cache-Control":"no-store"}});
 const response=NextResponse.redirect(target,302);
 response.headers.set("Cache-Control","no-store");
 response.headers.set("Referrer-Policy","no-referrer");
 response.headers.set("X-Robots-Tag","noindex, nofollow");
 return response;
}
