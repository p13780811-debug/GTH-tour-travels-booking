export const SAVED_KEY = "gth-estate-saved-v1"
export function normalizeSaved(value: unknown): string[] {
 if (!Array.isArray(value)) return []
 return [...new Set(value.filter((slug): slug is string => typeof slug === "string" && slug.length <= 160 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)))].slice(0,50)
}
