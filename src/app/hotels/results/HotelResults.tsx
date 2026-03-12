"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function HotelResults() {

    const params = useSearchParams()
    const router = useRouter()

    const city = params.get("city")

    return (
        <div className="min-h-screen bg-black pt-24 px-6">

            <button
                onClick={() => router.back()}
                className="text-gray-400 flex items-center gap-2 mb-6"
            >
                <ArrowLeft size={16} /> Back
            </button>

            <div className="max-w-7xl mx-auto border border-white/10 rounded-3xl overflow-hidden">

                <iframe
                    src={`https://www.travelpayouts.com/widgets/hotels?destination=${city}&marker=YOUR_MARKER_ID`}
                    width="100%"
                    height="900"
                    className="border-none"
                />

            </div>

        </div>
    )
}