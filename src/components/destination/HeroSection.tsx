export default function HeroSection({ destination }: any) {

    return (
        <section className="relative h-[70vh] w-full">

            <img
                src={destination.heroImage}
                className="absolute inset-0 w-full h-full object-cover"
                alt={destination.name}
            />

            <div className="absolute inset-0 bg-black/60" />

            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">

                <h1 className="text-5xl md:text-6xl font-bold text-yellow-400 mb-6">
                    {destination.name}
                </h1>

                <p className="max-w-xl text-gray-300">
                    {destination.description}
                </p>

                <a
                    href={`/go/${destination.slug}`}
                    className="mt-6 bg-yellow-500 text-black px-8 py-3 rounded-lg font-semibold"
                >
                    View Deals →
                </a>

            </div>

        </section>
    )
}