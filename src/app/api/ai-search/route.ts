import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const { query } = await req.json()

    const prompt = `
    Extract real estate filters from this query:
    "${query}"

    Return JSON only:
    {
      city: string,
      minPrice: number,
      maxPrice: number,
      type: string
    }
    `

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
        }),
    })

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || "{}"

    try {
        return NextResponse.json(JSON.parse(text))
    } catch {
        return NextResponse.json({})
    }
}