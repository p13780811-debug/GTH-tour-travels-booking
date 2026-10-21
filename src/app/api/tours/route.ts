import { NextResponse } from "next/server";
import { searchTours } from "@/lib/tours";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const keys = ["city","category","minPrice","maxPrice","currency","page","sort"];
  if (keys.some(key=>params.getAll(key).length>1)) {
    return NextResponse.json({error:"Choose one value for each tour filter."}, {
      status:400, headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"},
    });
  }
  const result = await searchTours({
    city: params.get("city"),
    category: params.get("category"),
    minPrice: params.get("minPrice"),
    maxPrice: params.get("maxPrice"),
    currency: params.get("currency"),
    page: params.get("page"),
    sort: params.get("sort"),
  });
  if (result.error) {
    return NextResponse.json({ error: result.error }, {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return NextResponse.json(result.items, {
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
      "X-Total-Count":String(result.total),"X-Page":String(result.page),"X-Page-Size":String(result.pageSize) },
  });
}
