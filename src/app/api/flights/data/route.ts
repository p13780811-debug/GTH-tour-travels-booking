// app/api/flights/data/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const origin = searchParams.get("origin") || "";
    const destination = searchParams.get("destination") || "";
    const departDate = searchParams.get("depart_date") || "";
    const returnDate = searchParams.get("return_date") || "";

    const url = new URL(
        "https://api.travelpayouts.com/aviasales/v3/prices_for_dates"
    );

    url.searchParams.set("origin", origin);
    url.searchParams.set("destination", destination);
    url.searchParams.set("departure_at", departDate);
    url.searchParams.set("return_at", returnDate);
    url.searchParams.set("token", process.env.AVIASALES_API_TOKEN!);

    const response = await fetch(url.toString(), {
        headers: {
            "x-access-token": process.env.AVIASALES_API_TOKEN!,
        },
    });

    const data = await response.json();

    return NextResponse.json(data);
}