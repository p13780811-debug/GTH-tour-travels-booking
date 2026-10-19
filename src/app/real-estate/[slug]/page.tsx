import { cache } from "react"
import { notFound } from "next/navigation"
import { isIndexableProperty, propertySeo, validPropertySlug } from "@/lib/real-estate/property-seo"
import type { Metadata } from "next"
import { approvedMedia } from "@/lib/real-estate/approved-media"
import { PropertyService } from "@/lib/real-estate/propertyService"
import { supabase } from "@/lib/supabase"
import PropertyDetailClient from "@/components/real-estate/PropertyDetailClient"
import { isPublicLaunch, siteUrl } from "@/lib/seo/site"

const readProperty = cache((slug: string) => validPropertySlug(slug) ? PropertyService.getBySlug(slug) : Promise.resolve(null))
type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const property = await readProperty(slug)
    const { title, description } = propertySeo(property)
    const media = approvedMedia(slug, property?.image)
    const image = media?.url || "/images/gth-logo.png"
    const canonical = siteUrl(`/real-estate/${encodeURIComponent(slug)}`)
    return {
        title: { absolute: title }, description,
        alternates: { canonical },
        robots: { index: isIndexableProperty(property) && isPublicLaunch(), follow: Boolean(property) },
        openGraph: { title, description, url: canonical, siteName: "GTH PRO", type: "website", images: [{ url: image, alt: media ? property?.title : "Illustrative architecture, not a project photo" }] },
        twitter: { card: "summary_large_image", title, description, images: [image] },
    }
}

export default async function PropertyPage({ params }: PageProps) {
    const { slug } = await params
    const property = await readProperty(slug)
    if (!property) notFound()
    const [inventory, related] = await Promise.all([
        (async () => {
            try {
                const { data, error } = await supabase.from("property_inventory")
                    .select("id,project_id,listing_type,property_type,bedrooms,bathrooms,area_sqft,price_amount,currency,description,submitter_role,verified,published_at,media_urls")
                    .eq("project_id", property.id).eq("status", "published")
                    .order("published_at", { ascending: false }).limit(50)
                return !error && Array.isArray(data) ? data : []
            } catch { return [] }
        })(),
        (async () => {
            if (!property.city || property.city === "City not provided") return []
            try { return (await PropertyService.getAll({ city: property.city, limit: 7, sort: "latest" })).filter((item: { slug: string }) => item.slug !== slug).slice(0, 6) }
            catch { return [] }
        })(),
    ])
    const canonical = siteUrl(`/real-estate/${encodeURIComponent(slug)}`)
    const structuredData = property ? {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                "@id": `${canonical}#page`,
                url: canonical,
                name: property.title,
                ...(property.description ? { description: property.description } : {}),
                breadcrumb: { "@id": `${canonical}#breadcrumb` },
            },
            {
                "@type": "BreadcrumbList",
                "@id": `${canonical}#breadcrumb`,
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "GTH PRO Real Estate", item: siteUrl("/real-estate") },
                    { "@type": "ListItem", position: 2, name: property.title, item: canonical },
                ],
            },
        ],
    } : null
    return <>
        {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />}
        <PropertyDetailClient slug={slug} initialData={property} related={related} inventory={inventory} />
    </>
}
