"use client"

import Link from "next/link"
import { useState } from "react"

import {
    User,
    Mail,
    Phone,
    MapPin,
    Pencil,
    Building2,
    Heart,
    Eye,
    Plus,
    Settings,
    Bell,
    LogOut,
    ShieldCheck,
    BadgeCheck,
    ArrowRight,
} from "lucide-react"

export default function ProfilePage() {

    const [user] = useState({
        name: "Raj Kumar",
        email: "raj@example.com",
        phone: "+91 9876543210",
        city: "Kolkata",
        role: "Premium Seller",
    })

    const stats = [
        {
            label: "Properties",
            value: "12",
            icon: Building2,
        },
        {
            label: "Saved",
            value: "48",
            icon: Heart,
        },
        {
            label: "Views",
            value: "2.8K",
            icon: Eye,
        },
    ]

    const actions = [
        {
            label: "Edit Profile",
            href: "/profile/edit",
            icon: Pencil,
        },
        {
            label: "Post Property",
            href: "/real-estate/post-property",
            icon: Plus,
        },
        {
            label: "Notifications",
            href: "/profile/notifications",
            icon: Bell,
        },
        {
            label: "Settings",
            href: "/profile/settings",
            icon: Settings,
        },
    ]

    return (

        <main
            className="
                min-h-screen
                gth-container
                px-4
                py-24
            "
        >

            {/* WRAPPER */}

            <div
                className="
                    max-w-5xl
                    mx-auto
                    gth-stack
                "
            >

                {/* HERO CARD */}

                <section
                    className="
                        gth-glass-ultra
                        rounded-[36px]
                        p-5
                        md:p-8
                        relative
                        overflow-hidden
                    "
                >

                    {/* BG GLOW */}

                    <div
                        className="
                            absolute
                            top-[-100px]
                            right-[-100px]

                            w-[260px]
                            h-[260px]

                            rounded-full

                            blur-3xl

                            opacity-20
                        "
                        style={{
                            background:
                                "var(--gold-gradient)",
                        }}
                    />

                    {/* CONTENT */}

                    <div
                        className="
                            relative
                            z-[2]

                            flex
                            flex-col
                            lg:flex-row

                            gap-8

                            items-start
                            lg:items-center

                            justify-between
                        "
                    >

                        {/* LEFT */}

                        <div
                            className="
                                flex
                                items-center
                                gap-5
                            "
                        >

                            {/* AVATAR */}

                            <div
                                className="
                                    relative

                                    w-[92px]
                                    h-[92px]

                                    rounded-full

                                    flex
                                    items-center
                                    justify-center

                                    shrink-0
                                "
                                style={{
                                    background:
                                        "var(--gold-gradient)",

                                    boxShadow:
                                        "var(--glow-gold)",
                                }}
                            >

                                <User
                                    size={38}
                                    strokeWidth={2.4}
                                    color="#fff"
                                />

                                {/* VERIFIED */}

                                <div
                                    className="
                                        absolute
                                        bottom-0
                                        right-0

                                        w-[28px]
                                        h-[28px]

                                        rounded-full

                                        flex
                                        items-center
                                        justify-center
                                    "
                                    style={{
                                        background:
                                            "var(--bg-soft)",

                                        border:
                                            "2px solid var(--border)",
                                    }}
                                >

                                    <BadgeCheck
                                        size={16}
                                        style={{
                                            color:
                                                "var(--gold)",
                                        }}
                                    />

                                </div>

                            </div>

                            {/* INFO */}

                            <div className="gth-stack">

                                <div>

                                    <div
                                        className="
                                            gth-badge
                                            gth-badge-gold
                                            mb-3
                                        "
                                    >

                                        <ShieldCheck
                                            size={14}
                                        />

                                        Verified Account

                                    </div>

                                    <h1 className="gth-title">
                                        {user.name}
                                    </h1>

                                    <p
                                        className="
                                            gth-sub
                                            mt-2
                                        "
                                    >
                                        {user.role}
                                    </p>

                                </div>

                                {/* META */}

                                <div
                                    className="
                                        flex
                                        flex-wrap
                                        gap-3
                                    "
                                >

                                    <div
                                        className="
                                            gth-glass

                                            px-4
                                            py-2

                                            rounded-full

                                            flex
                                            items-center
                                            gap-2
                                        "
                                    >

                                        <Mail size={15} />

                                        <span
                                            className="
                                                text-sm
                                                whitespace-nowrap
                                            "
                                        >
                                            {user.email}
                                        </span>

                                    </div>

                                    <div
                                        className="
                                            gth-glass

                                            px-4
                                            py-2

                                            rounded-full

                                            flex
                                            items-center
                                            gap-2
                                        "
                                    >

                                        <Phone size={15} />

                                        <span
                                            className="
                                                text-sm
                                                whitespace-nowrap
                                            "
                                        >
                                            {user.phone}
                                        </span>

                                    </div>

                                    <div
                                        className="
                                            gth-glass

                                            px-4
                                            py-2

                                            rounded-full

                                            flex
                                            items-center
                                            gap-2
                                        "
                                    >

                                        <MapPin size={15} />

                                        <span
                                            className="
                                                text-sm
                                                whitespace-nowrap
                                            "
                                        >
                                            {user.city}
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* RIGHT */}

                        <Link
                            href="/real-estate/post-property"
                            className="
                                gth-btn-gold

                                px-6
                                py-4

                                flex
                                items-center
                                gap-3

                                whitespace-nowrap
                            "
                        >

                            <Plus size={18} />

                            Post Property

                        </Link>

                    </div>

                </section>

                {/* STATS */}

                <section
                    className="
                        grid
                        grid-cols-3
                        gap-4
                    "
                >

                    {stats.map((item) => {

                        const Icon = item.icon

                        return (

                            <div
                                key={item.label}
                                className="
                                    gth-glass-ultra

                                    rounded-[28px]

                                    p-5

                                    text-center

                                    gth-card-premium
                                "
                            >

                                <div
                                    className="
                                        mx-auto
                                        mb-4

                                        w-[54px]
                                        h-[54px]

                                        rounded-full

                                        flex
                                        items-center
                                        justify-center
                                    "
                                    style={{
                                        background:
                                            "var(--surface-3)",
                                    }}
                                >

                                    <Icon
                                        size={22}
                                    />

                                </div>

                                <h2
                                    className="
                                        text-xl
                                        font-black
                                    "
                                >
                                    {item.value}
                                </h2>

                                <p className="gth-sub">
                                    {item.label}
                                </p>

                            </div>
                        )
                    })}

                </section>

                {/* ACTIONS */}

                <section
                    className="
                        gth-glass-ultra

                        rounded-[36px]

                        p-5
                        md:p-7
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            justify-between

                            mb-6
                        "
                    >

                        <div>

                            <h2>
                                Account Actions
                            </h2>

                            <p className="gth-sub">
                                Manage your luxury account
                            </p>

                        </div>

                    </div>

                    <div className="gth-stack">

                        {actions.map((item) => {

                            const Icon = item.icon

                            return (

                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="
                                        gth-glass

                                        rounded-[24px]

                                        p-4

                                        flex
                                        items-center
                                        justify-between

                                        transition-all
                                        duration-300

                                        hover:scale-[1.01]
                                    "
                                >

                                    <div
                                        className="
                                            flex
                                            items-center
                                            gap-4
                                        "
                                    >

                                        <div
                                            className="
                                                w-[52px]
                                                h-[52px]

                                                rounded-full

                                                flex
                                                items-center
                                                justify-center
                                            "
                                            style={{
                                                background:
                                                    "var(--surface-3)",
                                            }}
                                        >

                                            <Icon
                                                size={20}
                                            />

                                        </div>

                                        <div>

                                            <h3>
                                                {item.label}
                                            </h3>

                                            <p className="gth-sub">
                                                Open {item.label}
                                            </p>

                                        </div>

                                    </div>

                                    <ArrowRight
                                        size={18}
                                    />

                                </Link>

                            )
                        })}

                    </div>

                </section>

                {/* LOGOUT */}

                <button
                    className="
                        gth-glass

                        rounded-[24px]

                        p-4

                        flex
                        items-center
                        justify-center
                        gap-3

                        transition-all
                        duration-300

                        hover:scale-[1.01]
                    "
                >

                    <LogOut size={18} />

                    Logout

                </button>

            </div>

        </main>
    )
}