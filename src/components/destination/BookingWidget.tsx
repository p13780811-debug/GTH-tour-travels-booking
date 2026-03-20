export default function BookingWidget() {

    return (

        <section className="max-w-6xl mx-auto py-16">

            <h2 className="text-3xl font-bold mb-6">
                Book Your Trip
            </h2>

            <div className="bg-zinc-900 p-8 rounded-xl">

                <iframe
                    src="https://www.travelpayouts.com/widgets/flight_search"
                    width="100%"
                    height="400"
                />

            </div>

        </section>

    )

}