export type PropertySeoRecord = { title?: string; slug?: string; location?: string; city?: string; district?: string; rera_id?: string; official_source_url?: string; status?: string; description?: string; registry_only?: boolean; active_inventory_count?: number; developer?:string; builder_name?:string; ingestion_source?:string }
export function validPropertySlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 160 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}
export function isIndexableProperty(row: PropertySeoRecord | null): boolean {
  if (!row || row.status === "archived" || !validPropertySlug(row.slug) || (row.title?.trim().length || 0) < 3 || !/^P\d{11}$/.test(row.rera_id || "")) return false
  try { const url = new URL(row.official_source_url || ""); return url.protocol === "https:" && !url.username && !url.password && !url.port && ["maharera.maharashtra.gov.in","www.maharera.maharashtra.gov.in","maharera.mahaonline.gov.in","www.maharera.mahaonline.gov.in"].includes(url.hostname) } catch { return false }
}
/** Shorten metadata only; the project heading, registry reference and dossier retain the source text. */
function excerpt(value: string, limit: number) {
  const normalized = value.replace(/\s+/g, " ").trim()
  if (normalized.length <= limit) return normalized
  let prefix = ""
  for (const point of normalized) {
    if (prefix.length + point.length > limit - 1) break
    prefix += point
  }
  return prefix.trimEnd() + "…"
}
export function propertySeo(row: PropertySeoRecord | null) {
  if (!row) return { title: "Property unavailable | GTH PRO", description: "Browse recorded real-estate project information on GTH PRO." }
  const locality = [row.location, row.city, row.district].find(value => value && !/not provided/i.test(value)) || "Location not recorded"
  const registryOnly=row.registry_only===true || Boolean(row.rera_id && !(Number(row.active_inventory_count)>0))
  const marketplace=Number(row.active_inventory_count)>0
  // Never portray historical registration records as proof of current approval.
  // The same canonical page serves registry research and genuine published inventory.
  const suffix = registryOnly
    ? ` – MahaRERA ${/^P[0-9]{11}$/.test(row.rera_id || "") ? row.rera_id + " " : ""}Project Record | GTH PRO`
    : ` – ${marketplace ? "Reviewed Property Details" : "Property Record"} | GTH PRO`
  const title = excerpt(`${row.title || "Property record"} ${locality}`, Math.max(20,118 - suffix.length)) + suffix
  const name=excerpt(row.title || "Property record",65), place=excerpt(locality,35)
  const developer=[row.developer,row.builder_name].find(value=>typeof value==="string"&&value.trim().length>=2&&!/not provided/i.test(value))
  const developerFact=typeof developer==="string" ? ` Recorded developer: ${excerpt(developer,70)}.` : ""
  const description = registryOnly
    ? `MahaRERA project record for ${name} in ${place}.${row.rera_id ? ` Registration: ${row.rera_id}.` : ""} Verify current status on the official MahaRERA portal; this record does not confirm price, possession or availability.${developerFact}`
    : `Explore ${marketplace ? "reviewed property information" : "recorded property details"} for ${name} in ${place}. Request available units, verified pricing and approved photographs before making a decision.`

  return { title, description: excerpt(description, 295) }
}
