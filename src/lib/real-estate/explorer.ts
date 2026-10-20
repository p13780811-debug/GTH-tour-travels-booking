export type ExplorerProperty = {
  id: number; slug: string; title: string; location?: string; city?: string; country?: string;
  district?: string; developer?: string; builder_name?: string; rera_id?: string;
  property_type?: string; image?: string; formatted_price?: string; beds?: number; baths?: number;
  sqft?: number; verified?: boolean; last_verified_at?: string; registry_only?: boolean;
  data_quality_limited?: boolean; active_inventory_count?: number; inventory_min_price?: number;
  inventory_currency?: string; official_source_url?: string; ai_score?: number;
  lat?: number; lng?: number;
  publishedMedia?: import("../property-media/published-media").PublishedMedia[];
}

export function known(value: unknown): string {
  const text = typeof value === "string" ? value.trim() : ""
  return text && !/not (?:provided|recorded)|purpose varies/i.test(text) ? text : ""
}

export function coverage(property: ExplorerProperty) {
  const parts = [
    { label: "Project identity", points: 25, present: Boolean(known(property.title) && property.rera_id) },
    { label: "Official source", points: 20, present: Boolean(property.official_source_url) },
    { label: "Recorded location", points: 15, present: Boolean(known(property.location) || known(property.city) || property.district) },
    { label: "Unit specifications", points: 15, present: !property.data_quality_limited && Number(property.beds) > 0 && Number(property.sqft) > 0 },
    { label: "Published numeric price", points: 15, present: Number(property.inventory_min_price) > 0 && Boolean(property.inventory_currency) },
    { label: "Dated GTH verification", points: 10, present: property.verified === true && Boolean(property.last_verified_at) },
  ]
  return { parts, score: parts.reduce((sum, part) => sum + (part.present ? part.points : 0), 0) }
}

export function compareSelection(items: ExplorerProperty[], property: ExplorerProperty): ExplorerProperty[] {
  if (items.some(item => item.slug === property.slug)) return items.filter(item => item.slug !== property.slug)
  return items.length < 3 ? [...items, property] : items
}

export function recordedNumber(value: unknown, suffix = "") {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? `${number.toLocaleString("en-IN")}${suffix}` : "Not recorded"
}
