"use client"

import { useSearchParams } from "next/navigation"
import { destinations } from "@/data/destinations"
import Link from "next/link"
import { hotels } from "@/data/hotels"
import { useState } from "react"
export default function SearchPage() {

    const params = useSearchParams()
    const q = params.get("q")?.toLowerCase() || ""

    const results = destinations.filter((d) =>
        d.name.toLowerCase().includes(q)
    )

    return (

        <div className="max-w-6xl mx-auto px-6 py-20">

            <h1 className="text-3xl font-bold text-yellow-400 mb-10">
                Search results for "{q}"
            </h1>

            <div className="grid md:grid-cols-3 gap-8">

                {results.map((d) => (
                    <Link
                        key={d.slug}
                        href={`/destinations/${d.slug}`}
                        className="block border border-yellow-500/20 rounded-xl overflow-hidden"
                    >

                        <img
                            src={d.heroImage}
                            className="h-48 w-full object-cover"
                        />

                        <div className="p-4">
                            <h2 className="text-yellow-400 font-semibold">
                                {d.name}
                            </h2>
                        </div>

                    </Link>
                ))}

            </div>

        </div>

    )

}

