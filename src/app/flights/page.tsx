import FlightSearch from "@/components/FlightSearch"


export default function FlightsPage() {

    return (


        <div className="p-10">

            <h1 className="text-3xl font-bold mb-6">
                Search Flights
            </h1>

            <iframe
                src="https://www.travelpayouts.com/widgets/flight_search"
                width="100%"
                height="600"
                loading="lazy"
            />

        </div>

    )

}