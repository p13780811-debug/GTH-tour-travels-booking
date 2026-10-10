import { cleanString } from "@/lib/security/validators";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const term = cleanString(searchParams.get("term"), { min: 2, max: 80 });

  if (!term) return Response.json([]);

  const token = (process.env.TRAVELPAYOUTS_TOKEN || process.env.TRAVELPAYOUTS_API_TOKEN);
  if (!token) {
    return Response.json(
      { error: "Places service is not configured" },
      { status: 503 },
    );
  }

  try {
    const url = new URL("https://autocomplete.travelpayouts.com/places2");
    url.searchParams.set("term", term);
    url.searchParams.set("locale", "en");
    url.searchParams.append("types[]", "city");
    url.searchParams.append("types[]", "airport");

    const res = await fetch(url.toString(), {
      headers: { "X-Access-Token": token },
      cache: "no-store",
    });

    if (!res.ok) return Response.json([]);

    const data = await res.json();
    return Response.json(Array.isArray(data) ? data.slice(0, 8) : []);
  } catch {
    return Response.json([]);
  }
}
