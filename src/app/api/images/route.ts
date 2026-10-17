import { enforceRateLimit } from "@/lib/security/rate-limit";
import { requestError } from "@/lib/security/request";
import { cleanString } from "@/lib/security/validators";
import {approvedPexelsIllustrations} from "@/lib/travel/pexels-hotel-illustrations";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const mode = params.get("mode");
  const hotelIllustrations = mode === "hotel_illustration";
  if (mode && !hotelIllustrations)
    return Response.json({ error: "Invalid image mode" }, { status: 400 });
  const cityInput = params.get("city") || "";
  const city = cityInput ? cleanString(cityInput, {
    min: 2, max: 60, pattern: /^[\\p{L}\\p{M}\\s.'-]+$/u,
  }) : "";
  if (hotelIllustrations && cityInput && !city)
    return Response.json({ error: "Invalid destination" }, { status: 400 });
  const query = hotelIllustrations
    ? (city ? city + " travel architecture accommodation" : "travel hotel architecture")
    : cleanString(params.get("query"), { min: 2, max: 80 });
  if (!query) return Response.json({ error: "Invalid image query" }, { status: 400 });
  const key = process.env.PEXELS_API_KEY;
  if (!key) return Response.json({ error: "Image service is not configured" }, { status: 503 });
  try {
    await enforceRateLimit(req, "images");
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", hotelIllustrations ? "4" : "1");
    if (hotelIllustrations) url.searchParams.set("orientation", "landscape");
    const res = await fetch(url, { headers: { Authorization: key }, signal: AbortSignal.timeout(8000), next: { revalidate: 3600 } });
    if (!res.ok) return Response.json({ error: "Image service unavailable" }, { status: 502 });
    const data = await res.json();
    if (hotelIllustrations) {
      return Response.json({
        photos: approvedPexelsIllustrations(data),
        source: "Pexels", usage: "illustrative_only",
      }, {headers:{"Cache-Control":"private, max-age=0","X-Content-Type-Options":"nosniff"}});
    }
    const image = data?.photos?.[0]?.src?.large;
    return Response.json({ image: typeof image === "string" && image.startsWith("https://images.pexels.com/") ? image : null });
  } catch (error) { return requestError(error); }
}
