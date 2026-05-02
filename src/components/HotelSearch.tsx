"use client";

import { useState } from "react";

export default function HotelSearch() {
    const [city, setCity] = useState("Delhi");
    const [checkin, setCheckin] = useState("");
    const [checkout, setCheckout] = useState("");

    const searchHotels = () => {
        if (!city || !checkin || !checkout) return;

        // Direct Klook / Hotellook deeplink
        window.open(
            `https://klook.tpo.lv/IKb6eSUe?marker=417668&destination=${city}&checkin=${checkin}&checkout=${checkout}`,
            "_blank"
        );
    };

    return (
        <div className="max-w-6xl mx-auto py-16 text-white">
            <div className="bg-[#111] p-6 rounded-xl mb-10 border border-yellow-500/20">
                <h2 className="text-3xl font-bold mb-6">Search Hotels</h2>
                <div className="grid md:grid-cols-4 gap-4">
                    <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="p-3 bg-black border border-gray-700 rounded"
                    />
                    <input
                        type="date"
                        value={checkin}
                        onChange={(e) => setCheckin(e.target.value)}
                        className="p-3 bg-black border border-gray-700 rounded"
                    />
                    <input
                        type="date"
                        value={checkout}
                        onChange={(e) => setCheckout(e.target.value)}
                        className="p-3 bg-black border border-gray-700 rounded"
                    />
                    <button
                        onClick={searchHotels}
                        className="bg-yellow-400 text-black font-semibold rounded hover:gth-glass transition"
                    >
                        Search
                    </button>
                </div>
            </div>
        </div>
    );
}