import {getCachedTenderBatch} from "@/lib/tender/public-reader";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
export async function GET(request:Request){
 const p=new URL(request.url).searchParams;
 if(p.size!==1||p.getAll("ids").length!==1||!p.get("ids")||p.get("ids")!.length>1480)return Response.json({error:"Invalid tender shortlist"},{status:400,headers});
 const result=await getCachedTenderBatch(p.get("ids")!.split(","));
 if(!result.ok)return Response.json({error:result.error},{status:result.status,headers:{...headers,...(result.status===429?{"Retry-After":"60"}:{})}});
 return Response.json({items:result.items},{headers});
}
