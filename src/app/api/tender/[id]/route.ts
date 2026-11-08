import { NextResponse } from "next/server";
import {getCachedPublicTender as getPublicTender} from "@/lib/tender/public-reader";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await getPublicTender(id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status, headers:{...headers,...(result.status===429?{"Retry-After":"60"}:{})} });
  if (!result.item) return NextResponse.json({ error: "Tender not found" }, { status: 404, headers });
  return NextResponse.json(result.item, { headers });
}
