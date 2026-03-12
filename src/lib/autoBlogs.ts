import { cities } from "@/data/cities";

export function generateBlogs() {
    return cities.map((city) => {

        const name = city
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

        const slug = `${city}-travel-guide`;

        return {
            slug,
            title: `${name} Travel Guide 2026`,
            description: `Complete travel guide for ${name}. Best hotels, attractions and travel tips.`,
            image: `/images/cities/${city}.jpg`
        };

    });
}