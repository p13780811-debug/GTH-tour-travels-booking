import Link from "next/link";
import Image from "next/image";
import { blogs } from "@/data/blogs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


const blogImages = [
    "/images/blogs/manali.jpg",
    "/images/blogs/jaipur.jpg",
    "/images/blogs/goa.jpg"
]

export default function BlogList() {
    return (
        <main className="min-h-screen bg-[#050505] text-white">
            <Navbar />

            {/* --- HERO SECTION: High Definition Impact --- */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden pt-24">
                {/* Background HD Image - Ab link ekdum clean hai */}

                <Image
                    src="https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?q=80&w=2000&auto=format&fit=crop"
                    alt="Luxury Travel"
                    fill
                    className="object-cover opacity-40 grayscale-[00%]"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/60 to-[#050505]"></div>

                <div className="relative z-10 text-center px-6">
                    <span className="text-[#d4af37] font-bold tracking-[0.5em] text-xs uppercase mb-4 block">
                        GTH Pro Intelligence
                    </span>
                    <h1 className="text-3xl md:text-5xl font-bold gold-text mb-6 leading-none">
                        TRAVEL <br /> INSIGHTS
                    </h1>
                    <p className="max-w-xl mx-auto text-gray-400 text-sm font-light tracking-wide">
                        Exclusive guides curated by our AI engine for the 1% traveler.
                    </p>
                </div>
            </section>

            {/* --- GTH PRO ELITE BAR: Unique & Minimalist --- */}
            <div className="max-w-7xl mx-auto px-6 py-12 border-b border-[#1a1a1a]">
                <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 md:gap-4">
                    {[
                        { title: 'AI CURATED', desc: 'Precision Guides' },
                        { title: 'ELITE ACCESS', desc: 'Hidden Gems' },
                        { title: 'LIVE ENGINE', desc: 'Real-time Updates' },
                        { title: 'ZERO TRACE', desc: 'Privacy First' }
                    ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-4 group">
                            {/* Gold Dot Indicator */}
                            <div className="h-2 w-2 rounded-full bg-[#d4af37] shadow-[0_0_10px_#d4af37] group-hover:scale-150 transition-transform"></div>
                            <div>
                                <p className="text-white text-xs font-black tracking-[0.2em]">{feature.title}</p>
                                <p className="text-gray-500 text-[10px] uppercase font-light">{feature.desc}</p>
                            </div>
                            {/* Divider for Desktop */}
                            {i !== 3 && <div className="hidden lg:block h-8 w-[1px] bg-[#1a1a1a] ml-8"></div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* --- BLOG GRID SECTION --- */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl font-bold text-white mb-4">Latest Curations</h2>
                        <div className="h-1 w-20 bg-[#d4af37]"></div>
                    </div>
                    <div className="flex gap-4 text-xs font-bold text-gray-500 uppercase tracking-tighter">
                        <span className="text-[#d4af37] cursor-pointer">All</span>
                        <span className="hover:text-white cursor-pointer transition">Hotels</span>
                        <span className="hover:text-white cursor-pointer transition">Guides</span>
                        <span className="hover:text-white cursor-pointer transition">Culture</span>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {blogs.map((blog) => (
                        <Link
                            key={blog.slug}
                            href={`/blog/${blog.slug}`}
                            className="group relative bg-[#0a0a0a] rounded-2xl overflow-hidden border border-[#1a1a1a] hover:border-[#d4af37]/50 transition-all duration-500 luxury-card"
                        >
                            <div className="relative h-72 w-full overflow-hidden">
                                <Image
                                    src={blog.image}
                                    alt={blog.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
                                />

                                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-[#d4af37]/30">
                                    <p className="text-[#d4af37] text-[10px] font-bold tracking-widest uppercase">Elite Guide</p>
                                </div>
                            </div>

                            <div className="p-8">
                                <h3 className="text-2xl font-bold mb-4 group-hover:text-[#d4af37] transition-colors leading-tight">
                                    {blog.title}
                                </h3>
                                <p className="text-gray-500 text-sm line-clamp-2 font-light leading-relaxed mb-6">
                                    {blog.description}
                                </p>
                                <div className="flex items-center justify-between pt-6 border-t border-[#1a1a1a]">
                                    <span className="text-[10px] text-[#d4af37] font-black uppercase tracking-[0.2em]">Read More</span>
                                    <svg className="w-4 h-4 text-[#d4af37] transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <Footer />
        </main>
    );
}