export default function HeroSection({ destination }: any) {

    return (
        <section className="relative w-full min-h-[70vh] flex items-center justify-center overflow-hidden">

            {/* HERO IMAGE */}
            <img
                src={`/images/cities/${destination.slug}.jpg`}
                alt={destination.name}
                className="absolute inset-0 w-full h-full object-cover -z-10"
            />

            {/* DARK OVERLAY */}
            <div className="absolute inset-0 bg-black/60 -z-0"></div>

            {/* CONTENT */}
            <div className="relative z-10 text-center px-6">

                <h1 className="text-5xl md:text-6xl font-bold text-yellow-400 mb-6">
                    {destination.name}
                </h1>

                <p className="max-w-xl mx-auto text-gray-300">
                    Luxury travel guide for {destination.name}. Discover premium hotels
                    and unforgettable experiences.
                </p>

                <a
                    href={`/go/${destination.slug}`}
                    className="inline-block mt-6 bg-yellow-500 text-black px-8 py-3 rounded-lg font-semibold"
                >
                    View Deals →
                </a>

            </div>

        </section>
    )
}