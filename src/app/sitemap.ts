import { MetadataRoute } from "next"
import { destinations } from "@/data/destinations"

export default function sitemap(): MetadataRoute.Sitemap {

    const baseUrl = "https://gth-tour-travels-booking.vercel.app"

    const destinationPages = destinations.map((d: any) => ({
        url: `${baseUrl}/destinations/${d.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8
    }))

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            priority: 1
        },

        {
            url: `${baseUrl}/mega-aggregator`,
            lastModified: new Date(),
        },
        ...destinationPages


    ]

}