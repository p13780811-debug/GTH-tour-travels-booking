import HeroSection from "@/components/hotel/HeroSection"
import HotelDeals from "@/components/hotel/HotelDeals"
import Activities from "@/components/hotel/Activities"
import CarRental from "@/components/hotel/CarRental"
import BikeRental from "@/components/hotel/BikeRental"
import BlogSection from "@/components/hotel/BlogSection"
import TripPlanner from "@/components/hotel/TripPlanner"

export default async function HotelPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {

    // Next 15 fix
    const { slug } = await params

    // city extract
    const city = slug.split("-")[0]

    return (
        <div className="bg-black text-white">



            <HeroSection slug={slug} city={city} />

            <HotelDeals city={city} />

            <Activities city={city} />

            <CarRental city={city} />

            <BikeRental city={city} />

            <BlogSection city={city} />

            <TripPlanner city={city} />

        </div>
    )
}