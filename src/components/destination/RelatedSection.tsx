"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import NetflixCarousel from "@/components/NetflixCarousel"



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