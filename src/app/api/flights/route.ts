import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const origin = searchParams.get("origin") || "DEL";
        const destination = searchParams.get("destination") || "BOM";
        const departDate = searchParams.get("depart_date") || "";

        const token =
            process.env.AVIASALES_API_TOKEN ||
            process.env.TRAVELPAYOUTS_TOKEN;

        if (!token) {
            return NextResponse.json(
                { error: "Flight API token missing" },
                { status: 401 }
            );
        }

        const apiUrl = new URL(
            "https://api.travelpayouts.com/aviasales/v3/prices_for_dates"
        );

        apiUrl.searchParams.set("origin", origin);
        apiUrl.searchParams.set("destination", destination);
        apiUrl.searchParams.set("departure_at", departDate);
        apiUrl.searchParams.set("currency", "inr");
        apiUrl.searchParams.set("unique", "true");
        apiUrl.searchParams.set("token", token);

        const res = await fetch(apiUrl.toString(), {
            next: { revalidate: 1800 }, // cache 30 min
        });

        const data = await res.json();

        return NextResponse.json(data.data || []);
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Flight API failed" },
            { status: 500 }
        );
    }
}