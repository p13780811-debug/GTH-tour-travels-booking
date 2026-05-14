"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo, useState } from "react"

import {
    Home,
    Search,
    Plus,
    User,
} from "lucide-react"

import AddPropertyModal from "@/components/real-estate/AddPropertyModal"
import LoginModal from "@/components/real-estate/auth/LoginModal"

type BottomNavProps = {
    user?: any
}

export default function BottomNav({
    user,
}: BottomNavProps) {

    const pathname = usePathname()

    const [showPostModal, setShowPostModal] =
        useState(false)

    const [showLoginModal, setShowLoginModal] =
        useState(false)

    // =========================
    // ACTIVE DETECT
    // =========================

    const isActive = (href: string) => {

        if (href === "/real-estate") {
            return pathname === href
        }

        return pathname.startsWith(href)
    }

    // =========================
    // NAV ITEMS
    // =========================

    const items = useMemo(() => [

        {
            href: "/real-estate",
            label: "Home",
            icon: Home,
        },

        {
            href: "/real-estate/search",
            label: "Search",
            icon: Search,
        },

        {
            href: "/real-estate/profile",
            label: "Profile",
            icon: User,
        },

    ], [])

    // =========================
    // POST CLICK
    // =========================

    const handlePostClick = () => {

        /*
            AUTH CHECK

            Replace with Supabase/Auth logic later
        */

        const isLoggedIn = !!user

        if (!isLoggedIn) {

            setShowLoginModal(true)
            return
        }

        setShowPostModal(true)
    }

    // =========================
    // SAVE PROPERTY
    // =========================

    const handleSaveProperty = async (
        propertyData: any
    ) => {

        try {

            /*
                REAL API / SUPABASE SAVE

                await fetch(...)
                await supabase.from(...)

            */

            console.log(
                "PROPERTY DATA",
                propertyData
            )

            setShowPostModal(false)

        } catch (err) {

            console.error(err)
        }
    }

    // =========================
    // UI
    // =========================

    return (

        <>

            {/* ========================= */}
            {/* MOBILE NAV */}
            {/* ========================= */}

            <nav
                className="fixed bottom-0 left-0 w-full bg-black border-t border-slate-800 flex justify-around py-2 z-50 md:hidden">

                {/* ========================= */}
                {/* LEFT SIDE */}
                {/* ========================= */}

                <div
                    className="
                        flex
                        items-center

                        w-[50%]
                    "
                >

                    {items.slice(0, 2).map((item) => {

                        const Icon = item.icon

                        const active =
                            isActive(item.href)

                        return (

                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    
                                    relative

                                    w-[50%]
                                    flex-shrink-0
                                    whitespace-nowrap

                                    h-[62px]

                                    flex
                                    flex-col
                                    items-center
                                    justify-center

                                    rounded-[22px]

                                    transition-all
                                    duration-300

                                    active:scale-[0.96]

                                    ${active
                                        ? `
                                            bg-[var(--surface-3)]

                                            text-[var(--gold)]

                                            shadow-[0_10px_30px_rgba(212,175,55,0.12)]
                                        `
                                        : `
                                            text-[var(--text-soft)]

                                            hover:bg-white/[0.03]
                                        `
                                    }
                                `}
                            >

                                {/* ACTIVE GLOW */}

                                {active && (

                                    <div
                                        className="
                                            absolute
                                            inset-0

                                            rounded-[22px]

                                            border
                                            border-white/10
                                        "
                                    />
                                )}

                                <Icon
                                    size={20}
                                    strokeWidth={2.5}
                                />

                                <span
                                    className="
                                        mt-1

                                        text-[11px]
                                        font-[800]

                                        tracking-[0.02em]
                                    "
                                >
                                    {item.label}
                                </span>

                            </Link>
                        )
                    })}

                </div>

                {/* ========================= */}
                {/* CENTER POST BUTTON */}
                {/* ========================= */}

                <button
                    onClick={handlePostClick}
                    aria-label="Post Property"
                    className="
    absolute
    left-1/2
    -translate-x-1/2
    -top-5

    h-[64px]
    w-[64px]

    rounded-full

    flex
    items-center
    justify-center

    bg-[var(--btn-bg)]
    text-[var(--btn-text)]

    shadow-[var(--btn-shadow)]

    border
    border-[var(--border)]

    transition-all
    duration-300

    active:scale-95
"
                >

                    {/* INNER RING */}

                    <div
                        className="
                            absolute
                            inset-[6px]

                            rounded-full

                            border
                            border-white/10
                        "
                    />

                    <Plus
                        size={30}
                        strokeWidth={2.8}
                    />

                </button>

                {/* ========================= */}
                {/* RIGHT SIDE */}
                {/* ========================= */}

                <div
                    className="
                        flex
                        items-center
                        justify-end

                        w-[50%]
                    "
                >

                    {items.slice(2).map((item) => {

                        const Icon = item.icon

                        const active =
                            isActive(item.href)

                        return (

                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    
                                    relative

                                    w-[50%]
                                    flex-shrink-0
                                    whitespace-nowrap

                                    h-[62px]

                                    flex
                                    flex-col
                                    items-center
                                    justify-center

                                    rounded-[22px]

                                    transition-all
                                    duration-300

                                    active:scale-[0.96]

                                    ${active
                                        ? `
                                            bg-[var(--surface-3)]

                                            text-[var(--gold)]

                                            shadow-[0_10px_30px_rgba(212,175,55,0.12)]
                                        `
                                        : `
                                            text-[var(--text-soft)]

                                            hover:bg-white/[0.03]
                                        `
                                    }
                                `}
                            >

                                {/* ACTIVE GLOW */}

                                {active && (

                                    <div
                                        className="
                                            absolute
                                            inset-0

                                            rounded-[22px]

                                            border
                                            border-white/10
                                        "
                                    />
                                )}

                                <Icon
                                    size={20}
                                    strokeWidth={2.5}
                                />

                                <span
                                    className="
                                        mt-1

                                        text-[11px]
                                        font-[800]

                                        tracking-[0.02em]
                                    "
                                >
                                    {item.label}
                                </span>

                            </Link>
                        )
                    })}

                </div>

            </nav>

            {/* ========================= */}
            {/* LOGIN MODAL */}
            {/* ========================= */}

            {showLoginModal && (

                <LoginModal

                    onClose={() =>
                        setShowLoginModal(false)
                    }
                />
            )}

            {/* ========================= */}
            {/* ADD PROPERTY */}
            {/* ========================= */}

            {showPostModal && (

                <AddPropertyModal

                    onClose={() =>
                        setShowPostModal(false)
                    }

                    onSave={
                        handleSaveProperty
                    }
                />
            )}

        </>
    )
}