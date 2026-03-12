export default function HeroSection({ city }: any) {

    return (

        <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
            <img
                src={encodeURI(`/images/cities/${city.toLowerCase().replace(/\s+/g, '-')}.jpg`)}
                alt={`${city} luxury destination`}
                className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-black/60" />

            <div className="relative text-center">
                <h1 className="text-4xl font-bold text-white mb-4">
                    Best Hotels in {city.toUpperCase()}
                </h1>
                <p className="text-gray-300">
                    Compare deals from top travel partners
                </p>
            </div>
        </section>
    )
}