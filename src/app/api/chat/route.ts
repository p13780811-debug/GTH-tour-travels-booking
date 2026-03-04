import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const { message } = await req.json()

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: message }],
                        },
                    ],
                }),
            }
        )

        const data = await response.json()

        const text =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No response from AI"

        return NextResponse.json({ reply: text })

    } catch (error) {
        console.error("Gemini Error:", error)
        return NextResponse.json(
            { reply: "AI service error." },
            { status: 500 }
        )
    }
}