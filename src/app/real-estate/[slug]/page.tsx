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
    return {
        title: `${title} | GTH PRO Real Estate`, description,
        alternates: { canonical: `https://gth-pro.vercel.app/real-estate/${encodeURIComponent(slug)}` },
        robots: property ? { index: true, follow: true } : { index: false, follow: true },
        openGraph: { title, description, type: "website", images: [image] },
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
    return <PropertyDetailClient slug={slug} initialData={property} related={related} />
}
