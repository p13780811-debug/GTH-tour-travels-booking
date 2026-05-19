'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
    ShieldCheck,
    Leaf,
    Truck,
    ChefHat,
    Phone,
    CheckCircle2,
    Sparkles,
    MapPin,
    IndianRupee,
    Clock3,
    Star,
    ArrowRight,
} from 'lucide-react'

const PHONE = '916290731180'

const WA_BASE = `https://wa.me/${PHONE}`

const createWaLink = (message: string) =>
    `${WA_BASE}?text=${encodeURIComponent(message)}`

const MENU = [
    {
        id: 'veg',
        name: 'Veg Thali Unit',
        price: 150,
        image:
            'https://images.unsplash.com/photo-1680993032090-1ef7ea9b51e5?q=80&w=1200&auto=format&fit=crop',
        badge: 'Daily Bestseller',
        description:
            'Complete Meal Combo with Basmati Rice / Rotis, Dal, 2 Veg Sides, Bhaja, Chutney, Papad, Greens & Lemon.',
        extra: 'Complimentary Seasonal Shaak if available.',
    },
    {
        id: 'fish',
        name: 'Fish Thali Unit',
        price: 210,
        image:
            'https://images.unsplash.com/photo-1620894580123-466ad3a0ca06?q=80&w=1200&auto=format&fit=crop',
        badge: 'Authentic Bengali',
        description:
            'Complete Meal Combo + 2 Pcs Fish Curry (Rohu / Katla).',
        extra: 'Traditional mustard oil preparation.',
    },
    {
        id: 'chicken',
        name: 'Chicken Thali Unit',
        price: 230,
        image:
            'https://images.unsplash.com/photo-1631292784640-2b24be784d5d?q=80&w=1200&auto=format&fit=crop',
        badge: 'Premium Meal',
        description:
            'Complete Meal Combo + 3 Pcs Slow-Cooked Chicken Kosha.',
        extra: 'Slow-marinated home-style recipe.',
    },
    {
        id: 'egg',
        name: 'Egg Thali Unit',
        price: 145,
        image:
            'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?q=80&w=1200&auto=format&fit=crop',
        badge: 'Budget Favourite',
        description:
            'Complete Meal Combo + 2 Eggs in traditional Bengali gravy.',
        extra: 'Balanced comfort meal option.',
    },
    {
        id: 'mutton',
        name: 'Mutton Kosha Roti Combo',
        price: 280,
        image:
            'https://images.unsplash.com/photo-1545247181-516773cae754?q=80&w=1200&auto=format&fit=crop',
        badge: 'Chef Special',
        description:
            '3 Garam Soft Rotis + Premium Mutton Kosha (3 Juicy Pcs).',
        extra: 'Weekend signature special.',
    },
]

const PLANS = [
    {
        name: 'Veg Plan',
        price: '₹2,999',
        subtitle: 'Daily Lunch or Dinner',
        features: [
            'Balanced Home-style meals',
            'Doorstep Delivery',
            'Fresh rotating menu',
            'Daily Lunch or Dinner',
        ],
        highlight: false,
    },
    {
        name: 'Non-Veg Premium',
        price: '₹4,999',
        subtitle: 'Daily with Fish / Chicken Rotations',
        features: [
            'Balanced Home-style meals',
            'Doorstep Delivery',
            'Fish & Chicken rotations',
            'Priority meal preparation',
        ],
        highlight: true,
    },
]

const ZONES = [
    'Palava Phase 1',
    'Palava Phase 2',
    'Casa Bella',
    'Casa Rio',
    'Dombivli East',
]

const TRUST = [
    {
        icon: ChefHat,
        title: '100% Homemade',
        desc: 'Bhaiya & Bhabhi Special',
    },
    {
        icon: ShieldCheck,
        title: 'FSSAI Certified',
        desc: 'Verified kitchen hygiene',
    },
    {
        icon: Leaf,
        title: 'No Added MSG',
        desc: 'No artificial colors',
    },
    {
        icon: Truck,
        title: 'Timely Delivery',
        desc: 'Fresh meals at your doorstep',
    },
]

