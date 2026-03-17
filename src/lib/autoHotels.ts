// @ts-nocheck
import { cities } from "@/data/cities"

const hotelTypes = ["Resort", "Palace", "Plaza", "Suites", "Inn", "Villas", "Grand", "Heritage"]

export function generateHotels(targetSlug?: string) {
    const hotels: any[] = []
    const activeSlug = targetSlug || "goa"
    // City name ko capitalize karo (e.g., goa -> Goa)
    const cityName = activeSlug.charAt(0).toUpperCase() + activeSlug.slice(1)

    for (let i = 0; i < 8; i++) {
        const type = hotelTypes[i % hotelTypes.length]
        const hotelName = `${cityName} ${type}`
        const cleanSlug = `${activeSlug}-${type.toLowerCase()}-${i}`

        // 🔥 ASALI JADU: Pexels Dynamic Search URL
        // Hum Pexels ko bol rahe hain: "${cityName} luxury hotel" dhundo.
        // index (i) badalne se har hotel ki photo badal jayegi par relevant rahegi.
        const pexelsPhoto = `https://images.pexels.com/photos/search/${activeSlug}%20hotel%20resort?auto=compress&cs=tinysrgb&fit=crop&h=600&w=800&seed=${i + 10}`;

        hotels.push({
            id: `${activeSlug}-${i}`,
            slug: cleanSlug,
            name: hotelName,
            // Images array mein Pexels ke links dal diye
            images: [
                pexelsPhoto,
                `https://images.pexels.com/photos/search/${activeSlug}%20room?auto=compress&cs=tinysrgb&fit=crop&h=600&w=800&seed=${i + 20}`,
            ],
            location: cityName,
            price: `₹${8000 + i * 500}`,
        })
    }

    return hotels
}