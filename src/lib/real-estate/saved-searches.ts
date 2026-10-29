import {parseSearchRegion} from "./search-region"
export const SEARCHES_KEY = "gth-property-searches-v1"
const keys = ["query", "country", "city", "type", "listing", "bedrooms", "possession", "currency", "minPrice", "maxPrice", "sort", "minArea", "maxArea", "areaBasis", "minBathrooms", "sellerRole", "publishedWithin", "verifiedOnly", "withTour"]
export type SavedSearch = { query: string; label: string }
export function normalizeSearchQuery(raw: string): string {
 const source = new URLSearchParams(raw.slice(0, 8192))
 const output = new URLSearchParams()
 try{const region=parseSearchRegion(source.get("region"));if(region)output.set("region",JSON.stringify(region));}catch{}
 for (const key of keys) {
  const value = (source.get(key) || "").normalize("NFKC").trim().slice(0, key === "query" ? 120 : 80)
  if (!value) continue
  if (key === "listing" && !["buy","rent","new_launch","commercial","plots"].includes(value)) continue
  if (key === "possession" && !["ready_to_move","under_construction","off_plan"].includes(value)) continue
  if (key === "sort" && !["latest","ai","price_low","price_high"].includes(value)) continue
  if (key === "currency" && !["INR","AED","USD","GBP","EUR","SGD"].includes(value)) continue
  if ((key === "minPrice" || key === "maxPrice") && (!/^\d{1,13}(?:\.\d{1,2})?$/.test(value) || Number(value) < 1 || Number(value) > 999999999999)) continue
  if (key === "bedrooms" && !["1","2","3","4+"].includes(value)) continue
  if (["query","country","city"].includes(key) && !/^[\p{L}\p{N} ./'&-]+$/u.test(value)) continue
  if (key === "type" && !["Apartment","Villa","Penthouse","Commercial","Plot","Residential","Residential / Group Housing","Plotted","Mixed","Others"].includes(value)) continue
  if(key==="areaBasis"&&!["carpet","built_up","plot"].includes(value))continue
  if(key==="minBathrooms"&&!["1","2","3","4"].includes(value))continue
  if(key==="sellerRole"&&!["owner","developer","agent","other"].includes(value))continue
  if(key==="publishedWithin"&&!["7","30","90"].includes(value))continue
  if(["verifiedOnly","withTour"].includes(key)&&value!=="1")continue
  if(["minArea","maxArea"].includes(key)&&(!/^\d{1,7}(?:\.\d{1,2})?$/.test(value)||Number(value)<1||Number(value)>1000000))continue
  output.set(key, value)
 }
 if (!output.has("currency") || (output.has("minPrice") && output.has("maxPrice") && Number(output.get("minPrice")) > Number(output.get("maxPrice")))) {output.delete("minPrice");output.delete("maxPrice")}
 if(!output.has("areaBasis")||(output.has("minArea")&&output.has("maxArea")&&Number(output.get("minArea"))>Number(output.get("maxArea")))){output.delete("minArea");output.delete("maxArea")}
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
 const budget = params.get("minPrice") || params.get("maxPrice") ? `${params.get("currency") || ""} ${params.get("minPrice") || "0"}–${params.get("maxPrice") || "any"}`.trim() : ""
 const label = [params.has("region") ? "Drawn map region" : "",params.get("query"),params.get("city"),params.get("country"),params.get("listing")?.replaceAll("_"," "),params.get("type"),params.get("bedrooms") ? `${params.get("bedrooms")} beds` : "",params.get("possession")?.replaceAll("_"," "),params.get("minBathrooms")?`${params.get("minBathrooms")}+ baths`:"",params.has("minArea")||params.has("maxArea")?`${params.get("minArea")||"0"}–${params.get("maxArea")||"any"} ft² ${params.get("areaBasis")}`:"",params.get("sellerRole"),params.has("withTour")?"Reviewed tour":"",params.has("verifiedOnly")?"Verified units":"",params.has("publishedWithin")?`Published within ${params.get("publishedWithin")} days`:"",budget].filter(Boolean).join(" · ") || "All properties"
  return [{query,label}]
 }).slice(0,10)
}
