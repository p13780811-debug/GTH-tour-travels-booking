import { MetadataRoute } from "next"
import { destinations } from "@/data/destinations"

export default function sitemap(): MetadataRoute.Sitemap {
    // Sanjay bhai, jab aapka final domain aaye toh yahan update karna
    const baseUrl = "https://gth-tour-travels-booking.vercel.app"

    // Har destination page ke liye dynamic URL mapping
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
            changeFrequency: "daily",
            priority: 1 // Home page sabse important hai
        },
        {
            url: `${baseUrl}/mega-aggregator`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9
        },
        {
            url: `${baseUrl}/flights`, // Naya: Flight traffic ke liye
            lastModified: new Date(),
            priority: 0.8
        },
        {
            url: `${baseUrl}/hotels`, // Naya: Hotel traffic ke liye
            lastModified: new Date(),
            priority: 0.8
        },
        ...destinationPages
    ]
}