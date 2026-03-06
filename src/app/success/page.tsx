export default function SuccessPage() {
    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center px-6">
            {/* Golden Success Ring */}
            <div className="w-24 h-24 rounded-full border-4 border-yellow-500 flex items-center justify-center mb-8 animate-pulse shadow-[0_0_40px_rgba(234,179,8,0.3)]">
                <span className="text-yellow-500 text-5xl">✓</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter uppercase">
                Booking Secured
            </h1>

            {/* 1% Education Fund Glow - Golden Heart */}
            <div className="mt-8 p-8 bg-white/5 border border-yellow-500/20 rounded-3xl backdrop-blur-2xl flex flex-col items-center max-w-md">
                <div className="text-yellow-500 text-5xl mb-4 animate-bounce">💛</div>
                <h2 className="text-yellow-500 font-bold tracking-widest text-sm uppercase mb-2">Social Contribution Active</h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                    As part of our mission, <span className="text-white font-bold text-lg">1%</span> of this transaction has been automatically contributed to the <span className="text-yellow-500">Children's Education Fund</span>.
                </p>
            </div>

            <a href="/" className="mt-12 text-white/50 hover:text-yellow-500 transition-colors font-bold tracking-widest uppercase text-xs">
                Return to Dashboard
            </a>
        </div>
    );
}