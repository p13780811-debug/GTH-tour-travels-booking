"use client"

import { useState } from "react"

export default function ChatBot() {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState([
        { role: "bot", text: "Hi 👋 I am your luxury travel assistant. Where do you want to travel?" }
    ])
    const [input, setInput] = useState("")

    async function sendMessage() {
        if (!input) return

        const newMessages = [...messages, { role: "user", text: input }]
        setMessages(newMessages)

        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: input }),
        })

        const data = await res.json()

        setMessages([
            ...newMessages,
            { role: "bot", text: data.reply },
        ])

        setInput("")
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {open && (
                <div className="w-80 h-96 bg-black text-white rounded-xl p-4 shadow-xl border border-yellow-500 flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-2 mb-2">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`text-sm p-2 rounded ${m.role === "bot" ? "bg-gray-800" : "bg-yellow-600 text-black"
                                    }`}
                            >
                                {m.text}
                            </div>
                        ))}
                    </div>

                    <div className="flex">
                        <input
                            className="flex-1 bg-gray-800 text-white p-2 text-sm rounded-l"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask something..."
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-yellow-500 px-3 rounded-r"
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={() => setOpen(!open)}
                className="bg-yellow-500 text-black px-4 py-3 rounded-full shadow-lg"
            >
                AI
            </button>
        </div>
    )
}