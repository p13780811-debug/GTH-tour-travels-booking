import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const origin = searchParams.get("origin") || "DEL";
        const destination = searchParams.get("destination") || "";
        const departDate = searchParams.get("depart_date") || "";

        const token = process.env.AVIASALES_API_TOKEN || process.env.TRAVELPAYOUTS_TOKEN;
        if (!token) return NextResponse.json({ error: "Flight API token missing" }, { status: 401 });

        const apiUrl = new URL("https://api.travelpayouts.com/aviasales/v3/prices_for_dates");
        apiUrl.searchParams.set("origin", origin);
        apiUrl.searchParams.set("destination", destination);
        apiUrl.searchParams.set("departure_at", departDate);
        apiUrl.searchParams.set("currency", "inr");
        apiUrl.searchParams.set("unique", "true");
        apiUrl.searchParams.set("token", token);

        const response = await fetch(apiUrl.toString());
        const data = await response.json();

        return NextResponse.json(data.data || []);
    } catch (err) {
        console.error("Flight API Error:", err);
        return NextResponse.json({ error: "Server error fetching flights" }, { status: 500 });
    }
}