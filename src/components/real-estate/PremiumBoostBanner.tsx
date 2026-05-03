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
        <div className="gth-glass-strong p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">

            <div>
                <h3 className="font-bold text-lg gold-text">
                    🚀 Boost Your Property
                </h3>
                <p className="text-sm opacity-70">
                    Rank higher • Get 10x visibility • Close deals faster
                </p>
            </div>

            <button
                onClick={handleBoost}
                className="gth-btn-gold px-6 py-2 rounded-lg font-bold"
            >
                Boost Now ₹199
            </button>

        </div>
    )
}