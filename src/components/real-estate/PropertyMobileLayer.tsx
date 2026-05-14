"use client"

import { useEffect, useState } from "react"

import AIChatToggle from "@/components/AIChatToggle"
import BottomNav from "@/components/mobile/BottomNav"

type Props = {
    property: any
}

export default function PropertyMobileLayer({
    property,
}: Props) {

    const [isMobile, setIsMobile] = useState(false)

    const [showMap, setShowMap] = useState(false)

    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {

        const check = () => {
            setIsMobile(window.innerWidth < 768)
        }

        check()

        window.addEventListener("resize", check)

        return () =>
            window.removeEventListener("resize", check)

    }, [])

    return (
        <>
            {/* 📱 REAL ESTATE NAV */}

            {isMobile && (

                <BottomNav />

            )}

            {/* 🤖 AI CHAT */}

            <div className="relative z-[999999]">

                <AIChatToggle
                    properties={[property]}
                    setFiltered={() => { }}
                    setActive={() => { }}
                />

            </div>
        </>
    )
}