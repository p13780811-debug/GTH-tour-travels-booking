import {NextResponse} from "next/server";
import {buildPartnerSearch} from "@/lib/travel/partner-search";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  // Reject ambiguous repeated parameters rather than picking an arbitrary value.
  if ([...params.keys()].some(key => !["kind", "destination", "category"].includes(key) || params.getAll(key).length !== 1)) {
    return NextResponse.json({error: "Choose a valid destination and travel category."}, {status: 400});
  }
  const target = buildPartnerSearch(Object.fromEntries(params));
  if (!target) return NextResponse.json({error: "Choose a valid destination and travel category."}, {status: 400});
  const response = NextResponse.redirect(target, 302);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
