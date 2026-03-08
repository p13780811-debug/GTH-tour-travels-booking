import { destinations } from "@/data/destinations"
import { blogs } from "@/data/blogs"
import { notFound } from "next/navigation"

import HeroSection from "@/components/destination/HeroSection"
import ContentSection from "@/components/destination/ContentSection"
import HotelSection from "@/components/destination/HotelSection"
import ActivitySection from "@/components/destination/ActivitySection"
import BlogSection from "@/components/destination/BlogSection"
import RelatedSection from "@/components/destination/RelatedSection"

export default async function DestinationPage({ params }: any) {
    // Params ko await kiya taaki slug mil sake
    const { slug } = await params;

    const destination = destinations.find(d => d.slug === slug);

    if (!destination) return notFound();

    return (
        <div className="bg-black text-white">

            <HeroSection destination={destination} />

            <ContentSection destination={destination} />

            <HotelSection destination={destination} />

            <ActivitySection destination={destination} />

            <BlogSection blogs={blogs} />

            <RelatedSection currentSlug={destination.slug} />

        </div>
    )
}