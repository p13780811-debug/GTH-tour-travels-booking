import { NextResponse } from "next/server";
import { cleanDate, cleanIata } from "@/lib/security/validators";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const origin = cleanIata(searchParams.get("origin") || "DEL");
    const destination = cleanIata(searchParams.get("destination") || "BOM");
    const departDateRaw = searchParams.get("depart_date");
    const departDate = departDateRaw ? cleanDate(departDateRaw) : "";

    if (!origin || !destination || (departDateRaw && !departDate)) {
      return NextResponse.json({ error: "Invalid flight search parameters" }, { status: 400 });
    }

    const token =
      process.env.AVIASALES_API_TOKEN ||
      (process.env.TRAVELPAYOUTS_TOKEN || process.env.TRAVELPAYOUTS_API_TOKEN);

    if (!token) {
      return NextResponse.json(
        { error: "Flight service is not configured" },
        { status: 503 },
      );
    }

    const apiUrl = new URL(
      "https://api.travelpayouts.com/aviasales/v3/prices_for_dates",
    );

    apiUrl.searchParams.set("origin", origin);
    apiUrl.searchParams.set("destination", destination);
    if (departDate) apiUrl.searchParams.set("departure_at", departDate);
    apiUrl.searchParams.set("currency", "inr");
    apiUrl.searchParams.set("unique", "true");
    apiUrl.searchParams.set("token", token);

    const res = await fetch(apiUrl.toString(), {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Flight provider request failed" },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(Array.isArray(data?.data) ? data.data : []);
  } catch {
    return NextResponse.json({ error: "Flight API failed" }, { status: 500 });
  }
}
