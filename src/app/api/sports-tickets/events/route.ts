import { NextResponse } from "next/server";
import { sportsTicketingPageAccessible, searchAuthorizedSportsEvents } from "@/lib/sports-tickets/service";
import { parseSportsTicketFilters } from "@/lib/sports-tickets/validation";
import { AUTHORIZED_TICKET_PROVIDERS } from "@/lib/sports-tickets/providers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!sportsTicketingPageAccessible()) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  const url = new URL(request.url);
  const parsed = parseSportsTicketFilters(url.searchParams);
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid search filters" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const events = await searchAuthorizedSportsEvents(parsed.value);
    return NextResponse.json({ events, count: events.length, providerConnected: AUTHORIZED_TICKET_PROVIDERS.length > 0 },
      { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Events temporarily unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
