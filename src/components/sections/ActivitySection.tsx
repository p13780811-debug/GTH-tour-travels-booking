// GTH Pro - Activity/Tours Section (Luxury Style)
import React from 'react';

const activities = [
    { id: 1, title: 'Private Yacht Cruise', price: '$1,200', rating: '5.0', image: '/yacht.jpg' },
    { id: 2, title: 'Desert Safari Gold', price: '$450', rating: '4.9', image: '/safari.jpg' },
    // Python automation se baaki 19 programs yahan aayenge
];

export default function ActivitySection() {
    return (
        <section className="bg-[#0a0a0a] py-20 px-6">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-4xl font-bold text-[#d4af37] mb-2 tracking-tighter uppercase">
                    Elite Experiences
                </h2>
                <p className="text-gray-400 mb-12">Handpicked by GTH Pro Automation</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {activities.map((item) => (
                        <div key={item.id} className="group relative overflow-hidden rounded-xl border border-[#222] hover:border-[#d4af37] transition-all duration-500">
                            <div className="h-64 gth-glass-800 relative">
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
                                    <button className="bg-[#d4af37] text-black px-4 py-2 rounded-full font-bold text-sm hover:gth-glass transition-all">
                                        BOOK NOW
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}