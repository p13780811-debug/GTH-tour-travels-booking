"use client"

import { useEffect, useState } from "react"

type ThemeMode = "day" | "night"

export function useThemeMode(): ThemeMode {
    const [mode, setMode] = useState<ThemeMode>("day")

    useEffect(() => {
        const updateTheme = () => {
            const saved = localStorage.getItem("theme-mode") as ThemeMode | null

            // 👉 USER override (highest priority)
            if (saved === "day" || saved === "night") {
                setMode(saved)
                document.documentElement.classList.toggle("dark", saved === "night")
                return
            }

            // 👉 DEVICE check
            const isMobile = window.innerWidth < 768

            // 👉 TIME check
            const hour = new Date().getHours()
            const isNightTime = hour < 6 || hour >= 18

            // 👉 FINAL LOGIC
            let final: ThemeMode

            if (isMobile) {
                // Mobile par: Raat ko night mode, din mein day mode
                final = isNightTime ? "night" : "day"
            } else {
                // Desktop: Hamesha night mode (Luxury branding)
                final = "night"
            }

            setMode(final)
            document.documentElement.classList.toggle("dark", final === "night")
        }

        updateTheme()
        window.addEventListener("resize", updateTheme)

        const interval = setInterval(updateTheme, 60000)

        return () => {
            window.removeEventListener("resize", updateTheme)
            clearInterval(interval)
        }
    }, [])

    return mode
}