import {parseSearchRegion} from "./search-region"
import { RequestError } from "@/lib/security/request"

export const SEARCH_MODES = ["buy", "rent", "new_launch", "commercial", "plots"] as const
export const POSSESSION = ["ready_to_move", "under_construction", "off_plan"] as const
export type HybridSearch = ReturnType<typeof parseHybridSearch>

/** Parse once on the server; never interpolate untrusted PostgREST expressions. */
export function parseHybridSearch(params: URLSearchParams) {
  const known=['query','city','country','listing','type','bedrooms','possession','currency','minPrice','maxPrice','sort','page','region','minArea','maxArea','areaBasis','minBathrooms','sellerRole','publishedWithin','verifiedOnly','withTour'];
  if(known.some(key=>params.getAll(key).length>1))throw new RequestError("Duplicate property filter",400)
  const text = (key: string, max = 80) => {
    const value = params.get(key)?.normalize("NFKC").trim() || ""
    if (value.length > max || (value && !/^[\p{L}\p{N} ./'&-]+$/u.test(value))) throw new RequestError("Invalid search text", 400)
    return value || null
  }
  const choice = (key: string, values: readonly string[], fallback: string | null = null) => {
    const value = params.get(key)
    if (!value) return fallback
    if (!values.includes(value)) throw new RequestError("Invalid search filter", 400)
    return value
  }
  const number = (key: string, max: number, fallback: number | null = null) => {
    const raw = params.get(key)
    if (!raw) return fallback
    if (!/^\d{1,13}(?:\.\d{1,2})?$/.test(raw) || !Number.isFinite(Number(raw)) || Number(raw) < 1 || Number(raw) > max) throw new RequestError("Invalid numeric filter", 400)
    return Number(raw)
  }
  let region;try{region=parseSearchRegion(params.get("region"));}catch{throw new RequestError("Invalid map region",400)}
  const minPrice = number("minPrice", 999999999999), maxPrice = number("maxPrice", 999999999999)
  const currency = choice("currency", ["INR", "AED", "USD", "GBP", "EUR", "SGD"])
  if ((minPrice || maxPrice) && !currency) throw new RequestError("Choose a currency for budget filters", 400)
  if (minPrice && maxPrice && minPrice > maxPrice) throw new RequestError("Minimum budget exceeds maximum budget", 400)
  const minArea=number("minArea",1000000),maxArea=number("maxArea",1000000),areaBasis=choice("areaBasis",["carpet","built_up","plot"])
  if((minArea||maxArea)&&!areaBasis)throw new RequestError("Choose an area basis for area filters",400)
  if(minArea&&maxArea&&minArea>maxArea)throw new RequestError("Minimum area exceeds maximum area",400)
  const yes=(key:string)=>{const value=params.get(key);if(!value)return null;if(value!=="1")throw new RequestError("Invalid property filter",400);return true;}
  const minBathrooms=choice("minBathrooms",["1","2","3","4"]),publishedWithin=choice("publishedWithin",["7","30","90"])
  const sellerRole=choice("sellerRole",["owner","developer","agent","other"]),verifiedOnly=yes("verifiedOnly"),withTour=yes("withTour")
  const page = number("page", 10000, 1)!
  if (!Number.isInteger(page)) throw new RequestError("Invalid result page", 400)
  return {
    ...(region?{region}:{}),
    ...(minArea?{minArea}:{}),...(maxArea?{maxArea}:{}),...(areaBasis?{areaBasis}:{}),...(minBathrooms?{minBathrooms:Number(minBathrooms)}:{}),...(publishedWithin?{publishedWithin:Number(publishedWithin)}:{}),...(sellerRole?{sellerRole}:{}),...(verifiedOnly?{verifiedOnly}:{}),...(withTour?{withTour}:{}),
    query: text("query", 120), city: text("city"), country: text("country"),
    mode: choice("listing", SEARCH_MODES, "buy"),
    type: choice("type", ["Apartment", "Villa", "Penthouse", "Commercial", "Plot", "Residential", "Residential / Group Housing", "Plotted", "Mixed", "Others"]),
    bedrooms: choice("bedrooms", ["1", "2", "3", "4+"]),
    possession: choice("possession", POSSESSION), currency, minPrice, maxPrice,
    sort: choice("sort", ["latest", "ai", "price_low", "price_high"], "latest"), page,
  }
}
