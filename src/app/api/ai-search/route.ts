import { readJson, RequestError, requestError } from "@/lib/security/request";
import { NextResponse } from "next/server";
import { cleanString } from "@/lib/security/validators";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const query = cleanString(body?.query, { min: 2, max: 300 });

    if (!query) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI search is not configured" },
        { status: 503 },
      );
    }

    const prompt = [
      "Extract real estate filters from the user query.",
      "Return strict JSON only with keys: city, minPrice, maxPrice, type.",
      `User query: ${query}`,
    ].join("\n");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "AI provider request failed" }, { status: 502 });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "{}";

    let filters: unknown;
    try { filters = JSON.parse(text); } catch { throw new RequestError("Invalid AI response", 502); }
    if (!filters || typeof filters !== "object" || Array.isArray(filters)) throw new RequestError("Invalid AI response", 502);
    const values = filters as Record<string, unknown>;
    const city = values.city == null ? null : cleanString(values.city, { max: 80 });
    const type = values.type == null ? null : cleanString(values.type, { max: 40 });
    const price = (value: unknown) => value == null ? null : typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1e12 ? value : undefined;
    const minPrice = price(values.minPrice);
    const maxPrice = price(values.maxPrice);
    if ((values.city != null && !city) || (values.type != null && !type) || minPrice === undefined || maxPrice === undefined ||
        (minPrice !== null && maxPrice !== null && minPrice > maxPrice)) throw new RequestError("Invalid AI response", 502);
    return NextResponse.json({ city, type, minPrice, maxPrice });
  } catch (error) { return requestError(error); }
}
