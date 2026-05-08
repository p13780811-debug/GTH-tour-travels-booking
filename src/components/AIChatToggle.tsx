"use client"

import { useEffect, useRef, useState } from "react"
import AIChat from "./AIChat"
import { MessageCircle, X, Mic, Sparkles } from "lucide-react"

export default function AIChatToggle({ properties, setFiltered, setActive }: any) {

    const [open, setOpen] = useState(false)
    const [queryHint, setQueryHint] = useState("")
    const [listening, setListening] = useState(false)

    const orbRef = useRef<HTMLDivElement>(null)

    // =========================
    // AUTO OPEN (smart delay)
    // =========================
    useEffect(() => {
        const t = setTimeout(() => setOpen(true), 8000)
        return () => clearTimeout(t)
    }, [])

    // =========================
    // ESC CLOSE
    // =========================
    useEffect(() => {
        const esc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false)
        }
        window.addEventListener("keydown", esc)
        return () => window.removeEventListener("keydown", esc)
    }, [])

    // =========================
    // AIRBNB STYLE AI SCROLL DETECTION
    // =========================
    useEffect(() => {
        let timer: any

        const onScroll = () => {
            clearTimeout(timer)

            timer = setTimeout(() => {
                const hints = [
                    "Find 2BHK under 50L near you",
                    "Luxury villas in your city",
                    "Best rental deals today",
                    "Commercial office spaces nearby"
                ]

                const pick = hints[Math.floor(Math.random() * hints.length)]
                setQueryHint(pick)

                console.log("AI SUGGESTION:", pick)
            }, 900)
        }

        window.addEventListener("scroll", onScroll)
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    // =========================
    // VOICE SEARCH (REAL)
    // =========================
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

            console.log("VOICE SEARCH:", text)

            // 🔥 AUTO FILTER (AI SEARCH HOOK)
            const result = properties.filter((p: any) =>
                p.title?.toLowerCase().includes(text.toLowerCase()) ||
                p.location?.toLowerCase().includes(text.toLowerCase())
            )

            setFiltered(result)
            setActive(result?.[0] || null)

            setListening(false)
        }

        recognition.onend = () => setListening(false)
    }

    // =========================
    // AI PROPERTY RECOMMENDER
    // =========================
    const getSmartRecommendations = () => {
        if (!properties?.length) return []

        return properties
            .filter((p: any) => {
                const price = Number(p.price || 0)

                return (
                    p.is_featured ||
                    price < 60 ||
                    p.location?.toLowerCase().includes("metro") ||
                    p.title?.toLowerCase().includes("villa")
                )
            })
            .slice(0, 5)
    }

    const recommendations = getSmartRecommendations()

    return (
        <>
            {/* 🌟 FLOATING ORB (CSS untouched) */}
            <div
                ref={orbRef}
                className="fixed bottom-24 right-6 z-[99999]"
            >
                <div
                    onClick={() => setOpen(!open)}
                    className="gth-btn rounded-full p-4 shadow-xl relative"
                >
                    <div className="absolute inset-0 animate-ping bg-cyan-400/20 rounded-full"></div>

                    {open ? (
                        <X size={20} />
                    ) : (
                        <MessageCircle size={20} />
                    )}
                </div>



                {/* ✨ AI HINT (Airbnb style popup) */}
                {queryHint && (
                    <div className="absolute bottom-20 right-0 bg-black/80 text-white text-[10px] px-2 py-1 rounded">
                        <Sparkles size={10} /> {queryHint}
                    </div>
                )}
            </div>

            {/* 💬 CHAT PANEL */}
            {open && (
                <div
                    className="fixed inset-0 z-[99998] bg-black/40 backdrop-blur-sm flex justify-end items-end"
                    onClick={() => setOpen(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full md:w-[380px] h-[80vh] gth-glass-strong rounded-t-3xl overflow-hidden"
                    >
                        <AIChat
                            properties={recommendations}
                            setFiltered={setFiltered}
                            setActive={setActive}
                        />
                    </div>
                </div>
            )}
        </>
    )
}