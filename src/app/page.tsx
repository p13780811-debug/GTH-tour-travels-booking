import { blogs } from "@/data/blogs"
import Link from "next/link"
import HeroSlider from "@/components/HeroSlider"
import { hotels } from "@/data/hotels"
import { destinations } from "@/data/destinations"


export default function HomePage() {
  return (
    <div>

      <HeroSlider />

      <section className="py-24 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-6">

          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-yellow-400">
              Featured Luxury Hotels
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {hotels.map((hotel) => (
              <Link
                key={hotel.id}
                href={`/hotels/${hotel.id}`}
                className="group block bg-[#1a1a1a] rounded-2xl overflow-hidden border border-yellow-500/20 hover:border-yellow-400 transition duration-300 hover:scale-[1.02]"
              >
                <div className="overflow-hidden">
                  <img
                    src={hotel.images[0]}
                    alt={hotel.name}
                    className="h-72 w-full object-cover group-hover:scale-110 transition duration-700"
                  />
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {hotel.name}
                  </h3>

                  <p className="text-gray-400 text-sm mb-4">
                    {hotel.location}
                  </p>

                  <div className="flex justify-between items-center">
                    <span className="text-yellow-500 font-semibold">
                      {hotel.price}
                    </span>

                    <span className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black rounded-lg text-sm font-semibold">
                      View
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>


      <section className="relative py-24 bg-gradient-to-b from-black via-neutral-950 to-black overflow-hidden">

        {/* Soft Gold Glow Background */}
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
          <div className="w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[150px]"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-6 text-center">

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-wide">
            Where Technology Meets
            <span className="block text-yellow-400 mt-2">
              Timeless Luxury
            </span>
          </h2>

          <p className="text-gray-400 max-w-2xl mx-auto mb-14">
            An international travel infrastructure designed for modern explorers,
            premium hospitality brands and global expansion.
          </p>

          {/* 3 Feature Cards */}
          <div className="grid md:grid-cols-3 gap-10">

            <div className="bg-black/60 border border-yellow-500/20 p-8 rounded-2xl backdrop-blur-md hover:border-yellow-400 transition">
              <h3 className="text-xl font-semibold text-yellow-400 mb-3">
                Elite Hotels
              </h3>
              <p className="text-gray-400 text-sm">
                Curated premium properties across emerging global destinations.
              </p>
            </div>

            <div className="bg-black/60 border border-yellow-500/20 p-8 rounded-2xl backdrop-blur-md hover:border-yellow-400 transition">
              <h3 className="text-xl font-semibold text-yellow-400 mb-3">
                Verified Local Guides
              </h3>
              <p className="text-gray-400 text-sm">
                Trusted professionals delivering authentic experiences.
              </p>
            </div>

            <div className="bg-black/60 border border-yellow-500/20 p-8 rounded-2xl backdrop-blur-md hover:border-yellow-400 transition">
              <h3 className="text-xl font-semibold text-yellow-400 mb-3">
                Seamless Booking
              </h3>
              <p className="text-gray-400 text-sm">
                Direct connection. Zero middle layers. Maximum control.
              </p>
            </div>

          </div>

        </div>
      </section>



      <section id="destinations" className="py-24 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-6">

          <div className="flex justify-between items-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-yellow-400">
              Explore Global Destinations
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {destinations.slice(0, 8).map((destination) => (
              <Link
                key={destination.slug}
                href={`/destinations/${destination.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-yellow-500/20 hover:border-yellow-500 transition"
              >
                <img
                  src={destination.heroImage}
                  alt={destination.name}
                  className="h-80 w-full object-cover group-hover:scale-110 transition duration-700"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6">
                  <h3 className="text-xl font-semibold text-yellow-400">
                    {destination.name}
                  </h3>

                  <p className="text-gray-300 text-sm mt-2 line-clamp-2">
                    {destination.description}
                  </p>

                  <span className="mt-4 inline-block text-sm text-yellow-500 font-semibold">
                    View Destination →
                  </span>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>

      <section className="py-24 bg-black border-t border-yellow-500/10">
        <div className="max-w-7xl mx-auto px-6">

          <div className="flex justify-between items-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-yellow-400">
              Travel Guides & Tips
            </h2>

            <Link
              href="/blog"
              className="text-yellow-400 hover:text-yellow-300 text-sm"
            >
              View All →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">

            {blogs.slice(0, 3).map((blog) => (
              <Link
                key={blog.slug}
                href={`/blog/${blog.slug}`}
                className="group bg-[#1a1a1a] rounded-xl overflow-hidden"
              >

                <img
                  src={blog.image}
                  alt={blog.title}
                  className="h-56 w-full object-cover group-hover:scale-110 transition duration-700"
                />

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                    {blog.title}
                  </h3>

                  <p className="text-gray-400 text-sm line-clamp-2">
                    {blog.description}
                  </p>
                </div>

              </Link>
            ))}

          </div>

        </div>
      </section>

      <section className="bg-[#111] py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 text-center gap-10 px-6">

          {[
            { number: "10,000+", label: "Happy Travelers" },
            { number: "500+", label: "Premium Hotels" },
            { number: "120+", label: "Destinations" },
            { number: "24/7", label: "Support" },
          ].map((stat, index) => (

            <div key={index}>
              <h3 className="text-4xl font-bold text-yellow-400 mb-2">
                {stat.number}
              </h3>
              <p className="text-gray-400">
                {stat.label}
              </p>
            </div>

          ))}

        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-gray-100 py-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">
            Why Choose Global Techno Hub?
          </h2>

          <p className="text-gray-600">
            We are building an international travel ecosystem where hotels,
            guides, and transport providers connect directly with travelers.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-10">
            <div>
              <h3 className="font-semibold text-xl mb-2">
                Direct Hotel Booking
              </h3>
              <p className="text-gray-600">
                No middleman. Direct WhatsApp connection with property owners.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-xl mb-2">
                Local Verified Guides
              </h3>
              <p className="text-gray-600">
                Connect with experienced local guides instantly.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-xl mb-2">
                Future Transport Engine
              </h3>
              <p className="text-gray-600">
                Upcoming train and bus booking integration.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* FINAL CTA */}
      <section className="text-center py-20 px-6">
        <h2 className="text-3xl font-bold mb-6">
          Ready to Start Your Journey?
        </h2>

        <a
          href="#destinations"
          className="bg-blue-600 text-white px-8 py-4 rounded-lg"
        >
          Explore Now
        </a>
      </section>

    </div>
  )
}