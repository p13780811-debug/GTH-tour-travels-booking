export const SEARCHES_KEY = "gth-property-searches-v1"
const keys = ["query", "country", "city", "type", "listing", "bedrooms", "sort"]
export type SavedSearch = { query: string; label: string }
export function normalizeSearchQuery(raw: string): string {
 const source = new URLSearchParams(raw.slice(0, 2048))
 const output = new URLSearchParams()
 for (const key of keys) {
  const value = (source.get(key) || "").trim().slice(0, key === "query" ? 120 : 80)
  if (!value) continue
  if (key === "listing" && !["buy","rent"].includes(value)) continue
  if (key === "sort" && !["latest","ai"].includes(value)) continue
  if (key === "bedrooms" && !/^(?:[1-9]|1[0-9]|20)$/.test(value)) continue
  output.set(key, value)
 }
 return output.toString()
}
export function normalizeSearches(raw: unknown): SavedSearch[] {
 if (!Array.isArray(raw)) return []
 const seen = new Set<string>()
 return raw.flatMap(item => {
  if (!item || typeof item !== "object" || typeof item.query !== "string") return []
  const query = normalizeSearchQuery(item.query)
  if (seen.has(query)) return []
  seen.add(query)
  const params = new URLSearchParams(query)
  const label = [params.get("query"),params.get("city"),params.get("country"),params.get("listing"),params.get("type"),params.get("bedrooms") ? `${params.get("bedrooms")} beds` : ""].filter(Boolean).join(" · ") || "All properties"
  return [{query,label}]
 }).slice(0,10)
}
