import { cache } from "react"
import type { Metadata } from "next"
import { approvedMedia } from "@/lib/real-estate/approved-media"
import { PropertyService } from "@/lib/real-estate/propertyService"
import PropertyDetailClient from "@/components/real-estate/PropertyDetailClient"

const readProperty = cache((slug: string) => PropertyService.getBySlug(slug))
type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const property = await readProperty(slug)
    const title = property?.title || "Property unavailable"
    const description = property?.description?.slice(0, 180) || "Explore recorded project details on GTH PRO. Confirm current prices and availability with the listing contact."
    const image = approvedMedia(slug, property?.image)?.url || "/images/gth-logo.png"
    const canonical = `https://gth-pro.vercel.app/real-estate/${encodeURIComponent(slug)}`
    return {
        title: `${title} | GTH PRO Real Estate`, description,
        alternates: { canonical },
        robots: property ? { index: true, follow: true } : { index: false, follow: true },
        openGraph: { title, description, url: canonical, siteName: "GTH PRO", type: "website", images: [image] },
        twitter: { card: "summary_large_image", title, description, images: [image] },
    }
}

export default async function PropertyPage({ params }: PageProps) {
    const { slug } = await params
    const property = await readProperty(slug)
    let related: any[] = []
    if (property?.city && property.city !== "City not provided") {
        try { related = (await PropertyService.getAll({ city: property.city, limit: 7, sort: "latest" })).filter((item: any) => item.slug !== slug).slice(0, 6) }
        catch { /* Related inventory must not block the current listing. */ }
    }
    const canonical = `https://gth-pro.vercel.app/real-estate/${encodeURIComponent(slug)}`
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
                    { "@type": "ListItem", position: 1, name: "GTH PRO Real Estate", item: "https://gth-pro.vercel.app/real-estate" },
                    { "@type": "ListItem", position: 2, name: property.title, item: canonical },
                ],
            },
        ],
    } : null
    return <>
        {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />}
        <PropertyDetailClient slug={slug} initialData={property} related={related} />
    </>
}
