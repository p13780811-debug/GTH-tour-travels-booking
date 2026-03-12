export default function TripPlanner({ city }: any) {

    return (

        <section className="py-20 text-center">

            <h2 className="text-4xl font-bold text-yellow-400 mb-4">
                Plan Your Trip to {city}
            </h2>

            <p className="text-gray-400 mb-6">
                Hotels • Activities • Transport
            </p>

            <button className="bg-yellow-400 text-black px-10 py-3 rounded-full font-bold">
                Start Planning
            </button>

        </section>

    )
}