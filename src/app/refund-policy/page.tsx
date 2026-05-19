"use client"

import Link from "next/link"

import {
    ShieldCheck,
    Globe,
    Scale,

    AlertTriangle,
    CreditCard,
    Building2,
    Ban,

    RefreshCcw,
    Mail,
    ChevronRight,
    BadgeDollarSign, // ✅ Added
    Clock3,          // ✅ Added
    FileCheck2       // ✅ Added
} from "lucide-react"


const sections = [
    {
        id: "overview",
        title: "Policy Overview",
        icon: ShieldCheck,
    },
    {
        id: "eligibility",
        title: "Refund Eligibility",
        icon: BadgeDollarSign,
    },
    {
        id: "cancellations",
        title: "Cancellations",
        icon: RefreshCcw,
    },
    {
        id: "partners",
        title: "Third-Party Partners",
        icon: Building2,
    },
    {
        id: "processing",
        title: "Processing Timeline",
        icon: Clock3,
    },
    {
        id: "payment",
        title: "Payment & Chargebacks",
        icon: CreditCard,
    },
    {
        id: "restrictions",
        title: "Restrictions",
        icon: Ban,
    },
    {
        id: "compliance",
        title: "Legal Compliance",
        icon: Scale,
    },
    {
        id: "liability",
        title: "Liability Disclaimer",
        icon: AlertTriangle,
    },
    {
        id: "contact",
        title: "Support Contact",
        icon: Mail,
    },
]

