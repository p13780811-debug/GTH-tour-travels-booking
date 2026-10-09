import { NextResponse } from "next/server";
import { cleanString } from "@/lib/security/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "AI provider request failed" }, { status: 502 });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "{}";

    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return NextResponse.json({});
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
