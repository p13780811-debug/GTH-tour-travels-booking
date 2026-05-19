export default function GlassMenu({
    city,
}: {
    city?: string;
}) {

    const menu = [
        "Flights",
        "Hotels",
        "Tours",
        "Transfers",
        "Insurance",
    ];

    return (

        <section className="relative overflow-hidden bg-[var(--bg)] py-8 md:py-10">

            <div className="mx-auto max-w-[1600px] px-4 md:px-6">

                {/* TOP HEADER */}

                <div className="mb-6 flex items-center justify-between gap-4">

                    <div>

                        <div className="mb-3 inline-flex items-center rounded-full border border-[var(--border)] px-4 py-2 gth-glass">

                            <span className="text-[10px] font-black uppercase tracking-[0.32em] text-[var(--text-soft)]">

                                Smart Travel Access

                            </span>

                        </div>

                        <h2 className="text-2xl font-black tracking-tight text-[var(--text)] md:text-3xl">

                            Premium Travel Services
                            {city ? ` in ${city}` : ""}

                        </h2>

                    </div>

                </div>

                {/* MENU */}

                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">

                    {menu.map((item, i) => (

                        <button
                            key={i}
                            className="
                                group
                                relative
                                flex
                                min-w-fit
                                items-center
                                justify-center
                                overflow-hidden
                                rounded-[24px]
                                border
                                border-[var(--border)]
                                bg-[var(--card)]
                                px-6
                                py-4
                                transition-all
                                duration-500
                                hover:-translate-y-1
                                hover:shadow-[var(--shadow)]
                            "
                        >

                            {/* GLASS LAYER */}

                            <div className="absolute inset-0 gth-glass opacity-80" />

                            {/* CONTENT */}

                            <div className="relative z-10 flex items-center gap-3">

                                {/* INDEX */}

                                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] text-[11px] font-black tracking-[0.14em] text-[var(--text-soft)] transition-all duration-500 group-hover:gth-btn-gold">

                                    {String(i + 1).padStart(2, "0")}

                                </div>

                                {/* TEXT */}

                                <div className="flex flex-col items-start">

                                    <span className="text-sm font-black uppercase tracking-[0.18em] text-[var(--text)]">

                                        {item}

                                    </span>

                                    <span className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[var(--text-soft)]">

                                        Premium Access

                                    </span>

                                </div>

                            </div>

                        </button>

                    ))}

                </div>

            </div>

        </section>

    );
}