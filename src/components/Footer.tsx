import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-[#050505] border-t border-white/10 pt-10 pb-8 px-10">
            {/* 🟢 Neon Dot at the Top - Clean Version */}
            <div className="flex items-center gap-2 mb-8 border-b border-white/5 pb-6">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF41] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00FF41]"></span>
                </span>
                <span className="text-[10px] text-[#00FF41] font-mono tracking-widest uppercase">
                    System Online | Secure Gateway Active
                </span>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-white">
                <div>
                    <h2 className="text-xl font-bold">GTH <span className="text-[#00FF41]">PRO</span></h2>
                    <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                        Secure international ecosystem connected to global travel programs.
                    </p>
                </div>

                <div>
                    <h3 className="font-semibold mb-4">Explore</h3>
                    <ul className="text-sm text-gray-400 space-y-2">
                        <li className="hover:text-[#00FF41] cursor-pointer transition-colors">Destinations</li>
                        <li className="hover:text-[#00FF41] cursor-pointer transition-colors">Hotels</li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-semibold mb-4">Trust & Legal</h3>
                    <ul className="text-sm text-gray-400 space-y-2">
                        <li><Link href="/privacy-policy" className="hover:text-[#00FF41] transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/terms-and-conditions" className="hover:text-[#00FF41] transition-colors">Terms & Conditions</Link></li>
                        <li><Link href="/refund-policy" className="hover:text-[#00FF41] transition-colors">Refund Policy</Link></li>
                    </ul>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h3 className="text-sm font-semibold mb-2">Security Priority</h3>
                    <p className="text-[10px] text-gray-400 leading-tight">
                        Government-standard encryption and secure data masking enabled for all transactions. your information is protected with the highest level of integrity.
                    </p>
                </div>
            </div>

            <div className="mt-12 pt-6 border-t border-white/5 text-center">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                    © 2026 GTH PRO. All Rights Reserved.
                </p>
            </div>
        </footer>
    );
}