import { NextResponse } from "next/server";
import { parseTenderFilters, searchPublicTenders } from "@/lib/tender/catalog";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export async function GET(request: Request) {
  const valid = parseTenderFilters(new URL(request.url).searchParams);
  if (!valid.ok) return NextResponse.json({ error: valid.error }, { status: 400, headers });
  const result = await searchPublicTenders(valid.filters);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status, headers });
  return NextResponse.json({ items: result.items, total: result.total, page: result.page, pageSize: result.size }, { headers });
}

// Import/publication is privileged and NEVER accepted through a public API.
export async function POST() {
  return NextResponse.json({ error: "Public tender submission is not supported" },
    { status: 405, headers: { ...headers, Allow: "GET" } });
}
