import { NextResponse } from "next/server"

export async function POST(req: Request) {

    try {

        const { message, history } = await req.json()

        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        ...(history || []),
                        {
                            role: "user",
                            parts: [{ text: message }]
                        }
                    ]
                })
            }
        )

        const data = await res.json()

        const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Sorry, I couldn't respond."

        return NextResponse.json({ reply })

    } catch (error) {

        console.error(error)

        return NextResponse.json({
            reply: "AI server error"
        })

    }

}