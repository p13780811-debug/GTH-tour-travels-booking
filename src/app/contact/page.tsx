export default function ContactPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white pt-32 px-10">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-5xl font-bold text-[#00FF41] mb-10 tracking-tighter text-center">
                    Contact Us
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Contact Form */}
                    <div className="p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                        <h2 className="text-2xl font-semibold mb-6">Send a Message</h2>
                        <form className="space-y-4">
                            <input type="text" placeholder="Your Name" className="w-full p-3 bg-black/50 border border-white/10 rounded-lg focus:border-[#00FF41] outline-none" />
                            <input type="email" placeholder="Your Email" className="w-full p-3 bg-black/50 border border-white/10 rounded-lg focus:border-[#00FF41] outline-none" />
                            <textarea placeholder="How can we help?" rows={4} className="w-full p-3 bg-black/50 border border-white/10 rounded-lg focus:border-[#00FF41] outline-none"></textarea>
                            <button className="w-full py-3 bg-[#00FF41] text-black font-bold rounded-lg hover:bg-[#00cc33] transition-all">
                                Send Inquiry
                            </button>
                        </form>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-8">
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                            <h3 className="text-[#00FF41] font-bold mb-2 uppercase tracking-widest text-xs">Global Support</h3>
                            <p className="text-xl font-medium">support@gthpro.com</p>
                        </div>
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                            <h3 className="text-[#00FF41] font-bold mb-2 uppercase tracking-widest text-xs">Business Hours</h3>
                            <p className="text-lg">24/7 International Assistance</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}