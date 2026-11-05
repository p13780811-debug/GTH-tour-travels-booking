export type PropertySeoRecord = { title?: string; slug?: string; location?: string; city?: string; district?: string; rera_id?: string; official_source_url?: string; status?: string; description?: string; registry_only?: boolean; active_inventory_count?: number }
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
  const suffix = registryOnly
    ? ` – MahaRERA Project Registration & Timeline | GTH PRO`
    : ` – ${marketplace ? "Reviewed Property Details" : "Property Record"} | GTH PRO`
  const title = excerpt(`${row.title || "Property record"} ${locality}`, 118 - suffix.length) + suffix
  const name = excerpt(row.title || "Property record", 70), place = excerpt(locality, 30)
  const description = registryOnly
    ? `MahaRERA registration for ${name} in ${place}.${row.rera_id ? ` Reference: ${row.rera_id}.` : ""} Check recorded dates and the official source. Registry status does not confirm price, possession or availability.`
    : `Explore ${marketplace ? "reviewed property information" : "recorded property details"} for ${name} in ${place}. Request available units, verified pricing and approved photographs before making a decision.`
  return { title, description: excerpt(description, 295) }
}
