import { createClient } from "@supabase/supabase-js"
import { parseHybridSearch } from "@/lib/real-estate/hybrid-search"
import { RequestError, requestError } from "@/lib/security/request"

export async function GET(req: Request) {
  try {
    const filters = parseHybridSearch(new URL(req.url).searchParams)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new RequestError("Property search unavailable", 503)
    // An isolated anonymous client prevents shared browser sessions or privileged access.
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
    const { data, error } = await db.rpc("search_hybrid_properties", { filters })
      .abortSignal(AbortSignal.timeout(8000))
    if (error || !data || !Array.isArray(data.items)) throw new RequestError("Property search temporarily unavailable. Please retry.", 503)
    const items = data.items.map((item: Record<string, unknown>) => ({...item,
      formatted_price: Number(item.inventory_min_price)>0 && typeof item.inventory_currency === "string"
        ? `From ${new Intl.NumberFormat("en-IN",{style:"currency",currency:item.inventory_currency,maximumFractionDigits:0}).format(Number(item.inventory_min_price))}` : "Price on request",
    }))
    return Response.json({...data,items}, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } })
  } catch (error) { return requestError(error instanceof RequestError ? error : new RequestError("Property search temporarily unavailable. Please retry.", 503)) }
}
