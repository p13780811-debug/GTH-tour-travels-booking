import Link from "next/link"
import { destinations } from "@/data/destinations"
import { notFound } from "next/navigation"
import BookingSection from "./BookingSection"
import { Metadata } from "next"

export async function generateStaticParams() {
    return destinations.map((d) => ({
        slug: d.slug
    }))
}

interface PageProps {
    params: {
        slug: string
    }
}


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const resolvedParams = await params; // Pehle params ko resolve karein
    const slug = resolvedParams.slug;    // Ab slug use karein

    // Aapka purana logic (Specific Cities)
    if (slug === "goa") {
        return {
            title: "Goa Travel Guide 2026 | Best Hotels & Beaches",
            description: "Explore Goa beaches, nightlife and best hotels. Compare top deals. 1% for Education 💛"
        }
    }

    if (slug === "darjeeling") {
        return {
            title: "Darjeeling Travel Guide 2026 | Hotels & Tea Gardens",
            description: "Discover Darjeeling sunrise views and scenic hotels. 1% for Education 💛"
        }
    }

    if (slug === "dubai") {
        return {
            title: "Dubai Travel Guide 2026 | Luxury Hotels & Desert Safari",
            description: "Book best Dubai hotels and explore Burj Khalifa. 1% for Education 💛"
        }
    }

    // --- YE HAI NAYA JADU (For all other cities like Digha, Paris etc.) ---
    const cityName = slug.charAt(0).toUpperCase() + slug.slice(1);

    return {
        title: `${cityName} Travel Guide 2026 | GTH PRO`,
        description: `Plan your trip to ${cityName}. 1% of proceeds support Children's Education Fund 💛`,
        alternates: {
            canonical: `https://gthpro.com/destinations/${slug}`,
        }
    }
}



