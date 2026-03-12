export default function CarRental({ city }: any) {

    return (

        <section className="py-16 text-center">

            <h2 className="text-3xl font-bold text-yellow-400 mb-4">
                Car Rentals in {city}
            </h2>

            <a
                href="#"
                className="bg-yellow-400 text-black px-8 py-3 rounded-full font-bold"
            >
                Search Cars
            </a>

        </section>

    )
}