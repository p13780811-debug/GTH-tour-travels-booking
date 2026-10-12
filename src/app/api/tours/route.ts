import { NextResponse } from "next/server";
import { searchTours } from "@/lib/tours";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const result = await searchTours({
    city: params.get("city"),
    category: params.get("category"),
    minPrice: params.get("minPrice"),
    maxPrice: params.get("maxPrice"),
  });
  if (result.error) {
    return NextResponse.json({ error: result.error }, {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return NextResponse.json({ items: result.items, totalShown: result.items.length, source: "GTH PRO tour listings" }, {
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
