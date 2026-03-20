import NetflixCarousel from "@/components/NetflixCarousel"

export default function HotelSection({ destination }: any) {

    return (
        <NetflixCarousel
            title={`Hotels in ${destination.name}`}
            tagline={`Best hotels and luxury stays in ${destination.name}`}
            items={destination.hotels}
            type="hotel"
        />
    )

}