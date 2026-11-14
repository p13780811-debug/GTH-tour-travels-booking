export const SAVED_KEY = "gth-estate-saved-v1"
export function normalizeSaved(value: unknown): string[] {
 if (!Array.isArray(value)) return []
 return [...new Set(value.filter((slug): slug is string => typeof slug === "string" && slug.length <= 160 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)))].slice(0,50)
}

/** Optional public listing labels for the on-device broker picker; never synchronized. */
export const SAVED_TITLES_KEY = "gth-estate-saved-titles-v1"
export function normalizeSavedTitles(raw: unknown): Record<string,string> {
 if (!raw || Array.isArray(raw) || typeof raw !== "object") return {}
 const result:Record<string,string>={}
 for (const [slug,value] of Object.entries(raw)) {
  if (Object.keys(result).length >= 50) break
  if (!normalizeSaved([slug]).length || typeof value!=="string") continue
  const title=value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,110)
  if(title.length>=2)result[slug]=title
 }
 return result
}
