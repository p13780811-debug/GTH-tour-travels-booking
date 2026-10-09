import { cleanString } from "@/lib/security/validators";

export async function GET(req: Request) {
  const query = cleanString(new URL(req.url).searchParams.get("query"), { min: 2, max: 80 });
  if (!query) return Response.json({ error: "Invalid image query" }, { status: 400 });
  const key = process.env.PEXELS_API_KEY;
  if (!key) return Response.json({ error: "Image service is not configured" }, { status: 503 });
  try {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "1");
    const res = await fetch(url, { headers: { Authorization: key }, signal: AbortSignal.timeout(8000), next: { revalidate: 3600 } });
    if (!res.ok) return Response.json({ error: "Image service unavailable" }, { status: 502 });
    const data = await res.json();
    const image = data?.photos?.[0]?.src?.large;
    return Response.json({ image: typeof image === "string" && image.startsWith("https://images.pexels.com/") ? image : null });
  } catch { return Response.json({ error: "Image service unavailable" }, { status: 502 }); }
}
