"use client"; // Next.js App Router ke liye ye zaroori hai

import { useEffect } from 'react';

const HotelWidget = () => {
    useEffect(() => {
        // 1. Purane widget ko saaf karna (Agar pehle se load ho)
        const container = document.getElementById('tp-widget-container');
        if (container) container.innerHTML = '';

        // 2. Script create karna
        const script = document.createElement('script');
        script.src = "https://tpwidg.com/content?currency=USD&trs=504342&shmarker=417668&locale=en&category=4&amount=3&powered_by=true&campaign_id=137&promo_id=4497"
        script.async = true;
        script.charset = "utf-8";

        // 3. Script ko div ke andar daalna
        document.getElementById('tp-widget-container')?.appendChild(script);
    }, []);

    return (
        <div className="w-full max-w-4xl mx-auto my-8 p-4 bg-white rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Explore Top Tours & Hotels</h2>
            <div id="tp-widget-container" className="min-h-[400px]">
                {/* Widget yahan load hoga */}
                <p className="text-sm text-gray-400 animate-pulse">Loading amazing deals...</p>
            </div>
        </div>
    );
};

export default HotelWidget;