export default function BengaliKitchenLanding() {
    return (
        <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] overflow-hidden">
            {/* ================= HEADER ================= */}
            <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="gth-glass flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)]">
                            <ChefHat className="h-5 w-5 text-[var(--primary)]" />
                        </div>

                        <div>
                            <p className="text-sm font-black tracking-wide">
                                AUTHENTIC BENGALI MEALS
                            </p>

                            <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-soft)]">
                                Dombivli · GTH Pro Certified
                            </p>
                        </div>
                    </Link>

                    <div className="hidden items-center gap-8 md:flex">
                        <a
                            href="#menu"
                            className="text-sm font-medium text-[var(--text-soft)] transition hover:text-[var(--text)]"
                        >
                            Menu
                        </a>

                        <a
                            href="#plans"
                            className="text-sm font-medium text-[var(--text-soft)] transition hover:text-[var(--text)]"
                        >
                            Tiffin Plans
                        </a>

                        <a
                            href="#zones"
                            className="text-sm font-medium text-[var(--text-soft)] transition hover:text-[var(--text)]"
                        >
                            Delivery Zones
                        </a>
                    </div>

                    <a
                        href={createWaLink('Hi I want today menu')}
                        target="_blank"
                        className="gth-btn-gold hidden rounded-xl px-5 py-2.5 text-sm font-semibold md:inline-flex"
                    >
                        Order on WhatsApp
                    </a>
                </div>
            </header>

            {/* ================= HERO ================= */}
            <section className="relative border-b border-[var(--border)]">
                <div className="absolute inset-0 opacity-[0.03]">
                    <div className="h-full w-full bg-[radial-gradient(circle_at_top,white_0%,transparent_60%)]" />
                </div>

                <div className="mx-auto grid max-w-7xl gap-14 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
                    {/* LEFT */}
                    <div className="relative z-10">
                        <div className="gth-glass inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                            <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
                            Premium Bengali Home Kitchen
                        </div>

                        <h1 className="mt-6 text-balance text-4xl font-black leading-[1.05] sm:text-5xl lg:text-6xl">
                            HOMEMADE BENGALI FOOD DELIVERED IN PALAVA & DOMBIVLI
                        </h1>

                        <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--text-soft)] sm:text-lg">
                            Daily fresh thalis & premium tiffin services with authentic
                            Bengali taste, hygienic home cooking, and hot doorstep delivery.
                        </p>

                        {/* CTA */}
                        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                            <a
                                href={createWaLink('Hi I want today menu')}
                                target="_blank"
                                className="gth-btn-gold animate-wa-pulse inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-bold"
                            >
                                📲 Order Now on WhatsApp
                            </a>

                            <a
                                href="#plans"
                                className="gth-btn inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-semibold"
                            >
                                View Tiffin Plans
                                <ArrowRight className="h-4 w-4" />
                            </a>
                        </div>

                        {/* TRUST */}
                        <div className="mt-10 grid grid-cols-2 gap-3">
                            {TRUST.map((item) => {
                                const Icon = item.icon

                                return (
                                    <div
                                        key={item.title}
                                        className="gth-glass rounded-2xl border border-[var(--border)] p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--card)]">
                                                <Icon className="h-5 w-5 text-[var(--primary)]" />
                                            </div>

                                            <div>
                                                <p className="text-sm font-bold">{item.title}</p>
                                                <p className="text-xs text-[var(--text-soft)]">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-[var(--text-soft)]">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star
                                            key={i}
                                            className="h-4 w-4 fill-[var(--primary)] text-[var(--primary)]"
                                        />
                                    ))}
                                </div>

                                <span>4.9 family rating</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Clock3 className="h-4 w-4 text-[var(--primary)]" />
                                Lunch & Dinner Slots
                            </div>
                        </div>
                    </div>

                    {/* RIGHT HERO VISUAL */}
                    <div className="relative">
                        <div className="gth-glass relative overflow-hidden rounded-[2rem] border border-[var(--border)] p-3">
                            <div className="relative overflow-hidden rounded-[1.5rem]">
                                <Image
                                    src="https://images.unsplash.com/photo-1742281257687-092746ad6021?q=80&w=1400&auto=format&fit=crop"
                                    alt="Premium Bengali Thali"
                                    width={1200}
                                    height={1200}
                                    className="h-[520px] w-full object-cover"
                                    priority
                                />

                                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.55),transparent)]" />

                                {/* Floating labels */}
                                <div className="absolute left-4 top-4 rounded-xl bg-[var(--card)]/90 px-3 py-2 text-xs font-semibold backdrop-blur">
                                    Basmati Rice
                                </div>

                                <div className="absolute right-5 top-20 rounded-xl bg-[var(--card)]/90 px-3 py-2 text-xs font-semibold backdrop-blur">
                                    Dal
                                </div>

                                <div className="absolute bottom-32 left-5 rounded-xl bg-[var(--card)]/90 px-3 py-2 text-xs font-semibold backdrop-blur">
                                    Bhaja
                                </div>

                                <div className="absolute bottom-24 right-5 rounded-xl bg-[var(--card)]/90 px-3 py-2 text-xs font-semibold backdrop-blur">
                                    Chutney & Papad
                                </div>

                                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg)]/85 p-4 backdrop-blur-xl">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">
                                            Today’s Signature
                                        </p>

                                        <h3 className="mt-1 text-lg font-black">
                                            Rohu Macher Jhol Thali
                                        </h3>
                                    </div>

                                    <div className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-black text-[var(--bg)]">
                                        ₹210
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= MENU ================= */}
            <section
                id="menu"
                className="border-b border-[var(--border)] py-16 sm:py-20"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="max-w-3xl">
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
                            Today&apos;s Menu Units
                        </p>

                        <h2 className="mt-4 text-4xl font-black leading-tight">
                            Freshly cooked premium Bengali meals.
                        </h2>

                        <p className="mt-4 text-lg leading-8 text-[var(--text-soft)]">
                            Structured meal combos with authentic home-style preparation,
                            portion clarity, and fast WhatsApp ordering.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                        {MENU.map((item) => (
                            <div
                                key={item.id}
                                className="gth-glass group overflow-hidden rounded-[2rem] border border-[var(--border)]"
                            >
                                <div className="relative overflow-hidden">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        width={1000}
                                        height={1000}
                                        className="h-60 w-full object-cover transition duration-700 group-hover:scale-105"
                                    />

                                    <div className="absolute left-4 top-4 rounded-full bg-[var(--bg)]/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] backdrop-blur">
                                        {item.badge}
                                    </div>

                                    <div className="absolute right-4 top-4 flex items-center gap-1 rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-black text-[var(--bg)]">
                                        <IndianRupee className="h-4 w-4" />
                                        {item.price}
                                    </div>
                                </div>

                                <div className="p-5">
                                    <h3 className="text-xl font-black leading-snug">
                                        {item.name}
                                    </h3>

                                    <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
                                        {item.description}
                                    </p>

                                    <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3">
                                        <p className="text-xs font-medium leading-6 text-[var(--text-soft)]">
                                            ✨ {item.extra}
                                        </p>
                                    </div>

                                    <a
                                        href={createWaLink(
                                            `Hi, I want to order ${item.name} for ₹${item.price}.`
                                        )}
                                        target="_blank"
                                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3.5 text-sm font-bold text-[var(--text)] transition hover:scale-[1.01]"
                                    >
                                        📲 Order This Unit
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================= TIFFIN PLANS ================= */}
            <section
                id="plans"
                className="border-b border-[var(--border)] py-16 sm:py-20"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
                            Monthly Tiffin Plans
                        </p>

                        <h2 className="mt-4 text-balance text-4xl font-black">
                            Daily Bengali meals without daily ordering stress.
                        </h2>

                        <p className="mt-4 text-lg leading-8 text-[var(--text-soft)]">
                            Optimized for working professionals, families, students and
                            long-term healthy meal routines.
                        </p>
                    </div>

                    <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-2">
                        {PLANS.map((plan) => (
                            <div
                                key={plan.name}
                                className={`rounded-[2rem] border p-8 ${plan.highlight
                                        ? 'gth-glass border-[var(--primary)]'
                                        : 'bg-[var(--card)] border-[var(--border)]'
                                    }`}
                            >
                                {plan.highlight && (
                                    <div className="mb-5 inline-flex rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
                                        Most Popular
                                    </div>
                                )}

                                <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-soft)]">
                                    {plan.subtitle}
                                </p>

                                <h3 className="mt-3 text-3xl font-black">{plan.name}</h3>

                                <div className="mt-5 flex items-end gap-2">
                                    <span className="text-5xl font-black">{plan.price}</span>

                                    <span className="pb-1 text-sm text-[var(--text-soft)]">
                                        /month
                                    </span>
                                </div>

                                <div className="mt-8 space-y-4">
                                    {plan.features.map((feature) => (
                                        <div key={feature} className="flex items-start gap-3">
                                            <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--primary)]" />

                                            <span className="text-sm leading-7 text-[var(--text-soft)]">
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <a
                                    href={createWaLink(
                                        `Hi, I want details for ${plan.name} subscription plan.`
                                    )}
                                    target="_blank"
                                    className={`mt-8 inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-sm font-bold ${plan.highlight ? 'gth-btn-gold' : 'gth-btn'
                                        }`}
                                >
                                    Subscribe on WhatsApp
                                </a>
                            </div>
                        ))}
                    </div>

                    <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
                        <p className="text-sm leading-7 text-[var(--text-soft)]">
                            UPI payments accepted upon WhatsApp verification. No hidden
                            delivery charges inside Palava delivery zones.
                        </p>
                    </div>
                </div>
            </section>

            {/* ================= DELIVERY ZONES ================= */}
            <section
                id="zones"
                className="border-b border-[var(--border)] py-16 sm:py-20"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="gth-glass overflow-hidden rounded-[2.5rem] border border-[var(--border)]">
                        <div className="grid gap-10 p-6 md:grid-cols-2 md:p-10">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
                                    Delivery Coverage
                                </p>

                                <h2 className="mt-4 text-4xl font-black leading-tight">
                                    Fresh Bengali meals delivered across Palava.
                                </h2>

                                <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--text-soft)]">
                                    Tight delivery radius ensures faster delivery, better food
                                    temperature retention and consistent quality.
                                </p>

                                <a
                                    href={createWaLink(
                                        'Hi, I want to confirm delivery availability in my society.'
                                    )}
                                    target="_blank"
                                    className="gth-btn-gold mt-8 inline-flex items-center gap-2 rounded-2xl px-6 py-4 font-bold"
                                >
                                    <Phone className="h-5 w-5" />
                                    Check My Address
                                </a>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {ZONES.map((zone) => (
                                    <div
                                        key={zone}
                                        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--bg)]">
                                                <MapPin className="h-5 w-5 text-[var(--primary)]" />
                                            </div>

                                            <div>
                                                <p className="font-bold">{zone}</p>

                                                <p className="text-xs text-[var(--text-soft)]">
                                                    Active delivery zone
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= FINAL CTA ================= */}
            <section className="py-16 sm:py-20">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <div className="gth-glass overflow-hidden rounded-[2.5rem] border border-[var(--border)] p-8 text-center sm:p-14">
                        <div className="mx-auto max-w-3xl">
                            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
                                Ready to order?
                            </p>

                            <h2 className="mt-5 text-balance text-4xl font-black leading-tight sm:text-5xl">
                                Tonight&apos;s Bengali dinner is just one WhatsApp tap away.
                            </h2>

                            <p className="mt-5 text-lg leading-8 text-[var(--text-soft)]">
                                Freshly cooked. Family-style hygiene. Fast local delivery.
                            </p>

                            <a
                                href={createWaLink('Hi I want today menu')}
                                target="_blank"
                                className="gth-btn-gold animate-wa-pulse mt-8 inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-5 text-lg font-black"
                            >
                                📲 Order Now on WhatsApp
                            </a>

                            <p className="mt-5 text-sm text-[var(--text-soft)]">
                                Replies in &lt; 5 mins during meal hours · FSSAI Certified
                                Kitchen
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= FOOTER ================= */}
            <footer className="border-t border-[var(--border)] py-8">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center sm:px-6 md:flex-row md:text-left">
                    <div>
                        <p className="text-sm font-bold">
                            AUTHENTIC BENGALI MEALS
                        </p>

                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--text-soft)]">
                            Dombivli | GTH Pro Certified
                        </p>
                    </div>

                    <p className="text-sm text-[var(--text-soft)]">
                        © {new Date().getFullYear()} · Homemade Bengali Tiffin Service ·
                        Palava & Dombivli East
                    </p>
                </div>
            </footer>

            {/* ================= MOBILE STICKY CTA ================= */}
            <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-[var(--bg)]/95 p-3 backdrop-blur-xl md:hidden">
                <a
                    href={createWaLink('Hi I want today menu')}
                    target="_blank"
                    className="gth-btn-gold animate-wa-pulse flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-black"
                >
                    📲 Order Now on WhatsApp
                </a>
            </div>
        </main>
    )
}