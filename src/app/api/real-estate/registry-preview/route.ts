import { readRegistryRecords } from "@/lib/real-estate/registry-reader"
import { parseRegistryFilters } from "@/lib/real-estate/registry-search"

/** Same anonymous reader and success-only cache as the directory. No private columns. */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  if ([...params.keys()].some(key => key !== "q") || params.getAll("q").length > 1) {
    return Response.json({error:"Use one project or locality search."},{status:400,headers:{"Cache-Control":"no-store"}})
  }
  const parsed = parseRegistryFilters({q:params.get("q") || ""})
  if (!parsed.ok) return Response.json({error:parsed.error},{status:400,headers:{"Cache-Control":"no-store"}})
  const result = await readRegistryRecords(parsed.filters)
  if (result.error) return Response.json({error:"Registry data service is temporarily unavailable."},{status:503,headers:{"Cache-Control":"no-store"}})
  const items = result.rows.slice(0,6).map(({slug,title,rera_id,developer,builder_name,city,district}) => ({slug,title,rera_id,developer:developer || builder_name,city:city || district}))
  return Response.json({items},{headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}})
}
