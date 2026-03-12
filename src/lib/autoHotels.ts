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
    const cityName = activeSlug.charAt(0).toUpperCase() + activeSlug.slice(1)

    // Aapki di hui 3 FREE IDs jo kabhi hide nahi hongi
    const myFreePhotos = [
        "photo-1625244724120-1fd1d34d00f6", // ID 1
        "photo-1651147572891-a37a866c557c", // ID 2
        "photo-1611892440504-42a792e24d32"  // ID 3
    ]

    for (let i = 0; i < 10; i++) {
        const type = hotelTypes[i % hotelTypes.length]
        const hotelName = `${cityName} ${type}`
        const cleanSlug = `${activeSlug}-${type.toLowerCase()}-${i}`

        // i % 3 se aapki teeno photos auto-rotate hongi
        const selectedId = myFreePhotos[i % myFreePhotos.length]

        hotels.push({
            id: `${activeSlug}-${i}`,
            slug: cleanSlug,
            name: hotelName,
            images: [
                `https://images.unsplash.com/${selectedId}?auto=format&fit=crop&w=800&q=80`,
                `https://images.unsplash.com/${selectedId}?auto=format&fit=crop&w=801&q=80`,
            ],
            location: cityName,
            price: `₹${8000 + i * 500}`,
        })
    }

    return hotels
}