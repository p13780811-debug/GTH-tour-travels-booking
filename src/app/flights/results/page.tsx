"use client"

import { useSearchParams } from "next/navigation"

export default function FlightResults() {

    const params = useSearchParams()

    const from = params.get("from")
    const to = params.get("to")
    const date = params.get("date")

    return (

        <div>

            <h1>
                Flights {from} → {to}
            </h1>

            <iframe
                src={`https://www.travelpayouts.com/widgets/flights?origin=${from}&destination=${to}`}
                width="100%"
                height="600"
            />

        </div>

    )

}