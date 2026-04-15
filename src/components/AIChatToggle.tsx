"use client"

import { useState } from "react"
import AIChat from "./AIChat"
import { MessageCircle, X } from "lucide-react"

export default function AIChatToggle({ properties, setFiltered, setActive }: any) {

    const [open, setOpen] = useState(false)

    return (
        <>
            {/* 🔘 Floating Button */}
            <button
                onClick={() => setOpen(!open)}
                className="fixed bottom-5 right-5 z-[9999] bg-cyan-500 text-black p-3 rounded-full shadow-lg"
            >
                {open ? <X /> : <MessageCircle />}
            </button>

            {/* 💬 Chat Box */}
            {open && (
                <div className="fixed bottom-20 right-5 z-[9999] w-[320px] h-[420px]">
                    <AIChat
                        properties={properties}
                        setFiltered={setFiltered}
                        setActive={setActive}
                    />
                </div>
            )}
        </>
    )
}