export default function RefundPolicy() {

    return (

        <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] transition-colors duration-500">

            {/* ================= BACKGROUND FX ================= */}

            <div className="pointer-events-none absolute inset-0 overflow-hidden">

                <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-[var(--gold)]/10 blur-3xl" />

                <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[var(--primary)]/10 blur-3xl" />

            </div>

            {/* ================= HERO ================= */}

            <section className="relative border-b border-[var(--border)]">

                <div className="mx-auto max-w-7xl px-4 pb-16 pt-32 md:px-6">

                    <div className="max-w-4xl">

                        <div className="mb-6 flex flex-wrap gap-3">

                            <div className="gth-glass rounded-full px-4 py-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                    Global Refund Standards
                                </span>
                            </div>

                            <div className="gth-glass rounded-full px-4 py-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                    Secure Transactions
                                </span>
                            </div>

                            <div className="gth-glass rounded-full px-4 py-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                    Verified Partner Ecosystem
                                </span>
                            </div>

                            <div className="gth-glass rounded-full px-4 py-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                    Updated 2026
                                </span>
                            </div>

                        </div>

                        <h1 className="max-w-5xl text-4xl font-black tracking-tight text-[var(--text)] md:text-5xl xl:text-6xl">
                            Refund & Cancellation Policy
                        </h1>

                        <p className="mt-6 max-w-3xl text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)] md:text-lg">
                            This Refund & Cancellation Policy governs booking refunds,
                            cancellations, payment disputes, partner processing timelines
                            and transaction responsibilities across the GTH PRO ecosystem,
                            including travel, hotel, tourism and partner-integrated services.
                        </p>

                        <p className="mt-5 text-sm text-[var(--text-soft)]">
                            Last Updated: January 2026
                        </p>

                    </div>

                </div>

            </section>

            {/* ================= MAIN ================= */}

            <section className="relative">

                <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[280px_1fr]">

                    {/* ================= SIDEBAR ================= */}

                    <aside className="hidden lg:block">

                        <div className="lg:sticky lg:top-32">

                            <div className="gth-glass rounded-[28px] p-5">

                                <p className="mb-6 text-[10px] font-black uppercase tracking-[0.26em] text-[var(--text-soft)]">
                                    Refund Navigation
                                </p>

                                <div className="space-y-2">

                                    {sections.map((item) => {

                                        const Icon = item.icon

                                        return (

                                            <Link
                                                key={item.id}
                                                href={`#${item.id}`}
                                                scroll={true}
                                                className="group flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300 hover:bg-[var(--card)]"
                                            >

                                                <div className="flex items-center gap-3">

                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)]">

                                                        <Icon
                                                            size={16}
                                                            className="text-[var(--text-soft)]"
                                                        />

                                                    </div>

                                                    <span className="text-sm font-semibold text-[var(--text-soft)] transition-colors duration-300 group-hover:text-[var(--text)]">
                                                        {item.title}
                                                    </span>

                                                </div>

                                                <ChevronRight
                                                    size={14}
                                                    className="text-[var(--text-soft)] transition-transform duration-300 group-hover:translate-x-1"
                                                />

                                            </Link>

                                        )

                                    })}

                                </div>

                            </div>

                        </div>

                    </aside>

                    {/* ================= CONTENT ================= */}

                    <div className="space-y-8">

                        {/* OVERVIEW */}

                        <section
                            id="overview"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-6 md:p-8"
                        >

                            <div className="mb-5 flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">

                                    <ShieldCheck
                                        size={22}
                                        className="text-[var(--text)]"
                                    />

                                </div>

                                <div>

                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        Refund Framework
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Policy Overview
                                    </h2>

                                </div>

                            </div>

                            <p className="text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">
                                GTH PRO operates as a global digital ecosystem that connects
                                users with airlines, hotels, tourism operators, transportation
                                providers and international booking partners. Refunds and
                                cancellations may depend on provider-specific policies,
                                operational timelines, regional regulations and transaction status.
                            </p>

                        </section>

                        {/* ELIGIBILITY */}

                        <section
                            id="eligibility"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-6 md:p-8"
                        >

                            <div className="mb-5 flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">

                                    <BadgeDollarSign
                                        size={22}
                                        className="text-[var(--text)]"
                                    />

                                </div>

                                <div>

                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        Eligibility
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Refund Eligibility Conditions
                                    </h2>

                                </div>

                            </div>

                            <ul className="space-y-4 text-base leading-[1.9] text-[var(--text-soft)]">

                                <li>
                                    • Refund eligibility depends on the cancellation terms of the respective service provider.
                                </li>

                                <li>
                                    • Certain discounted, promotional or limited-time bookings may be non-refundable.
                                </li>

                                <li>
                                    • Refund requests submitted after the permitted cancellation period may be rejected.
                                </li>

                                <li>
                                    • Users are responsible for reviewing refund conditions before confirming bookings.
                                </li>

                            </ul>

                        </section>

                        {/* CANCELLATIONS */}

                        <section
                            id="cancellations"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-6 md:p-8"
                        >

                            <div className="mb-5 flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">

                                    <RefreshCcw
                                        size={22}
                                        className="text-[var(--text)]"
                                    />

                                </div>

                                <div>

                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        Cancellation Rules
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Booking Cancellation Policy
                                    </h2>

                                </div>

                            </div>

                            <ul className="space-y-4 text-base leading-[1.9] text-[var(--text-soft)]">

                                <li>
                                    • Cancellation requests must be initiated through the official platform or authorized support channels.
                                </li>

                                <li>
                                    • Some providers may charge cancellation penalties or service fees.
                                </li>

                                <li>
                                    • Airline, hotel and transport cancellations are governed by partner operational rules.
                                </li>

                                <li>
                                    • Emergency disruptions, weather conditions or government restrictions may affect refund timelines.
                                </li>

                            </ul>

                        </section>

                        {/* PARTNERS */}

                        <section
                            id="partners"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-6 md:p-8"
                        >

                            <div className="mb-5 flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">

                                    <Globe
                                        size={22}
                                        className="text-[var(--text)]"
                                    />

                                </div>

                                <div>

                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        International Partners
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Third-Party Provider Policies
                                    </h2>

                                </div>

                            </div>

                            <p className="text-base leading-[1.9] text-[var(--text-soft)]">
                                GTH PRO partners with international travel providers,
                                hotels, booking systems and transportation services.
                                External providers maintain independent refund, cancellation,
                                rescheduling and operational policies which may vary by region,
                                destination and service category.
                            </p>

                        </section>

                        {/* PROCESSING */}

                        <section
                            id="processing"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-6 md:p-8"
                        >

                            <div className="mb-5 flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">

                                    <Clock3
                                        size={22}
                                        className="text-[var(--text)]"
                                    />

                                </div>

                                <div>

                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        Processing
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Refund Processing Timeline
                                    </h2>

                                </div>

                            </div>

                            <ul className="space-y-4 text-base leading-[1.9] text-[var(--text-soft)]">

                                <li>
                                    • Refund processing timelines vary depending on banking institutions and partner systems.
                                </li>

                                <li>
                                    • International transactions may require additional verification procedures.
                                </li>

                                <li>
                                    • Delays may occur during peak travel periods or regulatory reviews.
                                </li>

                                <li>
                                    • Users may receive status updates through registered email or dashboard notifications.
                                </li>

                            </ul>

                        </section>

                        {/* PAYMENT */}

                        <section
                            id="payment"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-6 md:p-8"
                        >

                            <div className="mb-5 flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">

                                    <CreditCard
                                        size={22}
                                        className="text-[var(--text)]"
                                    />

                                </div>

                                <div>

                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        Transactions
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Payments & Chargebacks
                                    </h2>

                                </div>

                            </div>

                            <ul className="space-y-4 text-base leading-[1.9] text-[var(--text-soft)]">

                                <li>
                                    • Payment disputes or chargebacks must first be reported to the official support team.
                                </li>

                                <li>
                                    • Fraudulent payment disputes may lead to account restrictions or investigations.
                                </li>

                                <li>
                                    • Refunds are generally issued to the original payment source whenever applicable.
                                </li>

                                <li>
                                    • Banking, exchange-rate or intermediary transaction fees may not be refundable.
                                </li>

                            </ul>

                        </section>

                        {/* RESTRICTIONS */}

                        <section
                            id="restrictions"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-6 md:p-8"
                        >

                            <div className="mb-5 flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">

                                    <Ban
                                        size={22}
                                        className="text-[var(--text)]"
                                    />

                                </div>

                                <div>

                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        Restrictions
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Non-Refundable Situations
                                    </h2>

                                </div>

                            </div>

                            <ul className="space-y-4 text-base leading-[1.9] text-[var(--text-soft)]">

                                <li>
                                    • Completed services and consumed bookings may not qualify for refunds.
                                </li>

                                <li>
                                    • Refund abuse, fraudulent activity or policy manipulation is prohibited.
                                </li>

                                <li>
                                    • Refunds may be denied where partner policies explicitly restrict reimbursement.
                                </li>

                                <li>
                                    • Incorrect personal information submitted by users may impact refund eligibility.
                                </li>

                            </ul>

                        </section>

                        {/* COMPLIANCE */}

                        <section
                            id="compliance"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-6 md:p-8"
                        >

                            <div className="mb-5 flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">

                                    <FileCheck2
                                        size={22}
                                        className="text-[var(--text)]"
                                    />

                                </div>

                                <div>

                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        Compliance
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Regulatory & Legal Compliance
                                    </h2>

                                </div>

                            </div>

                            <p className="text-base leading-[1.9] text-[var(--text-soft)]">
                                Refund operations are subject to applicable international
                                commerce regulations, financial compliance standards,
                                anti-fraud procedures and regional consumer protection laws.
                            </p>

                        </section>

                        {/* LIABILITY */}

                        <section
                            id="liability"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-6 md:p-8"
                        >

                            <div className="mb-5 flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">

                                    <AlertTriangle
                                        size={22}
                                        className="text-[var(--text)]"
                                    />

                                </div>

                                <div>

                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        Disclaimer
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Liability Disclaimer
                                    </h2>

                                </div>

                            </div>

                            <p className="text-base leading-[1.9] text-[var(--text-soft)]">
                                GTH PRO acts as a digital ecosystem facilitator and shall
                                not be held responsible for independent partner delays,
                                operational failures, force majeure events, airline schedule
                                changes or banking institution processing limitations.
                            </p>

                        </section>

                        {/* CONTACT */}

                        <section
                            id="contact"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-6 md:p-8"
                        >

                            <div className="mb-5 flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">

                                    <Mail
                                        size={22}
                                        className="text-[var(--text)]"
                                    />

                                </div>

                                <div>

                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        Support
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Refund Support & Assistance
                                    </h2>

                                </div>

                            </div>

                            <p className="text-base leading-[1.9] text-[var(--text-soft)]">
                                For cancellation requests, refund disputes, transaction
                                clarification or compliance-related concerns, users may
                                contact the official GTH PRO support team through the
                                verified communication channels.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-4">

                                <Link
                                    href="/contact"
                                    className="gth-btn rounded-2xl px-6 py-3"
                                >
                                    Contact Support
                                </Link>

                                <Link
                                    href="/"
                                    className="gth-btn-gold rounded-2xl px-6 py-3"
                                >
                                    Return Home
                                </Link>

                            </div>

                        </section>

                    </div>

                </div>

            </section>

        </div>

    )

}