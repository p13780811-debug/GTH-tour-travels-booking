"use client"

import { useEffect, useState } from "react"
import AIChat from "./AIChat"
import { MessageCircle, X } from "lucide-react"

export default function AIChatToggle({ properties, setFiltered, setActive }: any) {

    const [open, setOpen] = useState(false)

    useEffect(() => {
        const handleEsc = (e: any) => {
            if (e.key === "Escape") setOpen(false)
        }
        window.addEventListener("keydown", handleEsc)
        return () => window.removeEventListener("keydown", handleEsc)
    }, [])

    useEffect(() => {
        const t = setTimeout(() => {
            setOpen(true)
        }, 5000)

        return () => clearTimeout(t)
    }, [])

    return (
        <>
            {/* 🔘 Floating Button */}
            <button
                onClick={() => setOpen(!open)}
                className="
    fixed bottom-24 md:bottom-6 right-6 z-[10000]
    gth-btn rounded-full p-4 shadow-xl
    transition-all duration-300
    active:scale-90
    "
            >
                {open ? <X size={20} /> : <MessageCircle size={20} />}
            </button>

            {/* 💬 Chat Box */}
            {open && (
                <div
                    className="
        fixed inset-0 z-[10000]
        flex items-end md:items-end justify-center md:justify-end pt-20 pb-24 md:pb-0
        bg-black/40 backdrop-blur-sm
        "
                    onClick={() => setOpen(false)}
                >

                    {/* CHAT PANEL */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="
    w-full md:w-[360px]
    max-h-[80vh] md:h-[500px]
    rounded-t-3xl md:rounded-2xl
    gth-glass-strong
    overflow-hidden
    animate-slideUp
  "
                    >

                        <div className="w-full flex justify-center py-2">
                            <div className="w-12 h-1.5 rounded-full bg-white/30"></div>
                        </div>
                        <AIChat
                            properties={properties}
                            setFiltered={setFiltered}
                            setActive={setActive}
                        />
                    </div>

                </div>
            )}
        </>
    )
}