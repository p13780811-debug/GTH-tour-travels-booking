"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import NetflixCarousel from "@/components/NetflixCarousel"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function RelatedSection({ currentSlug }: any) {

    const [items, setItems] = useState<any[]>([])

    useEffect(() => {

        async function load() {

            const { data } = await supabase
                .from("destinations")
                .select("*")
                .limit(6)

            setItems(data || [])

        }

        load()

    }, [])

    return (

        <NetflixCarousel
            title="Explore More"
            tagline="Your next luxury escape awaits"
            items={items}
            type="destination"
        />

    )

}