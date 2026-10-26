export type PropertySeoRecord = { title?: string; slug?: string; location?: string; city?: string; district?: string; rera_id?: string; official_source_url?: string; status?: string; description?: string; registry_only?: boolean; active_inventory_count?: number }
export function validPropertySlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 160 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}
export function isIndexableProperty(row: PropertySeoRecord | null): boolean {
  if (!row || row.status === "archived" || !validPropertySlug(row.slug) || (row.title?.trim().length || 0) < 3 || !/^P\d{11}$/.test(row.rera_id || "")) return false
  try { const url = new URL(row.official_source_url || ""); return url.protocol === "https:" && !url.username && !url.password && !url.port && ["maharera.maharashtra.gov.in","www.maharera.maharashtra.gov.in","maharera.mahaonline.gov.in","www.maharera.mahaonline.gov.in"].includes(url.hostname) } catch { return false }
}
export function propertySeo(row: PropertySeoRecord | null) {
  if (!row) return { title: "Property unavailable | GTH PRO", description: "Browse recorded real-estate project information on GTH PRO." }
  const locality = [row.location, row.city, row.district].find(value => value && !/not provided/i.test(value)) || "Maharashtra"
  const registryOnly=row.registry_only===true || Boolean(row.rera_id && !(Number(row.active_inventory_count)>0))
  const title = registryOnly
    ? `${row.title} ${locality} – MahaRERA Project Registration & Timeline | GTH PRO`
    : `${row.title} ${locality} – Reviewed Property Details | GTH PRO`
  const description = registryOnly
    ? `Source-backed registration details for ${row.title} in ${locality}.${row.rera_id ? ` MahaRERA reference: ${row.rera_id}.` : ""} View recorded dates and verify current project status on the official portal. No sale price or possession status is implied.`
    : `Explore reviewed property information for ${row.title} in ${locality}. Request available units, verified pricing and approved photographs before making a decision.`
  return { title, description }
}
