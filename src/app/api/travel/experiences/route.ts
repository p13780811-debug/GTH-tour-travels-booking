import {NextResponse} from "next/server";
import {parseTourFilters} from "@/lib/tours/discovery";
import {connectedExperiences} from "@/lib/travel/connected-experiences";
/** Six public catalogue cards, shared CDN cache. No database or private API. */
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;
 if([...params.keys()].some(key=>key!=="city"||params.getAll(key).length!==1))return NextResponse.json({error:"Choose one city."},{status:400,headers:{"Cache-Control":"no-store"}});
 const parsed=parseTourFilters({city:params.get("city")||""});
 if(!parsed.ok)return NextResponse.json({error:parsed.error},{status:400,headers:{"Cache-Control":"no-store"}});
 const result=await connectedExperiences(parsed.filters.city);
 return NextResponse.json(result,{headers:{"Cache-Control":result.available?"public, max-age=300, s-maxage=86400, stale-while-revalidate=3600":"public, max-age=30, s-maxage=60","X-Content-Type-Options":"nosniff"}});
}
