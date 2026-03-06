import { cities } from "@/data/cities"

export function generateBlogs() {

    return cities.map((city) => {

        const name =
            city
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")

        return {
            slug: `${city}-travel-guide`,
            title: `${name} Travel Guide 2026`,
            description: `Complete travel guide for ${name}. Best hotels, attractions and travel tips.`,
            image: "https://picsum.photos/seed/${slug}-travel-blog/1200/800"
        }

    })

}