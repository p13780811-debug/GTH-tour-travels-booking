"use client"

import { useState, useEffect } from "react"
import { detectMode } from "@/lib/aiRouter"
import { Mic } from "lucide-react"

function AIChat({ properties, setFiltered, setActive }: any) {

    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [listening, setListening] = useState(false)
    // 🧠 GLOBAL MEMORY (MULTI DOMAIN)
    const [memory, setMemory] = useState<any>({
        lastCity: "",
        lastBudget: 0,
        lastType: "",
        intent: "",
        lastMode: ""
    })

    useEffect(() => {
        const saved = localStorage.getItem("ai-memory")
        if (saved) setMemory(JSON.parse(saved))
    }, [])

    useEffect(() => {
        localStorage.setItem("ai-memory", JSON.stringify(memory))
    }, [memory])

    // 🧠 AREA SUGGESTION
    const suggestArea = (city: string, budget: number) => {
        const map: any = {
            mumbai: {
                low: ["Mira Road", "Virar"],
                mid: ["Thane", "Navi Mumbai"],
                high: ["Bandra", "Andheri", "Juhu"]
            },
            delhi: {
                low: ["Uttam Nagar"],
                mid: ["Dwarka"],
                high: ["Gurgaon"]
            },
            kolkata: {
                low: ["Barasat"],
                mid: ["New Town"],
                high: ["Salt Lake", "Ballygunge"]
            }
        }

        if (!city || !map[city]) return ""

        if (budget < 5000000) return map[city].low.join(", ")
        if (budget < 15000000) return map[city].mid.join(", ")
        return map[city].high.join(", ")
    }

    // 💰 SALES MODE (AUTO CLOSER)
    const generateDealCloser = (result: any[]) => {
        if (!result.length) return ""

        const r = result[Math.floor(Math.random() * result.length)]

        return `
🔥 HOT DEAL ALERT

🏠 ${r.title}
📍 ${r.location}
💰 ₹${r.price}

⚡ People are booking fast
👉 Want direct owner contact?
`
    }

    useEffect(() => {
        setMessages([
            {
                role: "bot",
                text: "🤖 AI Hub Ready.\nReal Estate | Travel | SaaS | Portfolio\n\nAsk anything..."
            }
        ])
    }, [])

    // ============================
    // 🚀 MAIN AI ENGINE
    // ============================
    const sendMessage = async () => {

        if (!input) return

        const mode = detectMode(input) // 🔥 AI ROUTER

        const userMsg = { role: "user", text: input }
        setMessages(prev => [...prev, userMsg])
        setLoading(true)

        // ============================
        // 🏡 REAL ESTATE MODE
        // ============================
        if (mode === "real_estate") {

            let filters: any = {}

            try {
                const res = await fetch("/api/ai-search", {
                    method: "POST",
                    body: JSON.stringify({ query: input }),
                })
                filters = await res.json()
            } catch (err) {
                console.error("AI Search Error", err)
            }

            if (!filters || Object.keys(filters).length === 0) {

                const q = input.toLowerCase()

                let city = ""
                let maxPrice = Infinity
                let minPrice = 0
                let type = ""

                const cities = ["mumbai", "delhi", "kolkata", "bangalore", "pune"]
                cities.forEach(c => {
                    if (q.includes(c)) city = c
                })

                const priceMatch = q.match(/(\d+)(k|lakh|crore)?/)
                if (priceMatch) {
                    let value = Number(priceMatch[1])
                    const unit = priceMatch[2]

                    if (unit === "k") value *= 1000
                    if (unit === "lakh") value *= 100000
                    if (unit === "crore") value *= 10000000

                    if (q.includes("under")) maxPrice = value
                    if (q.includes("above")) minPrice = value
                }

                if (q.includes("2bhk")) type = "2bhk"
                if (q.includes("3bhk")) type = "3bhk"
                if (q.includes("villa")) type = "villa"

                filters = { city, minPrice, maxPrice, type }
            }

            const result = properties.filter((p: any) => {
                const price = Number(p.price) || 0
                return (
                    (!filters.city || p.location?.toLowerCase().includes(filters.city)) &&
                    (!filters.minPrice || price >= filters.minPrice) &&
                    (!filters.maxPrice || price <= filters.maxPrice) &&
                    (!filters.type || p.title?.toLowerCase().includes(filters.type))
                )
            })

            setFiltered(result)

            if (!result.length) {
                setMessages(prev => [...prev, {
                    role: "bot",
                    text: "❌ No property found. Try increasing budget."
                }])
                setLoading(false)
                return
            }

            const first = result[0]
            if (first?.lat && first?.lng) {
                setActive({
                    id: first.id,
                    coords: [first.lat, first.lng],
                })
            }

            setMemory({
                lastCity: filters.city || memory.lastCity,
                lastBudget: filters.maxPrice || memory.lastBudget,
                lastType: filters.type || memory.lastType,
                intent: "search",
                lastMode: "real_estate"
            })

            const area = suggestArea(filters.city, filters.maxPrice)

            let text = `🏠 Found ${result.length} properties`

            if (area) text += `\n💡 Best areas: ${area}`

            text += generateDealCloser(result) // 🔥 SALES MODE

            setMessages(prev => [...prev, { role: "bot", text }])

            setLoading(false)
            setInput("")
            return
        }



        // ============================
        // ✈️ TRAVEL MODE
        // ============================
        if (mode === "travel") {

            const res = await fetch("/api/ai-trip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input })
            })

            const data = await res.json()

            setMessages(prev => [...prev, {
                role: "bot",
                text: data.reply
            }])

            setLoading(false)
            setInput("")
            return
        }

        // ============================
        // 💻 GENERAL / SaaS / CHAT MODE
        // ============================
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: input })
        })

        const data = await res.json()

        setMessages(prev => [...prev, {
            role: "bot",
            text: data.reply
        }])

        setLoading(false)
        setInput("")
    }
    const startVoice = () => {
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

        if (!SpeechRecognition) {
            alert("Voice not supported")
            return
        }

        const recognition = new SpeechRecognition()
        recognition.lang = "en-IN"
        recognition.start()

        setListening(true)

        recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript
            setInput(text)
            setListening(false)
        }

        recognition.onend = () => setListening(false)
    }


    return (
        <div className="w-full h-full flex flex-col text-white">

            <div className="p-3 border-b border-white/10 font-bold">
                GTH AI HUB
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={`p-2 rounded ${m.role === "user"
                            ? "gth-btn-gold text-black ml-auto"
                            : "gth-glass-800"
                            }`}
                    >
                        {m.text}
                    </div>
                ))}
                {loading && <div>⚡ AI Thinking...</div>}
            </div>

            <div className="flex items-center border-t border-white/10 bg-black sticky bottom-0 p-2 gap-2">

                {/* INPUT */}
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 p-2 bg-transparent outline-none text-white"
                    placeholder={listening ? "Listening..." : "Ask anything..."}
                />

                {/* MIC */}
                <button
                    onClick={startVoice}
                    className={`p-2 rounded-full transition ${listening ? "bg-red-500 animate-pulse" : "bg-white/10"
                        }`}
                >
                    <Mic size={16} />
                </button>

                {/* SEND */}
                <button
                    onClick={sendMessage}
                    className="gth-btn-gold px-4 py-2 text-black font-bold rounded"
                >
                    Send
                </button>
            </div>

        </div>
    )
}

export default AIChat