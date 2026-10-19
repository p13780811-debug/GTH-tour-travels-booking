/** Licensed editorial imagery. Never evidence of a project's appearance or amenities. */
export type PropertyVisual = { url: string; sourceUrl: string; label: string; illustrative: true }
const photo = (id: number, slug: string, label: string): PropertyVisual => ({
  url: `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`,
  sourceUrl: `https://www.pexels.com/photo/${slug}-${id}/`, label, illustrative: true,
})
export const PROPERTY_VISUAL_BANK = {
  highrise: [
    photo(24419853, "facade-of-a-modern-apartment-building-complex", "High-rise architecture inspiration"),
    photo(17846345, "facade-of-modern-apartment-buildings-in-city", "Contemporary residential architecture"),
    photo(33247908, "modern-high-rise-residential-buildings-with-glass-facades", "Glass-facade architecture inspiration"),
    photo(33513949, "modern-high-rise-apartment-building-facade", "Residential tower inspiration"),
  ],
  township: [
    photo(34450814, "modern-residential-complex-with-green-park", "Landscaped community inspiration"),
    photo(1587947, "brown-concrete-houses-and-green-leafed-trees", "Residential community inspiration"),
  ],
  commercial: [
    photo(18710790, "modern-glass-office-building", "Commercial architecture inspiration"),
    photo(16974980, "modern-glass-office-buildings", "Office-tower architecture inspiration"),
  ],
  interior: [
    photo(11296221, "modern-interior-design-of-apartment-living-room", "Sample living room · not a project interior"),
    photo(6588599, "interior-of-modern-apartment-living-room", "Sample interior · not a project specification"),
  ],
  aerial: [photo(4426231, "aerial-view-of-contemporary-city-buildings", "Urban design inspiration · not a project location")],
} as const

export function getPropertyVisuals(district: string, locality: string, propertyType: string, unitTypes: string[] = [], seed = "") {
  const area = `${district} ${locality}`.normalize("NFKC").toLowerCase()
  const category = /commercial|office/i.test(propertyType) ? "commercial"
    : /thane|dombivli|palava|kalyan|panvel/.test(area) ? "township" : "highrise"
  const hash = [...`${seed}|${area}|${propertyType}|${unitTypes.join(",")}`].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 7)
  const bank = PROPERTY_VISUAL_BANK[category]
  const hero = bank[hash % bank.length]
  const interior = PROPERTY_VISUAL_BANK.interior[hash % PROPERTY_VISUAL_BANK.interior.length]
  const gallery = [hero, interior, PROPERTY_VISUAL_BANK.aerial[0]]
  return { category, hero, heroImage: hero.url, gallery, galleryImages: gallery.map(item => item.url), fallback: bank[(hash + 1) % bank.length] }
}

export function responsivePhoto(url: string, width: number): string {
  try { const u = new URL(url); if (u.hostname !== "images.pexels.com") return url; u.searchParams.set("w", String(width)); return u.toString() } catch { return url }
}
