import { cities } from "@/data/cities"

const imageMap: Record<string, string> = {
    goa: "photo-1610641818989-c2051b5e2cfd",
    paris: "photo-1551882547-ff43c63efe5c",
    dubai: "photo-1542314831-068cd1dbfeeb",
    jaipur: "photo-1582719478250-c89cae4dc85b",
}

const hotelTypes = ["Resort", "Palace", "Plaza", "Suites", "Inn"]

export function generateHotels(targetSlug?: string) {

    const hotels: any[] = []

    const activeSlug = targetSlug || "goa"

    console.log("Generating for city:", cities.includes(activeSlug as any))

    const cityName = activeSlug.charAt(0).toUpperCase() + activeSlug.slice(1)

    const photoBase =
        imageMap[activeSlug] || "photo-1566073771259-6a8506099945"

    for (let i = 0; i < 10; i++) {

        const type = hotelTypes[i % hotelTypes.length]

        const hotelName = `${cityName} ${type}`

        const cleanSlug =
            `${activeSlug}-${type.toLowerCase()}-${i}`

        hotels.push({
            id: `${activeSlug}-${i}`,
            slug: cleanSlug,
            name: hotelName,
            images: [
                `https://images.unsplash.com/${photoBase}?auto=format&fit=crop&w=800&q=80`,
                `https://images.unsplash.com/${photoBase}?auto=format&fit=crop&w=801&q=80`,
            ],
            location: cityName,
            price: `₹${8000 + i * 500}`,
        })
    }

    return hotels
}