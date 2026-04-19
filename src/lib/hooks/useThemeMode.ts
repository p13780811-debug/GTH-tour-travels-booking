"use client"

import { useEffect, useState } from "react"

export function useThemeMode() {
    const [mode, setMode] = useState<"day" | "night">("day")

    useEffect(() => {
        const updateTheme = () => {
            const hour = new Date().getHours()
            if (hour >= 6 && hour < 18) {
                setMode("day")
                document.documentElement.classList.remove("dark")
            } else {
                setMode("night")
                document.documentElement.classList.add("dark")
            }
        }

        updateTheme()
        const interval = setInterval(updateTheme, 60000)

        return () => clearInterval(interval)
    }, [])

    return mode
}