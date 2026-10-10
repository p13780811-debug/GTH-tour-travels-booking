import { supabase } from "@/lib/supabase"
import { PUBLIC_PROPERTY_FIELDS, transformProperty } from "./propertyService"
import { RequestError } from "@/lib/security/request"

/** Related inventory uses stored geography/type; this is not an AI prediction. */
export async function relatedProperties(slug: string, limit = 6) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 10) throw new RequestError("Invalid result limit", 400)
    const {data:current,error:lookupError} = await supabase.from("properties").select("id,city,property_type").eq("slug",slug).maybeSingle()
    if (lookupError) throw new RequestError("Related inventory unavailable",503)
    if (!current) throw new RequestError("Property not found",404)
    const city = typeof current.city === "string" ? current.city.trim() : ""
    const type = typeof current.property_type === "string" ? current.property_type.trim() : ""
    if (!city && !type) return []
    let query = supabase.from("properties").select(PUBLIC_PROPERTY_FIELDS).neq("slug",slug)
    if (city) query = query.eq("city",city)
    else query = query.eq("property_type",type)
    const {data,error} = await query.order("created_at",{ascending:false,nullsFirst:false}).order("id",{ascending:false}).limit(limit)
    if (error) throw new RequestError("Related inventory unavailable",503)
    return (data || []).map(transformProperty)
}
