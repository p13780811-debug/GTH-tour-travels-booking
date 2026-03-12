import { generateHotels } from "./autoHotels"

export const fetchGTHData = async (city: string) => {

    try {

        // Supabase data fetch
        const res = await fetch(`${process.env.TRAVELPAYOUTS_API_TOKEN}/api/hotels?city=${city}`, {
            cache: "no-store"
        })

        if (!res.ok) {
            console.log("Supabase API failed, using fallback")
            return generateHotels(city)
        }

        const data = await res.json()

        if (!data || data.length === 0) {
            return generateHotels(city)
        }

        return data

    } catch (error) {

        console.log("Aggregator fallback mode")

        return generateHotels(city)

    }

}