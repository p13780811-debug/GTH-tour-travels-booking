import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const { query } = await req.json()

        if (!query) return NextResponse.json([])

        const prompt = `
        Give 5 short real estate search suggestions for:
        "${query}"

        Only return JSON array.
        Example:
        ["2BHK in Mumbai", "Villa in Goa"]
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
        const text = data.choices?.[0]?.message?.content || "[]"

        return NextResponse.json(JSON.parse(text))
    } catch {
        return NextResponse.json([])
    }
}