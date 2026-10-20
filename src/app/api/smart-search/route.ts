import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { smartSearchTarget } from "@/lib/search/smart-intent";

export async function GET(request:Request) {
  const q=new URL(request.url).searchParams.get("q")||"";
  if(q.trim().length<2||q.length>180)return NextResponse.json({error:"Enter a search of 2–180 characters."},{status:400,headers:{"Cache-Control":"no-store"}});
  try {
    await enforceRateLimit(request,"ai");
    return NextResponse.json(smartSearchTarget(q),{headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
  } catch {
    return NextResponse.json({error:"Search is temporarily unavailable."},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
