"use client"

import Link from "next/link"

import {
    ShieldCheck,

    Globe,

    Scale,
    BadgeCheck,
    AlertTriangle,
    CreditCard,


    Building2,
    Ban,
    UserCheck,
    RefreshCcw,
    Mail,
    ChevronRight,
} from "lucide-react"

const sections = [
    {
        id: "acceptance",
        title: "Acceptance",
        icon: BadgeCheck,
    },
    {
        id: "platform",
        title: "Platform Usage",
        icon: Globe,
    },
    {
        id: "bookings",
        title: "Bookings & Payments",
        icon: CreditCard,
    },
    {
        id: "partners",
        title: "Third-Party Partners",
        icon: Building2,
    },
    {
        id: "conduct",
        title: "User Conduct",
        icon: UserCheck,
    },
    {
        id: "prohibited",
        title: "Restricted Activities",
        icon: Ban,
    },
    {
        id: "liability",
        title: "Liability Disclaimer",
        icon: AlertTriangle,
    },
    {
        id: "compliance",
        title: "Legal Compliance",
        icon: Scale,
    },
    {
        id: "termination",
        title: "Termination",
        icon: ShieldCheck,
    },
    {
        id: "changes",
        title: "Policy Changes",
        icon: RefreshCcw,
    },
    {
        id: "ai-disclaimer",
        title: "AI Disclaimer",
        icon: ShieldCheck,
    },
    {
        id: "governing-law",
        title: "Governing Law",
        icon: Scale,
    },
    {
        id: "force-majeure",
        title: "Force Majeure",
        icon: AlertTriangle,
    },
    {
        id: "contact",
        title: "Contact",
        icon: Mail,
    },
]

