import Image from "next/image"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { Star, MapPin, ArrowUpRight } from 'lucide-react'
import { blogs } from "@/data/blogs"
import HeroSlider from "@/components/HeroSlider"
import { hotels } from "@/data/hotels"
import TripPlanner from "@/components/TripPlanner"
import { partnerHotels } from "@/data/hotels"
import FlightSearch from "@/components/FlightSearch"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
const myFreePhotos = [
  "photo-1625244724120-1fd1d34d00f6", // ID 1
  "photo-1651147572891-a37a866c557c", // ID 2
  "photo-1611892440504-42a792e24d32"  // ID 3
];

const activities = [
  { id: 1, title: 'Private Yacht Cruise', price: '$1,200', rating: '5.0', image: '/yacht.jpg' },
  { id: 2, title: 'Desert Safari Gold', price: '$450', rating: '4.9', image: '/safari.jpg' },
];

export default async function HomePage() {

  const { data: destinations } = await supabase
    .from("destinations")
    .select("*")
    .eq("is_active", true)

  return (
    <div>

      <div className="relative">
        <HeroSlider />
      </div>


      {/* --- SIGNATURE EXPERIENCE: Digha Special --- */}
      <section className="py-24 bg-[#050505] border-y border-[#d4af37]/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">

            {/* 1. Left Side: Bus Video + Hotel Gallery (Visual Core) */}
            <div className="w-full md:w-1/2 space-y-4">
              <div className="relative group cursor-pointer rounded-2xl overflow-hidden border border-[#1a1a1a] aspect-video">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#d4af37] to-[#8a6d3b] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <img
                  src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1200"
                  alt="Digha Video Experience"
                  className="relative w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 bg-[#d4af37] rounded-full flex items-center justify-center shadow-[0_0_20px_#d4af37]">
                    <svg className="w-6 h-6 text-black fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { img: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39', label: 'Royal Suite' },
                  { img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d', label: 'Ocean Pool' },
                  { img: 'https://images.unsplash.com/photo-1544148103-0773bf10d330', label: 'Fine Dine' }
                ].map((item, i) => (
                  <div key={i} className="h-20 rounded-xl overflow-hidden border border-white/5 relative group shadow-2xl">
                    <img src={`${item.img}?w=400`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={item.label} />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[7px] text-center py-1 uppercase font-bold text-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Right Side: Balanced English Typography */}
            <div className="w-full md:w-1/2 space-y-5">
              <span className="text-[#d4af37] font-bold tracking-[0.5em] text-[8px] uppercase border-b border-[#d4af37]/30 pb-1">
                Partner Spotlight
              </span>

              {/* Scaled Down Heading to match Left Side height */}
              <h2 className="text-2xl md:text-4xl font-black gold-text leading-tight tracking-tighter uppercase">
                DIGHA ELITE: <br />
                <span className="font-light italic text-white/90">CINEMATIC LEGACY</span>
              </h2>

              <p className="text-gray-400 text-xs md:text-sm font-light leading-relaxed max-w-sm">
                Step beyond traditional travel. Our local partners offer West Bengal’s first
                <span className="text-white font-medium italic"> "Cinematic Expedition"</span>,
                transforming your journey into a high-definition documentary film.
              </p>

              <div className="bg-[#111] p-4 rounded-xl border-l-2 border-[#d4af37] space-y-1 max-w-sm">
                <p className="text-[#d4af37] text-[9px] font-black uppercase tracking-widest">Rare Advantage</p>
                <p className="text-[11px] text-gray-400 font-light italic leading-snug">
                  "Every guest receives a 4K Documentary of their journey and exclusive access to a private beachfront reserved for GTH members."
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href="/destinations/digha"
                  className="gold-gradient text-black px-7 py-3 rounded-full font-black uppercase tracking-tighter hover:scale-105 transition-all text-[10px]"
                >
                  Explore More →
                </Link>
                <Link
                  href="https://wa.me/YOUR_FRIEND_NUMBER"
                  className="border border-white/10 text-white/50 px-7 py-3 rounded-full font-black uppercase tracking-tighter hover:bg-white/5 transition-all text-[10px]"
                >
                  Inquire Now
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Flights Search */}
      <section className="py-20 bg-black">

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-10">

          <div className="bg-[#111] p-6 rounded-xl border border-yellow-500/20 h-fit">

            <h3 className="text-xl text-yellow-400 font-semibold mb-4">
              Flight Filters
            </h3>

            <div className="space-y-4 text-sm text-gray-400">

              <label className="block">
                <input type="checkbox" className="mr-2" />
                Direct Flights
              </label>

              <label className="block">
                <input type="checkbox" className="mr-2" />
                1 Stop
              </label>

              <label className="block">
                <input type="checkbox" className="mr-2" />
                Morning Departure
              </label>

              <label className="block">
                <input type="checkbox" className="mr-2" />
                Evening Departure
              </label>

            </div>

          </div>

          <div className="md:col-span-3">

            <h2 className="text-3xl font-bold text-yellow-400 mb-8">
              Search Flights
            </h2>

            <FlightSearch />

          </div>

        </div>

      </section>


      <section className="py-20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-yellow-500 mb-10 tracking-tight">
            Featured Luxury Hotels
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hotels.slice(0, 3).map((hotel, index) => (
              <Link
                key={hotel.slug}
                href={`/hotels/${hotel.slug}`}
                className="group relative h-[380px] w-full rounded-3xl overflow-hidden border border-yellow-500/10 bg-[#050505] transition-all duration-500 hover:scale-[1.01] hover:border-yellow-500/30"
              >
                {/* 1. Background Image */}
                <img
                  src={`https://images.unsplash.com/${myFreePhotos[index % 3]}?auto=format&fit=crop&w=800&q=80`}
                  alt={hotel.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-60 group-hover:opacity-75"
                />

                {/* 2. Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />

                {/* 3. Top Content */}
                <div className="absolute top-0 left-0 right-0 p-5 z-20">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-yellow-500 tracking-tight">
                      {hotel.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-yellow-500/10 backdrop-blur-md px-2 py-1 rounded-lg border border-yellow-500/20">
                      <Star size={10} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-[9px] text-yellow-500 font-bold">5.0</span>
                    </div>
                  </div>
                </div>

                {/* 4. Bottom Content (Glass Panel removed for space, now direct on Gradient) */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10 translate-y-2 group-hover:translate-y-0 transition-all duration-500">

                  <p className="text-gray-300 text-[10.5px] leading-snug italic line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    Premium {hotel.location} luxury with world-class amenities and views.
                  </p>

                  <div className="flex justify-between items-end border-t border-yellow-500/10 pt-3">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-yellow-500/50 uppercase tracking-widest font-bold">From</span>
                      <span className="text-xl font-light text-yellow-500 italic">
                        {hotel.price}<span className="text-[9px] text-gray-500 not-italic ml-1">/avg</span>
                      </span>
                    </div>

                    {/* Compact Button */}
                    <div className="bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full group-hover:bg-white transition-all">
                      Book Now
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* Destinations from Supabase */}

      <section id="destinations" className="py-24 bg-[#111111]">

        <div className="max-w-7xl mx-auto px-6">

          <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-16">
            Explore Global Destinations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">

            {destinations?.slice(0, 8).map((destination) => (

              <Link
                key={destination.id}
                href={`/destinations/${destination.name.toLowerCase()}`}
                className="group relative overflow-hidden rounded-2xl border border-yellow-500/20 hover:border-yellow-500 transition"
              >

                <img
                  src={destination.image_url}
                  alt={destination.name}
                  className="h-80 w-full object-cover group-hover:scale-110 transition duration-700"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6">

                  <h3 className="text-xl font-semibold text-yellow-400">
                    {destination.name}
                  </h3>

                  <p className="text-gray-300 text-sm mt-2 line-clamp-2">
                    {destination.description}
                  </p>

                </div>

              </Link>

            ))}

          </div>

        </div>

      </section>


      <section className="py-24 bg-black border-t border-yellow-500/10">
        <div className="max-w-7xl mx-auto px-6">

          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-yellow-500 tracking-tighter">
                Travel Guides & Tips
              </h2>
              <div className="h-1 w-20 bg-yellow-500 mt-4 rounded-full" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {blogs.slice(0, 3).map((blog, index) => {
              // FIXED IMAGES: Aapki IDs ko sahi format mein daal diya hai
              const imageIds = [
                "1605649724115-4d72456ad936", // Manali (approx)
                "1599427303058-f173243f5553", // Jaipur (approx)
                "1510414842564-598c451152ad"  // Goa (approx)
              ];

              const currentPhotoId = imageIds[index % imageIds.length];

              return (
                <Link
                  key={blog.slug}
                  href={`/blog/${blog.slug}`}
                  className="group relative h-[400px] w-full rounded-[32px] overflow-hidden border border-white/5 bg-[#0a0a0a] transition-all duration-500 hover:scale-[1.02] hover:border-yellow-500/30 shadow-2xl"
                >
                  {/* 1. FIXED IMAGE LINK (Ab 100% show karega) */}
                  <img
                    src={`https://images.unsplash.com/photo-${currentPhotoId}?auto=format&fit=crop&w=800&q=80`}
                    alt={blog.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-80"
                  />

                  {/* 2. Premium Dark Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-[#050505]" />

                  {/* 3. TOP LEFT CONTENT: Title & Tag */}
                  <div className="absolute top-0 left-0 p-8 z-20 w-full text-left">
                    <span className="inline-block bg-yellow-500/10 backdrop-blur-md border border-yellow-500/20 text-yellow-500 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full mb-4">
                      Luxury Guide
                    </span>
                    <h3 className="text-xl font-bold text-white leading-tight group-hover:text-yellow-500 transition-colors duration-300 drop-shadow-lg">
                      {blog.title}
                    </h3>
                  </div>

                  {/* 4. BOTTOM CONTENT: Glassmorphism Panel (Hover Only) */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 z-10 translate-y-6 group-hover:translate-y-0 transition-all duration-500">
                    <div className="relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-0 group-hover:backdrop-blur-xl transition-all duration-700 opacity-0 group-hover:opacity-100 shadow-2xl">
                      <p className="text-gray-300 text-[11px] leading-relaxed italic line-clamp-2">
                        {blog.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-yellow-500 text-[10px] font-bold uppercase tracking-widest">
                        Read Story <span className="text-lg">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#0a0a0a] py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-[#d4af37] mb-2 tracking-tighter uppercase">
            Elite Experiences
          </h2>
          <p className="text-gray-400 mb-12">Handpicked by GTH Pro Automation</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {activities.map((item) => (
              <div key={item.id} className="group relative overflow-hidden rounded-xl border border-[#222] hover:border-[#d4af37] transition-all duration-500">
                <div className="h-64 bg-gray-800 relative">
                  {/* Image Placeholder - Yahan hum cinematic video bhi daal sakte hain */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10" />
                </div>
                <div className="p-6 bg-black relative z-20">
                  <span className="text-[#d4af37] text-xs font-bold uppercase tracking-widest">Premium Tour</span>
                  <h3 className="text-xl text-white mt-2 font-semibold group-hover:text-[#d4af37] transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-2xl text-white font-light">{item.price}</span>
                    <button className="bg-[#d4af37] text-black px-4 py-2 rounded-full font-bold text-sm hover:bg-white transition-all">
                      BOOK NOW
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}