import HeroSection from "@/components/hotel/HeroSection"
import HotelDeals from "@/components/hotel/HotelDeals"
import Activities from "@/components/hotel/Activities"
import CarRental from "@/components/hotel/CarRental"
import BikeRental from "@/components/hotel/BikeRental"
import BlogSection from "@/components/hotel/BlogSection"
import TripPlanner from "@/components/hotel/TripPlanner"
// Apna naya Grid import karo (Path check kar lena)
import HotelGrid from "@/components/cards/HotelGrid"

export default async function HotelPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {

    // Next 15 fix
    const { slug } = await params

    // "hotels-in-dubai" se sirf "dubai" nikalne ke liye:
    const city = slug.replace("hotels-in-", "").split("-")[0];

    return (
        <div className="bg-black text-white min-h-screen">

            <HeroSection slug={slug} city={city} />

            {/* Ye raha tera naya section jo details page se link hoga */}
            <HotelGrid citySlug={slug} />

            <HotelDeals city={city} />

            <Activities city={city} />

            <CarRental city={city} />

            <BikeRental city={city} />

            <BlogSection city={city} />

            <TripPlanner city={city} />

        </div>
    )
}