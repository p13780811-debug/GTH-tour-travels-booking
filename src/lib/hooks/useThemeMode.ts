"use client"

import { useEffect, useState } from "react"

type ThemeMode = "day" | "night"

export function useThemeMode(): [ThemeMode, () => void] {

    const [mode, setMode] =
        useState<ThemeMode>("night")

    // =====================================
    // GET AUTO MOBILE THEME
    // =====================================

    const getMobileTheme = (): ThemeMode => {

        const hour =
            new Date().getHours()

        return hour >= 6 && hour < 18
            ? "day"
            : "night"
    }

    // =====================================
    // APPLY THEME
    // =====================================

    const applyTheme = (theme: ThemeMode) => {

        setMode(theme)

        document.documentElement.classList.toggle(
            "dark",
            theme === "night"
        )
    }

    // =====================================
    // INIT
    // =====================================

    useEffect(() => {

        const isMobile =
            window.innerWidth < 768

        const saved =
            localStorage.getItem(
                "theme-mode"
            ) as ThemeMode | null

        // =================================
        // DESKTOP = ALWAYS NIGHT
        // =================================

        if (!isMobile) {

            applyTheme("night")

            return
        }

        // =================================
        // MOBILE MANUAL OVERRIDE
        // =================================

        if (
            saved === "day" ||
            saved === "night"
        ) {

            applyTheme(saved)

        }

        // =================================
        // MOBILE AUTO MODE
        // =================================

        else {

            applyTheme(
                getMobileTheme()
            )
        }

        // =================================
        // AUTO UPDATE
        // =================================

        const interval =
            setInterval(() => {

                const manual =
                    localStorage.getItem(
                        "theme-mode"
                    )

                // ONLY AUTO WHEN NO MANUAL MODE
                if (!manual) {

                    applyTheme(
                        getMobileTheme()
                    )
                }

            }, 60000)

        return () =>
            clearInterval(interval)

    }, [])

    // =====================================
    // TOGGLE
    // =====================================

    const toggleTheme = () => {

        const next =
            mode === "night"
                ? "day"
                : "night"

        localStorage.setItem(
            "theme-mode",
            next
        )

        applyTheme(next)
    }

    return [mode, toggleTheme]
}