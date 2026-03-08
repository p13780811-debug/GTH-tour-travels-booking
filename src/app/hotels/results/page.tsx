"use client"

import { useSearchParams } from "next/navigation"

export default function HotelResults() {

    const params = useSearchParams()

    const city = params.get("city")

    return (

        <main className="min-h-screen pt-24 px-6">

            <h1 className="text-4xl font-bold mb-8">
                Hotels in {city}
            </h1>

            <iframe
                src={`https://www.travelpayouts.com/widgets/hotels?destination=${city}`}
                width="100%"
                height="700"
            />

        </main>

    )

}