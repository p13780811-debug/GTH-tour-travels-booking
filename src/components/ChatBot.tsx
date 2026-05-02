"use client"

import { useState } from "react"

export default function ChatBot() {

    const [open, setOpen] = useState(false)

    const [messages, setMessages] = useState([
        {
            role: "bot",
            text: "Hello 👋 I am your AI travel assistant. Ask me about destinations, hotels, or trips."
        }
    ])

    const [history, setHistory] = useState<any[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    async function sendMessage() {

        if (!input) return

        const userMessage = { role: "user", text: input }

        const updatedMessages = [...messages, userMessage]

        setMessages(updatedMessages)

        setLoading(true)

        const res = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: input,
                history: history
            })
        })

        const data = await res.json()

        const botMessage = { role: "bot", text: data.reply }

        setMessages([...updatedMessages, botMessage])

        setHistory([
            ...history,
            { role: "user", parts: [{ text: input }] },
            { role: "model", parts: [{ text: data.reply }] }
        ])

        setInput("")
        setLoading(false)

    }

    return (
        <div className="fixed bottom-6 right-6 z-50">

            {open && (

                <div className="w-80 h-[420px] bg-black text-white rounded-xl p-4 shadow-xl border border-yellow-500 flex flex-col">

                    <div className="flex-1 overflow-y-auto space-y-2 mb-2">

                        {messages.map((m, i) => (

                            <div
                                key={i}
                                className={`text-sm p-2 rounded max-w-[80%] ${m.role === "bot"
                                    ? "gth-glass-800"
                                    : "gth-btn-gold text-black ml-auto"
                                    }`}
                            >
                                {m.text}
                            </div>

                        ))}

                        {loading && (
                            <div className="text-xs text-gray-400">
                                AI typing...
                            </div>
                        )}

                    </div>

                    <div className="flex">

                        <input
                            className="flex-1 gth-glass-800 text-white p-2 text-sm rounded-l outline-none"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about travel..."
                        />

                        <button
                            onClick={sendMessage}
                            className="gth-btn-gold px-4 rounded-r text-black font-bold"
                        >
                            ➤
                        </button>

                    </div>

                </div>

            )}

            <button
                onClick={() => setOpen(!open)}
                className="gth-btn-gold text-black px-4 py-3 rounded-full shadow-lg font-bold"
            >
                AI
            </button>

        </div>
    )

}