export default async function DestinationPage({ params }: PageProps) {
    const { slug } = await params; // Yahan bhi await zaroori hai

    const destination = destinations.find(
        (d) => d.slug === slug
    )

    if (!destination) {
        notFound()
    }

    const schema = {
        "@context": "https://schema.org",
        "@type": "Hotel",
        name: destination.featuredHotel.name,
        address: destination.featuredHotel.location,
        priceRange: destination.featuredHotel.price
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />

            <div className="bg-[#0e0e0e] text-white min-h-screen">

                {/* HERO */}

                <div className="relative w-full h-screen">

                    <img
                        src={destination.heroImage}
                        alt={destination.name}
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    <div className="absolute inset-0 bg-black/50"></div>

                    <div className="relative z-10 flex flex-col items-center justify-center h-full pt-24 text-center px-6">

                        <h1 className="text-5xl md:text-6xl font-bold text-yellow-400 mb-6 drop-shadow-lg">
                            {destination.name}
                        </h1>

                        <p className="text-gray-300 max-w-2xl mb-8">
                            {destination.description}
                        </p>

                        <a
                            href={`/go/${destination.slug}`}
                            target="_blank"
                            rel="nofollow sponsored"
                            className="bg-yellow-500 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition"
                        >
                            View Deals →
                        </a>

                    </div>

                </div>


                {/* BOOKING */}

                <BookingSection partner_link={`/go/${destination.slug}`} />


                {slug === "digha" && (
                    <section className="max-w-4xl mx-auto px-6 py-16 text-gray-300 space-y-8">

                        <h2 className="text-3xl font-bold text-yellow-400">
                            Digha – The Seaside Escape of West Bengal
                        </h2>

                        <p>
                            Digha is the most popular beach destination in West Bengal, located around 185 km from Kolkata.
                            Known for its long coastline, affordable hotels, and fresh seafood, Digha attracts families,
                            couples, and weekend travelers throughout the year.
                        </p>

                        <p>
                            The town is divided into Old Digha and New Digha. Old Digha offers dramatic sunset views
                            and a traditional seaside promenade, while New Digha provides wider beaches and modern accommodations.
                        </p>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Best Time to Visit
                        </h3>

                        <p>
                            October to March is the best time to visit Digha with pleasant weather and ideal beach conditions.
                            Monsoon offers scenic beauty but swimming may be restricted due to strong waves.
                        </p>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Top Beaches in Digha
                        </h3>

                        <ul className="list-disc ml-6 space-y-2">
                            <li><strong>Old Digha Beach</strong> – Famous for sunset views and evening promenade walks.</li>
                            <li><strong>New Digha Beach</strong> – Cleaner, wider, and family-friendly.</li>
                            <li><strong>Udaipur Beach</strong> – Peaceful beach near the Odisha border.</li>
                        </ul>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Top Things To Do
                        </h3>

                        <ul className="list-disc ml-6 space-y-2">
                            <li>Enjoy sunrise beach walks.</li>
                            <li>Try fresh seafood at local restaurants.</li>
                            <li>Visit Marine Aquarium & Research Centre.</li>
                            <li>Take a short trip to Mandarmani.</li>
                        </ul>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Where to Stay
                        </h3>

                        <p>
                            Digha offers sea-facing resorts, mid-range hotels, and budget-friendly guesthouses.
                            New Digha is ideal for modern comfort while Old Digha suits budget travelers.
                        </p>

                        <div className="pt-6">
                            <a
                                href="#"
                                className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition"
                            >
                                Check Best Deals in Digha
                            </a>
                            <p className="text-sm text-gray-400 mt-3">
                                ✔ Free cancellation on most stays
                                ✔ Instant confirmation
                                ✔ Secure booking
                            </p>
                        </div>

                    </section>
                )}

                {slug === "manali" && (
                    <section className="max-w-4xl mx-auto px-6 py-16 text-gray-300 space-y-8">

                        <h2 className="text-3xl font-bold text-yellow-400">
                            Manali – Where Mountains Whisper and Rivers Roar
                        </h2>

                        <p>
                            The first breath you take in Manali feels different. Crisp mountain air,
                            snow-dusted peaks in the distance, and the sound of the Beas River flowing
                            beside you — it doesn’t feel like a destination, it feels like an escape.
                        </p>

                        <p>
                            Nestled in the Himalayas of Himachal Pradesh, Manali is more than just a hill station.
                            It is where adventure meets romance, where backpackers share stories by bonfires,
                            and where honeymoon couples wake up to mist-covered valleys.
                        </p>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Best Time to Visit
                        </h3>

                        <p>
                            Visit between October and February for snowfall magic.
                            March to June offers pleasant weather perfect for sightseeing and adventure sports.
                        </p>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Experiences You Shouldn’t Miss
                        </h3>

                        <ul className="list-disc ml-6 space-y-2">
                            <li>Snow adventures at Solang Valley</li>
                            <li>Rohtang Pass scenic drive</li>
                            <li>Old Manali café culture</li>
                            <li>Riverside camping near Kasol</li>
                        </ul>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Where to Stay
                        </h3>

                        <p>
                            From luxury mountain-view resorts to cozy wooden cottages and budget backpacker hostels,
                            Manali has stays for every traveler.
                        </p>

                        <div className="pt-6">
                            <a
                                href="#"
                                className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition"
                            >
                                Check Best Deals in Manali
                            </a>
                            <p className="text-sm text-gray-400 mt-3">
                                ✔ Free cancellation on most stays
                                ✔ Instant confirmation
                                ✔ Secure booking
                            </p>
                        </div>

                    </section>
                )}

                {slug === "jaipur" && (
                    <section className="max-w-4xl mx-auto px-6 py-16 text-gray-300 space-y-8">

                        <h2 className="text-3xl font-bold text-yellow-400">
                            Jaipur – The Royal Heart of Rajasthan
                        </h2>

                        <p>
                            As the sun sets behind sandstone walls, Jaipur glows in shades of pink and gold.
                            Known as the Pink City, Jaipur is not just a destination — it is a royal experience.
                        </p>

                        <p>
                            Grand forts standing on hilltops, bustling bazaars filled with handcrafted jewelry,
                            and palaces that whisper stories of Maharajas — Jaipur blends history with vibrant culture.
                        </p>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Must-Visit Landmarks
                        </h3>

                        <ul className="list-disc ml-6 space-y-2">
                            <li>Amber Fort sunrise views</li>
                            <li>Hawa Mahal architecture</li>
                            <li>City Palace royal heritage</li>
                            <li>Johari Bazaar shopping</li>
                        </ul>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Best Time to Visit
                        </h3>

                        <p>
                            October to March offers pleasant weather ideal for sightseeing.
                            Winters are especially magical for heritage walks.
                        </p>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Where to Stay
                        </h3>

                        <p>
                            Choose from royal heritage hotels, boutique havelis, or modern luxury resorts.
                            Jaipur offers accommodations that match every travel style.
                        </p>

                        <div className="pt-6">
                            <a
                                href="#"
                                className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition"
                            >
                                Check Best Deals in Jaipur
                            </a>
                            <p className="text-sm text-gray-400 mt-3">
                                ✔ Free cancellation on most stays
                                ✔ Instant confirmation
                                ✔ Secure booking
                            </p>
                        </div>

                    </section>
                )}

                {slug === "goa" && (
                    <section className="max-w-4xl mx-auto px-6 py-16 text-gray-300 space-y-8">

                        <h2 className="text-3xl font-bold text-yellow-400">
                            Goa – Where Every Sunset Feels Like Freedom
                        </h2>

                        <p>
                            Goa isn’t just a beach destination — it’s a mood.
                            Golden sunsets, palm-lined shores, beach shacks playing soft music,
                            and the smell of the ocean in the air — Goa invites you to slow down and breathe.
                        </p>

                        <p>
                            Whether you’re chasing nightlife in Baga, peaceful sunsets in South Goa,
                            or Portuguese heritage in Old Goa, every corner offers a different rhythm.
                        </p>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Best Time to Visit
                        </h3>

                        <p>
                            November to February offers perfect beach weather.
                            Monsoon (June–September) turns Goa lush and romantic,
                            ideal for peaceful stays and discounted resorts.
                        </p>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Top Experiences in Goa
                        </h3>

                        <ul className="list-disc ml-6 space-y-2">
                            <li>Calangute & Baga beach nightlife</li>
                            <li>Dudhsagar Waterfalls adventure</li>
                            <li>Sunset cruise on Mandovi River</li>
                            <li>Fort Aguada coastal views</li>
                        </ul>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Where to Stay
                        </h3>

                        <p>
                            Choose from luxury beach resorts, boutique villas,
                            or budget-friendly hostels. North Goa is lively,
                            while South Goa is peaceful and premium.
                        </p>

                        <div className="pt-6">
                            <a href="#" className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition">
                                Check Best Deals in Goa
                            </a>
                            <p className="text-sm text-gray-400 mt-3">
                                ✔ Free cancellation on most stays
                                ✔ Instant confirmation
                                ✔ Secure booking
                            </p>
                        </div>

                    </section>
                )}

                {slug === "darjeeling" && (
                    <section className="max-w-4xl mx-auto px-6 py-16 text-gray-300 space-y-8">

                        <h2 className="text-3xl font-bold text-yellow-400">
                            Darjeeling – Where the Himalayas Touch the Sky
                        </h2>

                        <p>
                            Wake up before sunrise in Darjeeling and you’ll witness
                            Kangchenjunga glowing golden under the first light of day.
                            Mist rolling over tea gardens, toy trains winding through hills,
                            and the scent of fresh Darjeeling tea — this is mountain magic.
                        </p>

                        <p>
                            Darjeeling blends colonial charm with Himalayan beauty,
                            making it one of India’s most romantic hill stations.
                        </p>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Must-Visit Attractions
                        </h3>

                        <ul className="list-disc ml-6 space-y-2">
                            <li>Tiger Hill sunrise viewpoint</li>
                            <li>Darjeeling Himalayan Railway</li>
                            <li>Batasia Loop</li>
                            <li>Peace Pagoda</li>
                        </ul>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Best Time to Visit
                        </h3>

                        <p>
                            March to May and October to December offer clear mountain views
                            and pleasant weather.
                        </p>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Where to Stay
                        </h3>

                        <p>
                            From heritage tea-estate stays to cozy hillside hotels,
                            Darjeeling offers scenic accommodations for every budget.
                        </p>

                        <div className="pt-6">
                            <a href="#" className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition">
                                Check Best Deals in Darjeeling
                            </a>
                            <p className="text-sm text-gray-400 mt-3">
                                ✔ Free cancellation on most stays
                                ✔ Instant confirmation
                                ✔ Secure booking
                            </p>
                        </div>

                    </section>
                )}

                {slug === "dubai" && (
                    <section className="max-w-4xl mx-auto px-6 py-16 text-gray-300 space-y-8">

                        <h2 className="text-3xl font-bold text-yellow-400">
                            Dubai – Where Luxury Meets the Desert Sky
                        </h2>

                        <p>
                            Dubai feels futuristic the moment you arrive.
                            Skyscrapers touching the clouds, luxury cars cruising highways,
                            and golden deserts stretching endlessly beyond the city skyline.
                        </p>

                        <p>
                            But beyond the glamour lies a city of contrasts —
                            traditional souks, desert safaris, beachfront resorts,
                            and world-class shopping experiences.
                        </p>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Iconic Experiences
                        </h3>

                        <ul className="list-disc ml-6 space-y-2">
                            <li>Burj Khalifa observation deck</li>
                            <li>Desert safari with dune bashing</li>
                            <li>Dubai Marina cruise</li>
                            <li>Global Village & luxury malls</li>
                        </ul>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Best Time to Visit
                        </h3>

                        <p>
                            November to March offers pleasant temperatures
                            perfect for sightseeing and desert activities.
                        </p>

                        <h3 className="text-2xl font-semibold text-yellow-400">
                            Where to Stay
                        </h3>

                        <p>
                            Dubai offers everything from ultra-luxury beachfront resorts
                            to budget-friendly city hotels.
                            Downtown for skyline views, Marina for nightlife,
                            and Palm Jumeirah for premium stays.
                        </p>

                        <div className="pt-6">
                            <a href="#" className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition">
                                Check Best Deals in Dubai
                            </a>
                            <p className="text-sm text-gray-400 mt-3">
                                ✔ Free cancellation on most stays
                                ✔ Instant confirmation
                                ✔ Secure booking
                            </p>
                        </div>

                    </section>
                )}

                <section className="max-w-7xl mx-auto px-6 py-16">

                    <h2 className="text-3xl font-bold text-white mb-10">
                        Featured Hotels
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

                        {[1, 2, 3, 4].map((hotel) => (

                            <div
                                key={hotel}
                                className="relative group rounded-xl overflow-hidden shadow-lg"
                            >

                                <img
                                    src={`https://source.unsplash.com/800x600/?${destination.slug},hotel`}
                                    alt="Hotel"
                                    className="w-full h-40 object-cover group-hover:scale-110 transition duration-500"
                                />

                                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/70 transition"></div>

                                <div className="absolute bottom-4 left-4 right-4">

                                    <h3 className="text-white text-sm font-semibold">
                                        Luxury Stay
                                    </h3>

                                    <p className="text-yellow-400 text-xs mb-2">
                                        Starting ₹4,999
                                    </p>

                                    <a
                                        href={`/go/${destination.slug}`}
                                        className="bg-yellow-500 text-black px-3 py-1 text-xs rounded-md font-semibold"
                                    >
                                        View →
                                    </a>

                                </div>

                            </div>

                        ))}

                    </div>
                </section>


                <section className="max-w-6xl mx-auto px-6 py-20">
                    <h2 className="text-3xl font-bold text-white mb-10">
                        Top Activities
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {[
                            { title: "Adventure Experience", price: "2,999" },
                            { title: "Guided City Tour", price: "1,499" },
                            { title: "Premium Sunset Cruise", price: "3,499" },
                        ].map((activity, index) => (

                            <div
                                key={index}
                                className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg hover:scale-105 transition"
                            >
                                <h3 className="text-xl font-semibold text-yellow-400 mb-3">
                                    {activity.title}
                                </h3>

                                <p className="text-gray-400 mb-4">
                                    Starting from ₹{activity.price}
                                </p>

                                <a
                                    href={`/go/${destination.slug}`}
                                    className="bg-yellow-500 text-black px-4 py-2 rounded-md text-sm font-semibold hover:bg-yellow-400 transition"
                                >
                                    Book Activity
                                </a>

                            </div>

                        ))}

                    </div>
                </section>

                <section className="w-full px-6 py-20 bg-[#0e0e0e]">

                    <h2 className="text-4xl font-bold text-center text-white mb-14 tracking-wide">
                        Explore Premium Destinations
                    </h2>

                    <div className="flex flex-wrap justify-center gap-6">

                        {[
                            { name: "Goa", slug: "goa", price: "4,999" },
                            { name: "Darjeeling", slug: "darjeeling", price: "3,499" },
                            { name: "Dubai", slug: "dubai", price: "24,999" },
                            { name: "Manali", slug: "manali", price: "5,499" },
                            { name: "Jaipur", slug: "jaipur", price: "3,999" },
                            { name: "Digha", slug: "digha", price: "2,499" },
                        ].map((place) => (

                            <div
                                key={place.slug}
                                className="relative w-[220px] h-[280px] rounded-xl overflow-hidden group shadow-xl"
                            >

                                {/* IMAGE */}
                                <img
                                    src={destination.heroImage}
                                    alt={destination.name}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />

                                {/* DARK OVERLAY */}
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition duration-500"></div>

                                {/* TOP PLACE NAME */}
                                <div className="absolute top-3 left-3 text-white text-lg font-semibold tracking-wide">
                                    {place.name}
                                </div>

                                {/* BOTTOM PRICE + BUTTON */}
                                <div className="absolute bottom-4 left-0 w-full px-4 flex items-center justify-between">

                                    <div className="text-white text-sm">
                                        <span className="text-gray-300">Starting from</span>
                                        <div className="text-yellow-400 font-bold text-base">
                                            ₹{place.price}
                                        </div>
                                    </div>

                                    <a
                                        href={`/destinations/${place.slug}`}
                                        className="bg-yellow-500 text-black text-xs px-3 py-2 rounded-md font-semibold hover:bg-yellow-400 transition whitespace-nowrap"
                                    >
                                        View →
                                    </a>

                                </div>

                            </div>

                        ))}

                    </div>

                </section>



                {/* FEATURED HOTEL */}
                <section className="max-w-6xl mx-auto px-6 py-20">
                    <h2 className="text-3xl font-bold text-yellow-400 mb-10">
                        Featured Stay
                    </h2>

                    <div className="bg-[#1a1a1a] border border-yellow-500/20 p-8 rounded-3xl">
                        <h3 className="text-2xl font-semibold mb-2">
                            {destination.featuredHotel.name}
                        </h3>

                        <p className="text-gray-400 mb-3">
                            {destination.featuredHotel.location}
                        </p>

                        <p className="text-yellow-400 text-lg font-semibold mb-6">
                            {destination.featuredHotel.price}
                        </p>

                        <a
                            href={`https://wa.me/${destination.featuredHotel.whatsapp}`}
                            target="_blank"
                            className="inline-block px-6 py-3 bg-yellow-500 text-black font-semibold rounded-xl hover:bg-yellow-400 transition"
                        >
                            Book on WhatsApp
                        </a>
                    </div>
                </section>

                {/* OTHER HOTELS */}
                <section className="max-w-6xl mx-auto px-6 pb-20">
                    <h2 className="text-3xl font-bold text-yellow-400 mb-10">
                        Other Hotels
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {destination.hotels.map((hotel, index) => (
                            <div
                                key={index}
                                className="bg-[#1a1a1a] border border-yellow-500/10 p-6 rounded-2xl"
                            >
                                <h3 className="text-lg font-semibold mb-2">
                                    {hotel.name}
                                </h3>
                                <p className="text-yellow-400 font-medium">
                                    {hotel.price}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* GUIDES */}
                <section className="max-w-6xl mx-auto px-6 pb-24">
                    <h2 className="text-3xl font-bold text-yellow-400 mb-10">
                        Local Guides
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {destination.guides.map((guide, index) => (
                            <div
                                key={index}
                                className="bg-[#151515] p-6 rounded-2xl border border-yellow-500/10"
                            >
                                <h3 className="text-lg font-semibold mb-2">
                                    {guide.name}
                                </h3>
                                <p className="text-gray-400">
                                    {guide.experience}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>


                <section className="max-w-6xl mx-auto px-6 pb-24">

                    <h2 className="text-3xl font-bold text-yellow-400 mb-10">
                        Explore More Destinations
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

                        {destinations.slice(0, 12).map((place) => (

                            <a
                                key={place.slug}
                                href={`/destinations/${place.slug}`}
                                className="bg-[#1a1a1a] p-6 rounded-xl border border-yellow-500/10 hover:border-yellow-400 transition"
                            >

                                <h3 className="text-lg font-semibold text-white mb-2">
                                    {place.name}
                                </h3>

                                <p className="text-gray-400 text-sm">
                                    Explore hotels and travel deals
                                </p>

                            </a>

                        ))}

                    </div>

                </section>
                <div className="mt-16 grid md:grid-cols-3 gap-6">
                    {destinations.slice(0, 6).map((d) => (
                        <Link
                            key={d.slug}
                            href={`/destinations/${d.slug}`}
                            className="bg-[#1a1a1a] p-6 rounded-xl hover:border-yellow-500 border border-gray-700"
                        >
                            <h3 className="text-yellow-400">{d.name}</h3>
                            <p className="text-sm text-gray-400 mt-2">
                                Explore hotels and travel deals in {d.name}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </>
    )
}