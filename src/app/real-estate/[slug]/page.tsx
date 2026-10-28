import { realEstateListingSchema } from "@/lib/real-estate/listing-schema"
import { cache } from "react"
import { notFound } from "next/navigation"
import { isIndexableProperty, propertySeo, validPropertySlug } from "@/lib/real-estate/property-seo"
import type { Metadata } from "next"
import { approvedMedia } from "@/lib/real-estate/approved-media"
import { getPublishedProjectMedia, projectCover, publishedMediaUrl } from "@/lib/property-media/published-media"
import { PropertyService } from "@/lib/real-estate/propertyService"
import { supabase } from "@/lib/supabase"
import {RecordPropertyView} from "@/components/real-estate/RecentlyViewed"
import PropertyDetailClient from "@/components/real-estate/PropertyDetailClient"
import { isPublicLaunch, siteUrl } from "@/lib/seo/site"

const readProperty = cache(async (slug: string) => {
    const property = validPropertySlug(slug) ? await PropertyService.getBySlug(slug) : null
    if (!property) return null
    const [units, publishedMedia] = await Promise.all([
        supabase.from("property_inventory").select("id,project_id,listing_type,property_type,bedrooms,bathrooms,area_sqft,price_amount,currency,description,submitter_role,verified,published_at,media_urls,possession_status,area_basis")
            .eq("project_id",property.id).eq("status","published").order("published_at",{ascending:false}).limit(50).abortSignal(AbortSignal.timeout(5000)),
        getPublishedProjectMedia([Number(property.id)]),
    ])
    const inventory = units.error ? [] : units.data || []
    return {...property,active_inventory_count:inventory.length,registry_only:inventory.length===0 && Boolean(property.rera_id),inventory,publishedMedia}
})
type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const property = await readProperty(slug)
    const { title, description } = propertySeo(property)
    const media = approvedMedia(slug, property?.image)
    const published = property ? projectCover(property.publishedMedia) : undefined
    const image = published ? siteUrl(publishedMediaUrl(published.id)) : media?.url || "/images/gth-logo.png"
    const canonical = siteUrl(`/real-estate/${encodeURIComponent(slug)}`)
    return {
        title: { absolute: title }, description,
        alternates: { canonical },
        robots: { index: (isIndexableProperty(property) || Boolean(property?.inventory.length && property?.publishedMedia.some((item:{media_type:string})=>item.media_type==="photo"))) && isPublicLaunch(), follow: Boolean(property) },
        openGraph: { title, description, url: canonical, siteName: "GTH PRO", type: "website", images: [{ url: image, alt: published ? `${property?.title} — ${published.media_type === "render" ? "approved architectural render" : "reviewed project image"}` : media ? property?.title : "GTH PRO logo; project photograph not available" }] },
        twitter: { card: "summary_large_image", title, description, images: [image] },
    }
}

export default async function PropertyPage({ params }: PageProps) {
    const { slug } = await params
    const property = await readProperty(slug)
    if (!property) notFound()
    const { inventory, publishedMedia } = property
    let related: any[] = []
    if (property.city && property.city !== "City not provided") {
        try {
            const result = await supabase.rpc("search_hybrid_properties", {filters:{city:property.city,mode:"buy",page:1}}).abortSignal(AbortSignal.timeout(5000))
            if (!result.error && Array.isArray(result.data?.items)) related = result.data.items.filter((item:{slug:string})=>item.slug!==slug).slice(0,6)
        } catch { /* Related discovery is optional and cannot block a project page. */ }
    }
    const canonical = siteUrl(`/real-estate/${encodeURIComponent(slug)}`)
    const cover = projectCover(publishedMedia)
    const listing = realEstateListingSchema(property, inventory, publishedMedia, canonical)
    const structuredData = property ? {
        "@context": "https://schema.org",
        "@graph": [
            ...(listing ? [listing] : []),
            {
                "@type": "WebPage",
                "@id": `${canonical}#page`,
                url: canonical,
                name: property.title,
                ...(cover ? { primaryImageOfPage: { "@type": "ImageObject", url: siteUrl(publishedMediaUrl(cover.id)), caption: `${property.title} — ${cover.media_type === "render" ? "architectural render" : "reviewed project photo"}` } } : {}),
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
        <RecordPropertyView slug={slug} title={property.title} city={property.city||""}/>
        <PropertyDetailClient slug={slug} initialData={property} related={related} inventory={inventory} publishedMedia={publishedMedia} />
    </>
}
