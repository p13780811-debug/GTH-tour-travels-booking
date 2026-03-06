import { cities } from "@/data/cities"

export function generateDestinations() {

    return cities.map((slug, index) => {

        const name =
            slug
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")

        const hotels = Array.from({ length: 10 }).map((_, i) => ({
            name: `${name} Hotel ${i + 1}`,
            price: `₹${(2000 + i * 700).toLocaleString()}`
        }))

        return {
            slug,
            name,
            description: `Discover ${name}. Compare hotels, tours and travel deals.`,

            // ✅ AUTO IMAGE (never blank)
            heroImage: `https://picsum.photos/seed/${slug}/1600/900`,

            featuredHotel: {
                name: `${name} Grand Resort`,
                location: name,
                price: "Starting ₹4,999",
                whatsapp: "919999999999"
            },

            hotels,

            guides: [
                { name: `${name} Local Guide`, experience: "5 years experience" },
                { name: `${name} Tour Expert`, experience: "7 years experience" }
            ]
        }

    })

}