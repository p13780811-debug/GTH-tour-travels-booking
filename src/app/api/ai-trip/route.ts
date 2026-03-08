import { NextResponse } from "next/server"

export async function POST(req: Request) {

    try {

        const { message } = await req.json()

        const res = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + process.env.GEMINI_API_KEY,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `You are an expert luxury travel agent. 
                  Create a travel itinerary with flights, hotels and activities.
                  User request: ${message}`
                                }
                            ]
                        }
                    ]
                })
            }
        )

        const data = await res.json()

        const reply =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Sorry, I couldn't generate a trip."

        return NextResponse.json({ reply })

    } catch (err) {

        return NextResponse.json({ reply: "AI error" })

    }

}