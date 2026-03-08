import { NextResponse } from "next/server";

export async function GET(req: Request) {

    try {

        const { searchParams } = new URL(req.url);

        const origin = searchParams.get("origin") || "";
        const destination = searchParams.get("destination") || "";
        const departDate = searchParams.get("depart_date") || "";

        const token = process.env.AVIASALES_API_TOKEN;

        if (!token) {
            return NextResponse.json({
                error: "Flight API token missing"
            });
        }

        const url = new URL(
            "https://api.travelpayouts.com/aviasales/v3/prices_for_dates"
        );

        url.searchParams.set("origin", origin);
        url.searchParams.set("destination", destination);
        url.searchParams.set("departure_at", departDate);
        url.searchParams.set("currency", "inr");
        url.searchParams.set("token", token);

        const response = await fetch(url.toString());

        const data = await response.json();

        return NextResponse.json(data);

    } catch (error) {

        return NextResponse.json({
            error: "Flight API failed"
        });

    }

}