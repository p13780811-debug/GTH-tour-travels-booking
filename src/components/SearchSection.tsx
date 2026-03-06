"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

// 1. Pehle hum TypeScript ko batate hain ki Result kaisa dikhega
interface SearchResult {
    id: string;
    name: string;
    description: string;
    image_url: string;
    partner_link: string;
}

export default function SearchSection() {
    // 2. Yahan <SearchResult[]> likhne se saari laal line gayab ho jayengi
    const [results, setResults] = useState<SearchResult[]>([]);

    const handleSearch = async (query: string) => {
        if (!query) {
            setResults([]);
            return;
        }

        const { data, error } = await supabase
            .from('destinations')
            .select('*')
            .ilike('name', `%${query}%`);

        if (error) {
            console.error('Error:', error.message);
            return;
        }

        // 3. Ab ye line bilkul clean chalegi
        setResults((data as SearchResult[]) || []);
    };

    return (
        <section className="py-20 px-10 bg-[#050505]">
            <div className="max-w-3xl mx-auto mb-16 relative z-10">
                <input
                    type="text"
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search Destinations..."
                    className="w-full p-6 rounded-full bg-white/5 border border-white/20 text-white outline-none focus:border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#0070f3] rounded-full shadow-[0_0_10px_#0070f3] animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {results.map((item) => (
                    <div key={item.id} className="p-1 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <img src={item.image_url} className="w-full h-48 object-cover rounded-2xl mb-4" />
                        <div className="p-4">
                            <h3 className="text-2xl font-bold text-white mb-2">{item.name}</h3>
                            <div className="flex justify-between items-center mt-6">
                                <span className="text-yellow-500 font-bold">GTH PRO Rate</span>
                                <a
                                    href={`${item.partner_link}&return_url=https://gthpro.com/success`}
                                    className="px-6 py-2 bg-yellow-500 text-black font-extrabold rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                                >
                                    Book Now
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}