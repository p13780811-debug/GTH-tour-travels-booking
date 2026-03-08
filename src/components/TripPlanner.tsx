"use client"

import { useState } from "react"

export default function TripPlanner() {

    const [question, setQuestion] = useState("")
    const [answer, setAnswer] = useState("")
    const [loading, setLoading] = useState(false)

    async function askAI() {

        if (!question) return

        setLoading(true)

        const res = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: question
            })
        })

        const data = await res.json()

        setAnswer(data.reply)

        setLoading(false)

    }

    return (

        <div className="max-w-3xl mx-auto bg-black/70 backdrop-blur-md p-6 rounded-xl border border-yellow-500/20">

            <h3 className="text-yellow-400 font-semibold mb-4">
                AI Trip Planner
            </h3>

            <div className="flex gap-3">

                <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask about destinations..."
                    className="flex-1 text-white p-3 rounded bg-black border border-gray-700"
                />

                <button
                    onClick={askAI}
                    className="bg-yellow-400 px-5 rounded text-black font-semibold"
                >
                    Ask
                </button>

            </div>

            {loading && (
                <p className="text-gray-400 mt-4">Thinking...</p>
            )}

            {answer && (
                <div className="mt-4 p-4 bg-[#111] rounded text-gray-300">
                    {answer}
                </div>
            )}

        </div>
    )
}