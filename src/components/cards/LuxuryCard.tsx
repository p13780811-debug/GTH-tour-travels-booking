"use client"

import Image from "next/image"
import Link from "next/link"

import {
    ArrowUpRight,
    MapPin,
    Sparkles,
    Star,
} from "lucide-react"

interface Props {
    title: string
    description?: string
    price?: string
    image?: string
    slug: string
    location?: string
    featured?: boolean
}

export default function LuxuryCard({
    title,
    description,
    price,
    image,
    slug,
    location,
    featured,
}: Props) {

    return (

        <Link
            href={`/destinations/${slug}`}
            className="
                group
                relative
                block
                overflow-hidden

                rounded-[32px]

                border
                border-[var(--border)]

                gth-glass
                gth-card-premium
                gth-shimmer

                shadow-[var(--shadow)]

                transition-all
                duration-500
            "
        >

            {/* ========================= */}
            {/* IMAGE */}
            {/* ========================= */}

            <div
                className={`
                    relative
                    overflow-hidden

                    ${featured
                        ? "h-[520px]"
                        : "h-[360px]"
                    }
                `}
            >

                <Image
                    src={
                        image ||
                        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop"
                    }
                    alt={title}
                    fill
                    priority={featured}
                    sizes="
                        (max-width:768px) 100vw,
                        (max-width:1200px) 50vw,
                        33vw
                    "
                    className="
                        object-cover

                        transition-transform
                        duration-700

                        group-hover:scale-[1.06]
                    "
                />

                {/* ========================= */}
                {/* OVERLAY */}
                {/* ========================= */}

                <div
                    className="
                        absolute
                        inset-0

                        bg-gradient-to-t
                        from-black/90
                        via-black/25
                        to-transparent
                    "
                />

                {/* ========================= */}
                {/* AMBIENT GOLD */}
                {/* ========================= */}

                <div
                    className="
                        absolute
                        -top-10
                        right-0

                        h-[180px]
                        w-[180px]

                        rounded-full

                        bg-[var(--gold)]/10

                        blur-3xl
                    "
                />

                {/* ========================= */}
                {/* TOP BADGES */}
                {/* ========================= */}

                <div
                    className="
                        absolute
                        left-5
                        top-5
                        right-5

                        flex
                        items-start
                        justify-between
                        gap-3
                    "
                >

                    {/* LUXURY BADGE */}

                    <div
                        className="
                            inline-flex
                            items-center
                            gap-2

                            rounded-full

                            border
                            border-white/10

                            bg-black/30

                            px-4
                            py-2

                            backdrop-blur-md
                        "
                    >

                        <Sparkles
                            size={13}
                            className="
                                text-[var(--gold)]
                            "
                        />

                        <span
                            className="
                                text-[10px]
                                font-black
                                uppercase
                                tracking-[0.22em]

                                text-white/90
                            "
                        >
                            GTH Elite
                        </span>

                    </div>

                    {/* RATING */}

                    <div
                        className="
                            inline-flex
                            items-center
                            gap-1.5

                            rounded-full

                            border
                            border-white/10

                            bg-black/30

                            px-3
                            py-2

                            backdrop-blur-md
                        "
                    >

                        <Star
                            size={12}
                            fill="currentColor"
                            className="
                                text-[var(--gold)]
                            "
                        />

                        <span
                            className="
                                text-xs
                                font-bold
                                text-white
                            "
                        >
                            4.9
                        </span>

                    </div>

                </div>

                {/* ========================= */}
                {/* CONTENT */}
                {/* ========================= */}

                <div
                    className="
                        absolute
                        inset-x-0
                        bottom-0

                        p-5
                        md:p-7
                    "
                >

                    {/* LOCATION */}

                    <div
                        className="
                            inline-flex
                            items-center
                            gap-2

                            rounded-full

                            border
                            border-white/10

                            bg-black/20

                            px-3
                            py-1.5

                            backdrop-blur-md
                        "
                    >

                        <MapPin
                            size={12}
                            className="
                                text-[var(--gold)]
                            "
                        />

                        <span
                            className="
                                text-[11px]
                                font-semibold

                                tracking-[0.08em]

                                text-white/80
                            "
                        >
                            {location ||
                                "Global Luxury Destination"}
                        </span>

                    </div>

                    {/* TITLE */}

                    <h3
                        className={`
                            mt-5

                            font-black
                            tracking-tight

                            text-white

                            leading-[0.95]

                            ${featured
                                ? "text-4xl md:text-5xl"
                                : "text-2xl md:text-3xl"
                            }
                        `}
                    >
                        {title}
                    </h3>

                    {/* DESCRIPTION */}

                    <p
                        className="
                            mt-4

                            max-w-2xl

                            text-sm
                            leading-relaxed

                            text-white/72

                            line-clamp-2
                        "
                    >
                        {
                            description ||
                            "Curated luxury experiences, cinematic stays, private escapes and elite global travel discovery."
                        }
                    </p>

                    {/* FOOTER */}

                    <div
                        className="
                            mt-7

                            flex
                            items-end
                            justify-between
                            gap-4
                        "
                    >

                        {/* PRICE */}

                        <div>

                            <div
                                className="
                                    text-[10px]
                                    font-bold
                                    uppercase
                                    tracking-[0.24em]

                                    text-white/45
                                "
                            >
                                Starting From
                            </div>

                            <div
                                className="
                                    mt-1

                                    flex
                                    items-end
                                    gap-1.5
                                "
                            >

                                <span
                                    className="
                                        gold-text

                                        text-2xl
                                        md:text-3xl

                                        font-black
                                        tracking-tight
                                    "
                                >
                                    ₹{price || "4,999"}
                                </span>

                                <span
                                    className="
                                        pb-1

                                        text-xs

                                        text-white/45
                                    "
                                >
                                    / experience
                                </span>

                            </div>

                        </div>

                        {/* CTA */}

                        <div
                            className="
                                relative

                                flex
                                h-14
                                w-14

                                items-center
                                justify-center

                                rounded-full

                                gth-btn-gold

                                flex-shrink-0

                                shadow-[var(--btn-shadow)]

                                transition-all
                                duration-300

                                group-hover:scale-110
                                group-hover:rotate-6
                            "
                        >

                            <ArrowUpRight
                                size={20}
                                strokeWidth={2.8}
                            />

                        </div>

                    </div>

                </div>

            </div>

            {/* ========================= */}
            {/* BOTTOM LIGHT */}
            {/* ========================= */}

            <div
                className="
                    pointer-events-none

                    absolute
                    inset-x-0
                    bottom-0

                    h-[1px]

                    bg-gradient-to-r
                    from-transparent
                    via-[var(--gold)]
                    to-transparent

                    opacity-40
                "
            />

        </Link>
    )
}