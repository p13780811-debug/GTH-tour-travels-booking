"use client"

import { readAIReply } from "@/lib/api-response"
import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

export default function ChatBot() {
    const pathname = usePathname()
    const isTender = pathname?.startsWith("/tender")
    const [open, setOpen] = useState(false)

    const [messages, setMessages] = useState([
        {
            role: "bot",
            text: "Hello! I'm the GTH PRO AI assistant. I can help with travel discovery or explain how to start a tender application. Please verify official details and prices with the provider."
        }
    ])

    const [history, setHistory] = useState<any[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    async function sendMessage() {

        if (!input.trim() || loading) return
        const message = input.trim()
        const updatedMessages = [...messages, { role: "user", text: message }]
        setMessages(updatedMessages)
        setLoading(true)
        try {
            const res = await fetch("/api/chat", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, history: history.slice(-20) })
            })
            const reply = await readAIReply(res)
            setMessages([...updatedMessages, { role: "bot", text: reply }])
            setHistory([...history, { role: "user", parts: [{ text: message }] }, { role: "model", parts: [{ text: reply.slice(0, 4000) }] }].slice(-20))
            setInput("")
        } catch (error) {
            setMessages([...updatedMessages, { role: "bot", text: error instanceof Error ? error.message : "Unable to connect. Please try again." }])
        } finally { setLoading(false) }

    }

    return (
        <div className="fixed bottom-6 right-6 z-50">

            {open && (

                <div className="w-80 h-[420px] bg-black text-white rounded-xl p-4 shadow-xl border border-yellow-500 flex flex-col">

                    <div className="mb-3 border-b border-white/20 pb-3">
                        <p className="text-sm font-semibold">GTH PRO · AI Guidance</p>
                        <p className="mt-1 text-xs leading-5 text-white/70">Answers are informational; not confirmed bookings or approved tender submissions.</p>
                        {isTender && <Link href="/tender/assistant" className="mt-2 inline-flex min-h-8 items-center text-xs font-semibold text-amber-200">Open step-by-step Tender Assistant →</Link>}
                    </div>
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
                            maxLength={4000}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isTender ? "Ask about tender preparation..." : "Ask about GTH PRO services..."}
                        />

                        <button
                            disabled={loading}
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