export default function Terms() {

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
                                    International Standards
                                </span>
                            </div>

                            <div className="gth-glass rounded-full px-4 py-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                    AI Verified Platform
                                </span>
                            </div>

                            <div className="gth-glass rounded-full px-4 py-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                    Secure Transactions
                                </span>
                            </div>

                            <div className="gth-glass rounded-full px-4 py-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                    Updated 2026
                                </span>
                            </div>

                        </div>

                        <h1 className="max-w-5xl text-4xl font-black tracking-tight text-[var(--text)] md:text-5xl xl:text-6xl">
                            Terms & Conditions
                        </h1>

                        <p className="mt-6 max-w-3xl text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)] md:text-lg">
                            These Terms & Conditions govern the access and use of
                            the GTH PRO ecosystem platform, including travel services,
                            luxury partnerships, hotel integrations, AI-powered systems,
                            real estate experiences and connected global offerings.
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
                                    Legal Navigation
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

                        {/* ACCEPTANCE */}

                        <section
                            id="acceptance"
                            className="gth-glass max-w-4xl rounded-[28px] border border-[var(--border)] p-6 md:p-8"
                        >

                            <div className="mb-5 flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">

                                    <BadgeCheck
                                        size={22}
                                        className="text-[var(--text)]"
                                    />

                                </div>

                                <div>

                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        Legal Agreement
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Acceptance Of Terms
                                    </h2>

                                </div>

                            </div>

                            <p className="text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">
                                By accessing or using GTH PRO, users acknowledge and agree
                                to comply with these Terms & Conditions, applicable laws,
                                platform policies and operational guidelines.
                            </p>

                        </section>

                        {/* PLATFORM */}

                        <section
                            id="platform"
                            className="gth-glass max-w-4xl rounded-[28px] border border-[var(--border)] p-6 md:p-8"
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
                                        Platform Usage
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Ecosystem Access
                                    </h2>

                                </div>

                            </div>

                            <ul className="space-y-4 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">

                                <li>
                                    • Users must provide accurate and lawful information during registrations and bookings.
                                </li>

                                <li>
                                    • AI-powered features are designed to improve recommendations and planning experiences.
                                </li>

                                <li>
                                    • Unauthorized automation, scraping or misuse of platform systems is prohibited.
                                </li>

                                <li>
                                    • GTH PRO reserves the right to suspend suspicious or abusive activity.
                                </li>

                            </ul>

                        </section>

                        {/* BOOKINGS */}

                        <section
                            id="bookings"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-8"
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
                                        Bookings & Payments
                                    </h2>

                                </div>

                            </div>

                            <ul className="space-y-4 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">

                                <li>
                                    • Prices and availability may change without prior notice.
                                </li>

                                <li>
                                    • Users are responsible for verifying booking details before confirmation.
                                </li>

                                <li>
                                    • Refunds and cancellations are subject to partner-specific policies.
                                </li>

                                <li>
                                    • Payment processing may be handled through secure third-party gateways.
                                </li>

                            </ul>

                        </section>

                        {/* PARTNERS */}

                        <section
                            id="partners"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-8"
                        >

                            <div className="mb-5 flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">

                                    <Building2
                                        size={22}
                                        className="text-[var(--text)]"
                                    />

                                </div>

                                <div>

                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        Partner Network
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Third-Party Services
                                    </h2>

                                </div>

                            </div>

                            <p className="text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">
                                GTH PRO may connect users with hotels, airlines,
                                travel operators, real estate companies and verified
                                international partners. External providers maintain
                                independent policies and operational responsibilities.
                            </p>

                        </section>

                        {/* CONDUCT */}
                        <section id="conduct" className="gth-glass rounded-[32px] border border-[var(--border)] p-8">

                            <div className="mb-5 flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">
                                    <UserCheck size={22} className="text-[var(--text)]" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        User Conduct
                                    </p>
                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Responsible User Conduct
                                    </h2>
                                </div>
                            </div>

                            <ul className="mt-5 space-y-4 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">

                                <li>
                                    • Respect platform integrity and partner systems.
                                </li>

                                <li>
                                    • Avoid fraudulent activity or false representations.
                                </li>

                                <li>
                                    • Maintain lawful and ethical platform usage.
                                </li>

                                <li>
                                    • Protect personal account credentials and authentication details.
                                </li>

                            </ul>

                        </section>

                        {/* PROHIBITED */}

                        <section
                            id="prohibited"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-8"
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
                                        Prohibited
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Restricted Activities
                                    </h2>

                                </div>

                            </div>

                            <ul className="space-y-4 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">

                                <li>
                                    • Illegal transactions or unauthorized financial activity.
                                </li>

                                <li>
                                    • Security attacks, malware distribution or infrastructure abuse.
                                </li>

                                <li>
                                    • Impersonation of organizations, businesses or individuals.
                                </li>

                                <li>
                                    • Unauthorized resale or misuse of ecosystem services.
                                </li>

                            </ul>

                        </section>

                        {/* LIABILITY */}

                        <section
                            id="liability"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-8"
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
                                        Liability
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Disclaimer Of Liability
                                    </h2>

                                </div>

                            </div>

                            <p className="text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">
                                GTH PRO provides platform access and digital ecosystem services
                                on an “as available” basis. While reasonable efforts are made
                                to ensure reliability and security, uninterrupted access or
                                error-free performance cannot be guaranteed at all times.
                            </p>

                        </section>

                        {/* COMPLIANCE */}

                        <section
                            id="compliance"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-8"
                        >

                            <div className="mb-5 flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">

                                    <Scale
                                        size={22}
                                        className="text-[var(--text)]"
                                    />

                                </div>

                                <div>

                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        Compliance
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Legal Compliance
                                    </h2>

                                </div>

                            </div>

                            <p className="mt-5 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">
                                Users are responsible for complying with applicable local,
                                national and international laws while using the platform,
                                including travel regulations, financial laws and digital usage policies.
                            </p>

                        </section>

                        {/* TERMINATION */}

                        <section
                            id="termination"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-8"
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
                                        Termination
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Account Restriction & Termination
                                    </h2>

                                </div>

                            </div>

                            <p className="mt-5 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">
                                GTH PRO reserves the right to suspend, restrict or terminate
                                platform access in cases involving fraud, policy violations,
                                abusive behavior, security threats or unlawful activities.
                            </p>

                        </section>

                        {/* CHANGES */}

                        <section
                            id="changes"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-8"
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
                                        Policy Changes
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Changes To Terms
                                    </h2>

                                </div>

                            </div>

                            <p className="mt-5 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">
                                These Terms & Conditions may be revised periodically to reflect
                                operational upgrades, legal requirements, security enhancements
                                and ecosystem expansion.
                            </p>

                        </section>

                        {/* AI Disclaimer */}

                        <section
                            id="ai-disclaimer"
                            className="gth-glass max-w-4xl rounded-[28px] border border-[var(--border)] p-6 md:p-8"
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
                                        AI Systems
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        AI Recommendation Disclaimer
                                    </h2>

                                </div>

                            </div>

                            <p className="mt-5 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">
                                AI-generated recommendations are informational in nature and should not be treated as guaranteed financial, travel, investment or legal advice.
                            </p>

                        </section>

                        {/* Governing Law */}
                        <section
                            id="governing-law"
                            className="gth-glass max-w-4xl rounded-[28px] border border-[var(--border)] p-6 md:p-8"
                        >

                            <div className="mb-5 flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">

                                    <Scale
                                        size={22}
                                        className="text-[var(--text)]"
                                    />

                                </div>

                                <div>

                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        Jurisdiction
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Governing Law
                                    </h2>

                                </div>

                            </div>

                            <p className="mt-5 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">
                                Governing law shall be applicable according to the operational jurisdiction of GTH PRO and applicable international digital commerce standards.
                            </p>

                        </section>

                        {/* Force Majeure */}

                        <section
                            id="force-majeure"
                            className="gth-glass max-w-4xl rounded-[28px] border border-[var(--border)] p-6 md:p-8"
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
                                        Operational Protection
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Force Majeure
                                    </h2>

                                </div>

                            </div>

                            <p className="mt-5 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">
                                GTH PRO shall not be liable for delays, cancellations or failures caused by natural disasters, cyber incidents, war, government restrictions or events beyond operational control.
                            </p>

                        </section>

                        {/* CONTACT */}

                        <section
                            id="contact"
                            className="gth-glass rounded-[32px] border border-[var(--border)] p-8"
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
                                        Contact
                                    </p>

                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">
                                        Contact & Legal Support
                                    </h2>

                                </div>

                            </div>

                            <p className="mt-5 text-base leading-[1.9] tracking-[0.01em] text-[var(--text-soft)]">
                                For legal concerns, disputes, compliance requests or policy-related
                                communication, users may contact the official GTH PRO support team.
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