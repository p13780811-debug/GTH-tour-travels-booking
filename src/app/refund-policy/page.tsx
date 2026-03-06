export default function RefundPolicy() {
    return (
        <div className="min-h-screen bg-[#050505] text-white p-10">
            <h1 className="text-4xl font-bold text-[#00FF41] mb-6">Refund & Cancellation Policy</h1>

            <div className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-red-500/20">
                <h2 className="text-2xl font-semibold mb-4">Partner Policy Alignment</h2>
                <p className="mb-4 opacity-90">GTH PRO partners with 19+ international travel providers. All refund requests are subject to the specific terms and conditions of the respective service provider (e.g., Trip.com, Booking.com, Kiwitaxi).</p>

                <h2 className="text-2xl font-semibold mb-4 mt-6">How to Request a Refund</h2>
                <p className="opacity-90">To ensure security and transparency, all refund requests must be initiated through our secure dashboard or by contacting our support team. We will coordinate with the partner site to process your request as per their timeline.</p>
            </div>
        </div>
    );
}