"use client"

import Link from "next/link"

import {
    ShieldCheck,
    Database,
    Lock,
    Globe,
    Eye,
    FileCheck,
    BellRing,
    Scale,
    UserCheck,
    Mail,
    ChevronRight,
} from "lucide-react"

const sections = [
    {
        id: "overview",
        title: "Overview",
        icon: Globe,
    },
    {
        id: "collection",
        title: "Information Collection",
        icon: Database,
    },
    {
        id: "usage",
        title: "How We Use Data",
        icon: Eye,
    },
    {
        id: "security",
        title: "Security & Protection",
        icon: ShieldCheck,
    },
    {
        id: "cookies",
        title: "Cookies Policy",
        icon: BellRing,
    },
    {
        id: "rights",
        title: "User Rights",
        icon: UserCheck,
    },
    {
        id: "transfers",
        title: "International Transfers",
        icon: Globe,
    },
    {
        id: "compliance",
        title: "Legal Compliance",
        icon: Scale,
    },
    {
        id: "updates",
        title: "Policy Updates",
        icon: FileCheck,
    },
    {
        id: "contact",
        title: "Contact",
        icon: Mail,
    },
]

export default function PrivacyPolicy() {

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
                                    GDPR Ready
                                </span>
                            </div>

                            <div className="gth-glass rounded-full px-4 py-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                    AI Protected
                                </span>
                            </div>

                            <div className="gth-glass rounded-full px-4 py-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                    Global Compliance
                                </span>
                            </div>

                            <div className="gth-glass rounded-full px-4 py-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                    Updated 2026
                                </span>
                            </div>

                        </div>

                        <h1 className="max-w-4xl text-4xl font-black tracking-tight text-[var(--text)] md:text-6xl">
                            Privacy Policy
                        </h1>

                        <p className="mt-6 max-w-3xl text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)] md:text-lg">
                            GTH PRO is committed to protecting user privacy, maintaining
                            enterprise-grade data security and ensuring full transparency
                            across our global luxury ecosystem platform. This Privacy Policy
                            explains how information is collected, stored, processed and protected.
                        </p>

                    </div>

                </div>

            </section>

            {/* ================= CONTENT ================= */}

            <section className="relative">

                <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[280px_1fr]">

                    {/* ================= SIDEBAR ================= */}

                    <aside className="hidden lg:block">

                        <div className="lg:sticky lg:top-32">

                            <div className="gth-glass rounded-[28px] p-5">

                                <p className="mb-6 text-[10px] font-black uppercase tracking-[0.26em] text-[var(--text-soft)]">
                                    Policy Navigation
                                </p>

                                <div className="space-y-2">

                                    {sections.map((item) => {

                                        const Icon = item.icon

                                        return (

                                            <a
                                                key={item.id}
                                                href={`#${item.id}`}
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

                                            </a>

                                        )

                                    })}

                                </div>

                            </div>

                        </div>

                    </aside>

                    {/* ================= MAIN ================= */}

                    <div className="space-y-8">

                        {/* OVERVIEW */}

                        <section
                            id="overview"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-8"
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
                                        Privacy Overview
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Transparency & Trust
                                    </h2>

                                </div>

                            </div>

                            <p className="text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">
                                GTH PRO operates as a global digital ecosystem for travel,
                                hospitality, luxury experiences and verified partnerships.
                                We are committed to maintaining transparent data practices,
                                protecting personal information and ensuring compliance with
                                applicable international privacy standards.
                            </p>

                        </section>

                        {/* COLLECTION */}

                        <section
                            id="collection"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-8"
                        >

                            <div className="mb-5 flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">

                                    <Database
                                        size={22}
                                        className="text-[var(--text)]"
                                    />

                                </div>

                                <div>

                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        Data Collection
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Information We Collect
                                    </h2>

                                </div>

                            </div>

                            <ul className="space-y-4 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">

                                <li>
                                    • Personal details such as name, email address and contact information.
                                </li>

                                <li>
                                    • Booking preferences, destination interests and travel activity.
                                </li>

                                <li>
                                    • Technical data including IP address, browser type and device information.
                                </li>

                                <li>
                                    • Communication records for customer support and security verification.
                                </li>

                            </ul>

                        </section>

                        {/* USAGE */}

                        <section
                            id="usage"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-8"
                        >

                            <div className="mb-5 flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">

                                    <Eye
                                        size={22}
                                        className="text-[var(--text)]"
                                    />

                                </div>

                                <div>

                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        Data Usage
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        How Information Is Used
                                    </h2>

                                </div>

                            </div>

                            <p className="text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">
                                User information is used to improve booking experiences,
                                personalize recommendations, optimize platform security,
                                process transactions and deliver premium ecosystem services.
                                We do not sell personal information to third parties.
                            </p>

                        </section>

                        {/* SECURITY */}

                        <section
                            id="security"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-8"
                        >

                            <div className="mb-5 flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">

                                    <Lock
                                        size={22}
                                        className="text-[var(--text)]"
                                    />

                                </div>

                                <div>

                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        Security
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Enterprise Protection Standards
                                    </h2>

                                </div>

                            </div>

                            <ul className="space-y-4 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">

                                <li>
                                    • Encrypted data transmission protocols.
                                </li>

                                <li>
                                    • Secure Supabase infrastructure and access management.
                                </li>

                                <li>
                                    • AI-assisted fraud monitoring and suspicious activity detection.
                                </li>

                                <li>
                                    • Periodic security reviews and infrastructure audits.
                                </li>

                            </ul>

                        </section>

                        {/* COOKIES */}

                        <section
                            id="cookies"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-8"
                        >

                            <h2 className="text-3xl font-black tracking-tight text-[var(--text)]">
                                Cookies Policy
                            </h2>

                            <p className="mt-5 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">
                                Cookies are used to improve platform performance,
                                remember user preferences, enhance security and provide
                                personalized ecosystem recommendations.
                            </p>

                        </section>

                        {/* RIGHTS */}

                        <section
                            id="rights"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-8"
                        >

                            <h2 className="text-3xl font-black tracking-tight text-[var(--text)]">
                                User Rights
                            </h2>

                            <ul className="mt-5 space-y-4 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">

                                <li>
                                    • Access personal information.
                                </li>

                                <li>
                                    • Request correction or deletion of data.
                                </li>

                                <li>
                                    • Withdraw consent for marketing communications.
                                </li>

                                <li>
                                    • Request export of account-related information.
                                </li>

                            </ul>

                        </section>

                        {/* INTERNATIONAL */}

                        <section
                            id="transfers"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-8"
                        >

                            <h2 className="text-3xl font-black tracking-tight text-[var(--text)]">
                                International Transfers
                            </h2>

                            <p className="mt-5 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">
                                As a global platform, data may be processed or stored in
                                multiple jurisdictions. GTH PRO applies commercially reasonable
                                safeguards and security standards to maintain privacy protection
                                during international data transfers.
                            </p>

                        </section>

                        {/* COMPLIANCE */}

                        <section
                            id="compliance"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-8"
                        >

                            <h2 className="text-3xl font-black tracking-tight text-[var(--text)]">
                                Legal Compliance
                            </h2>

                            <p className="mt-5 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">
                                GTH PRO strives to align with internationally recognized
                                privacy principles and regulatory frameworks including GDPR-inspired
                                privacy practices, consumer protection standards and modern
                                cybersecurity expectations.
                            </p>

                        </section>

                        {/* UPDATES */}

                        <section
                            id="updates"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-8"
                        >

                            <h2 className="text-3xl font-black tracking-tight text-[var(--text)]">
                                Policy Updates
                            </h2>

                            <p className="mt-5 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">
                                This Privacy Policy may be updated periodically to reflect
                                regulatory changes, platform upgrades or operational improvements.
                                Users are encouraged to review this page regularly.
                            </p>

                        </section>

                        {/* CONTACT */}

                        <section
                            id="contact"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-8"
                        >

                            <h2 className="text-3xl font-black tracking-tight text-[var(--text)]">
                                Contact
                            </h2>

                            <p className="mt-5 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">
                                For privacy-related concerns, legal inquiries or data access
                                requests, users may contact the GTH PRO support and compliance team.
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