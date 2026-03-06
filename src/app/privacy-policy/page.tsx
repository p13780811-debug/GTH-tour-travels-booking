export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#050505] text-white pt-32 px-10">
            <h1 className="text-4xl font-bold text-[#00FF41] mb-8">Privacy Policy</h1>

            <div className="max-w-4xl space-y-8">
                <section className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                    <h2 className="text-2xl font-semibold mb-4 text-blue-400">Data Protection & Security</h2>
                    <p className="opacity-80">At GTH PRO, security is our biggest priority. We ensure that all user information is handled with the highest level of integrity.</p>
                    <ul className="list-disc pl-5 mt-4 space-y-2 opacity-90">
                        <li>All user data is stored securely using our Supabase backend infrastructure.</li>
                        <li>We use industry-standard encryption to protect your personal details during transactions.</li>
                        <li>Your data is never sold to third parties; we only share necessary information with travel partners to fulfill your bookings.</li>
                    </ul>
                </section>

                <section className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                    <h2 className="text-2xl font-semibold mb-4">Cookie Policy</h2>
                    <p className="opacity-80">We use cookies to improve your browsing experience and provide personalized travel recommendations across our ecosystem.</p>
                </section>
            </div>
        </div>
    );
}