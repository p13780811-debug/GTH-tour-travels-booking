"use client"

import { Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"

export default function ThemeToggle() {

    const [dark, setDark] = useState(true)

    useEffect(() => {

        const saved =
            localStorage.getItem("theme-mode")

        const isDark =
            saved !== "day"

        setDark(isDark)

        document.documentElement.classList.toggle(
            "dark",
            isDark
        )

    }, [])

    const toggleTheme = () => {

        const next = !dark

        setDark(next)

        document.documentElement.classList.toggle(
            "dark",
            next
        )

        localStorage.setItem(
            "theme-mode",
            next ? "night" : "day"
        )
    }

    return (

        <button
            onClick={toggleTheme}
            className="
            gth-glass
            flex items-center justify-center
            h-11 w-11 rounded-full
            "
        >

            {dark
                ? <Sun size={18} />
                : <Moon size={18} />
            }

        </button>
    )
}