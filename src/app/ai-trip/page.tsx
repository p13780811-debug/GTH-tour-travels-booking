import type { Metadata } from "next";
export const metadata: Metadata = { title: "AI Trip Planner | GTH PRO", robots: { index: false, follow: true } };
import TripPlanner from "@/components/TripPlanner"

export default function AITripPage() {

    return (

        <main className="min-h-screen pt-32 px-6">

            <TripPlanner />

        </main>

    )

}