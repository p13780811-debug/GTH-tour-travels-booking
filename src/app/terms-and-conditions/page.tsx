export default function Terms() {
    return (
        <div className="min-h-screen bg-[#050505] text-white pt-32 px-10">
            <h1 className="text-4xl font-bold text-[#00FF41] mb-8">Terms & Conditions</h1>

            <div className="max-w-4xl space-y-8">
                <section className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                    <h2 className="text-2xl font-semibold mb-4 text-blue-400">Platform Usage</h2>
                    <p className="opacity-80">By accessing GTH PRO, you agree to our international standard of service and security protocols.</p>
                    <ul className="list-disc pl-5 mt-4 space-y-2 opacity-90">
                        <li>Users must provide accurate information for all bookings and reservations.</li>
                        <li>The AI-integrated features are provided to enhance travel planning and must not be misused.</li>
                        <li>GTH PRO acts as a secure hub connecting users to global travel partners.</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}