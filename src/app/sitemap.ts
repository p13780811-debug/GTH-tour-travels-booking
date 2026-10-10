import { MetadataRoute } from "next"
import { destinations } from "@/data/destinations"

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://gth-pro.vercel.app"

    // Har destination page ke liye dynamic URL mapping
    const destinationPages = destinations.map((d: any) => ({
        url: `${baseUrl}/destinations/${d.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8
    }))

    return [
        {
            url: baseUrl,
            changeFrequency: "daily",
            priority: 1 // Home page sabse important hai
        },
        {
            url: `${baseUrl}/mega-aggregator`,
            changeFrequency: "daily",
            priority: 0.9
        },
        {
            url: `${baseUrl}/flights`, // Naya: Flight traffic ke liye
            priority: 0.8
        },
        {
            url: `${baseUrl}/hotels`, // Naya: Hotel traffic ke liye
            priority: 0.8
        },
        {
            url: `${baseUrl}/real-estate`,
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/real-estate/tools`,
            changeFrequency: "monthly",
            priority: 0.5,
        },
        ...destinationPages
    ]
}
