"use client"

export default function PremiumBoostBanner({ slug }: any) {

    const handleBoost = async () => {
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                body: JSON.stringify({ slug }),
            })

            const data = await res.json()

            if (data.url) {
                window.location.href = data.url
            }
        } catch (err) {
            alert("Payment failed")
        }
    }

    return (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-2xl text-black flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">

            <div>
                <h3 className="font-bold text-lg">
                    🚀 Boost Your Property
                </h3>
                <p className="text-sm">
                    Rank higher • Get 10x visibility • Close deals faster
                </p>
            </div>

            <button
                onClick={handleBoost}
                className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:scale-105 transition"
            >
                Boost Now ₹199
            </button>

        </div>
    )
}