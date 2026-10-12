import { cleanString } from "@/lib/security/validators";

type Place = { name: string; code: string; country: string | null };

function normalizePlace(item: unknown): Place | null {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
  const data = item as Record<string, unknown>;
  const code = typeof data.code === "string" ? data.code.toUpperCase() : "";
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const country = typeof data.country_name === "string" ? data.country_name.trim() : null;
  if (!/^[A-Z]{3}$/.test(code) || !name || name.length > 120) return null;
  return { code, name, country };
}

export async function GET(req: Request) {
  const term = cleanString(new URL(req.url).searchParams.get("term"), {
    min: 2, max: 64, pattern: /^[\p{L}\p{M}\p{N}\s().,'-]+$/u,
  });
  if (!term) return Response.json([], { headers: { "Cache-Control": "no-store" } });

  try {
    const url = new URL("https://autocomplete.travelpayouts.com/places2");
    url.searchParams.set("term", term);
    url.searchParams.set("locale", "en");
    url.searchParams.append("types[]", "city");
    url.searchParams.append("types[]", "airport");

    const token = process.env.TRAVELPAYOUTS_TOKEN || process.env.TRAVELPAYOUTS_API_TOKEN;
    const response = await fetch(url, {
      headers: token ? { "X-Access-Token": token } : {},
      signal: AbortSignal.timeout(5_000),
      next: { revalidate: 300 },
    });
    if (!response.ok) return Response.json([]);
    const data: unknown = await response.json();
    if (!Array.isArray(data)) return Response.json([]);

    const places: Place[] = [];
    const seen = new Set<string>();
    for (const row of data) {
      const place = normalizePlace(row);
      if (place && !seen.has(place.code)) {
        seen.add(place.code);
        places.push(place);
      }
      if (places.length === 8) break;
    }
    return Response.json(places, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json([], { headers: { "Cache-Control": "no-store" } });
  }
}
