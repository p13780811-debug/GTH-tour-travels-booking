import { projectPhoto, publishedMediaUrl, type PublishedMedia } from "@/lib/property-media/published-media"

type SchemaProperty = { id: number; title: string; city?: string; country?: string; location?: string }
type SchemaInventory = { id: string; project_id: number; listing_type: string; price_amount: number | null; currency: string; published_at?: string | null; description?: string | null }

/** Registry identity alone is never an offer. Only published, photo-approved units qualify. */
export function realEstateListingSchema(property: SchemaProperty, inventory: readonly SchemaInventory[], media: readonly PublishedMedia[], canonical: string) {
  const photo = projectPhoto(media.filter(item => Number(item.project_id) === Number(property.id)))
  if (!photo) return null
  const offers = inventory.filter(item => Number(item.project_id) === Number(property.id) && ["buy", "rent"].includes(item.listing_type))
  if (!offers.length) return null
  return {
    "@type": "RealEstateListing", "@id": `${canonical}#listing`, url: canonical, name: property.title,
    image: new URL(publishedMediaUrl(photo.id), canonical).toString(),
    ...(offers[0].published_at ? { datePosted: offers[0].published_at } : {}),
    mainEntity: offers.map(item => ({
      "@type": "Offer", "@id": `${canonical}#offer-${item.id}`, url: `${canonical}#inventory`,
      businessFunction: item.listing_type === "rent" ? "http://purl.org/goodrelations/v1#LeaseOut" : "http://purl.org/goodrelations/v1#Sell",
      ...(Number.isFinite(Number(item.price_amount)) && Number(item.price_amount) > 0 && /^[A-Z]{3}$/.test(item.currency)
        ? { price: Number(item.price_amount), priceCurrency: item.currency } : {}),
      ...(item.description ? { description: item.description } : {}),
      itemOffered: { "@type": "Place", name: property.title, address: { "@type": "PostalAddress",
        ...(property.location ? { streetAddress: property.location } : {}),
        ...(property.city ? { addressLocality: property.city } : {}), ...(property.country ? { addressCountry: property.country } : {}),
      } },
    })),
  }
}
