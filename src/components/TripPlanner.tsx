"use client"

import { useState, KeyboardEvent } from "react"

export default function TripPlanner() {

    const [question, setQuestion] = useState("")
    const [answer, setAnswer] = useState("")
    const [loading, setLoading] = useState(false)

    async function askAI() {

        if (!question.trim() || loading) return

        try {

            setLoading(true)
            setAnswer("")

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

            setAnswer(data.reply || "No response received.")

        } catch {

            setAnswer("Something went wrong. Please try again.")

        } finally {

            setLoading(false)

        }

    }

    function handleKeyDown(
        e: KeyboardEvent<HTMLInputElement>
    ) {

        if (e.key === "Enter") {
            askAI()
        }

    }

    return (

        <div
            className="
            w-full
            gth-glass
            rounded-[1.8rem]
            border border-primary/10
            p-2.5 md:p-3
            shadow-2xl
            "
        >

            {/* TOP */}
            <div className="flex items-center justify-between mb-2">

                <div>

                    <p
                        className="
                        text-[9px]
                        uppercase
                        tracking-[0.3em]
                        text-primary
                        font-black
                        "
                    >
                        GTH AI
                    </p>

                    <h3
                        className="
                        text-xs md:text-sm
                        font-bold
                        text-foreground
                        "
                    >
                        Trip Planner
                    </h3>

                </div>

                <div
                    className="
                    h-2 w-2
                    rounded-full
                    bg-green-500
                    animate-pulse
                    "
                />

            </div>

            {/* INPUT */}
            <div className="flex gap-2">

                <div className="flex-1 relative">

                    <input
                        value={question}
                        onChange={(e) =>
                            setQuestion(e.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        placeholder="Ask your luxury destination..."
                        className="
                        w-full
                        h-10 md:h-11
                        rounded-2xl
                        gth-glass
                        border border-primary/10
                        px-3 pr-10
                        text-xs md:text-sm
                        text-foreground
                        placeholder:text-muted-foreground
                        outline-none
                        transition-all duration-300
                        focus:border-primary/40
                        "
                    />

                    <div
                        className="
                        absolute
                        right-3
                        top-1/2
                        -translate-y-1/2
                        text-primary
                        text-xs
                        "
                    >
                        ✦
                    </div>

                </div>

                <button
                    onClick={askAI}
                    disabled={loading}
                    className="
                    h-10 md:h-11
                    px-4 md:px-5
                    rounded-2xl
                    gth-btn-gold
                    text-[9px] md:text-[10px]
                    uppercase
                    tracking-[0.2em]
                    font-black
                    transition-all duration-300
                    active:scale-95
                    disabled:opacity-50
                    whitespace-nowrap
                    "
                >

                    {loading
                        ? "Thinking..."
                        : "Ask AI"
                    }

                </button>

            </div>

            {/* ANSWER */}
            {(loading || answer) && (

                <div
                    className="
                    mt-3
                    rounded-2xl
                    gth-glass
                    border border-primary/10
                    p-3
                    "
                >

                    {loading && (

                        <div
                            className="
                            flex items-center gap-2
                            text-xs
                            text-muted-foreground
                            "
                        >

                            <div className="flex gap-1">

                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />

                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" />

                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" />

                            </div>

                            Planning your trip...

                        </div>

                    )}

                    {!loading && answer && (

                        <div className="space-y-2">

                            <div className="flex items-center gap-2">

                                <div
                                    className="
                                    h-6 w-6
                                    rounded-full
                                    gth-btn-gold
                                    flex items-center justify-center
                                    text-[9px]
                                    font-black
                                    "
                                >
                                    AI
                                </div>

                                <p
                                    className="
                                    text-[9px]
                                    uppercase
                                    tracking-[0.25em]
                                    text-primary
                                    font-bold
                                    "
                                >
                                    GTH Concierge
                                </p>

                            </div>

                            <p
                                className="
                                text-xs md:text-sm
                                leading-relaxed
                                text-foreground/90
                                whitespace-pre-line
                                "
                            >
                                {answer}
                            </p>

                        </div>

                    )}

                </div>

            )}

        </div>

    )

}