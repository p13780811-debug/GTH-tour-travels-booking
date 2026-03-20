import { blogs } from "@/data/blogs"
import { destinations as staticDestinations } from "@/data/destinations"
import { createClient } from "@supabase/supabase-js"

import HeroSection from "@/components/destination/HeroSection"
import ContentSection from "@/components/destination/ContentSection"
import HotelSection from "@/components/destination/HotelSection"
import ActivitySection from "@/components/destination/ActivitySection"
import BlogSection from "@/components/destination/BlogSection"
import RelatedSection from "@/components/destination/RelatedSection"
import FlightSection from "@/components/destination/FlightSection"

import FeaturedDestinationsSlider from "@/components/home/FeaturedDestinationsSlider"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {

  const { slug } = await params

  // slug → city
  const city = slug.split("-")[0].toLowerCase()

  // fetch destination
  const { data: destinationData } = await supabase
    .from("destinations")
    .select("*")
    .ilike("name", city)
    .maybeSingle()

  // fetch hotels
  const { data: hotels } = await supabase
    .from("hotels")
    .select("*")
    .ilike("city", city)

  // fetch cities for slider
  const { data: cities } = await supabase
    .from("destinations")
    .select("name, slug, image_url")
    .order("name")
    .limit(10)

  // fallback static data
  const fallback: any = staticDestinations.find(
    (d: any) => d.slug === slug
  )



  const destination: any = {
    slug,

    name:
      destinationData?.name ||
      fallback?.name ||
      city.charAt(0).toUpperCase() + city.slice(1),

    description:
      destinationData?.description ||
      fallback?.description ||
      "",

    heroImage:
      destinationData?.image_url ||
      fallback?.heroImage ||
      "/images/default-city.jpg",

    partnerLink:
      destinationData?.partner_link || null,

    hotels: hotels || [],

    activities:
      fallback?.activities || []
  }

  const citiesToShow = cities || []

  return (
    <div className="bg-black text-white">

      <HeroSection destination={destination} />

      <FlightSection destination={destination} />



      <ContentSection destination={destination} />

      <HotelSection destination={destination} />

      <ActivitySection destination={destination} />

      <BlogSection blogs={blogs} />

      <FeaturedDestinationsSlider cities={citiesToShow} />

      <RelatedSection currentSlug={destination.slug} />

    </div>
  )
}