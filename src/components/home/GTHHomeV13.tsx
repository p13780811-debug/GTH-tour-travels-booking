"use client";

import Link from "next/link";
import BrandVideo from "@/components/brand/BrandVideo";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  FileText,
  Globe2,
  Menu,
  Moon,
  Plane,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import styles from "./GTHHomeV13.module.css";

type ThemeMode = "day" | "night";

const portals = [
  {
    id: "real-estate",
    title: "Real Estate",
    eyebrow: "Property Intelligence",
    status: "IN DEVELOPMENT",
    description:
      "AI-assisted property discovery, ranking, pricing intelligence and developer-ready real-estate workflows.",
    href: "/real-estate",
    cta: "Explore Real Estate",
    icon: Building2,
    image: "/dubai.jpg",
  },
  {
    id: "travel",
    title: "Travel",
    eyebrow: "Travel Intelligence",
    status: "DEVELOPMENT BUILD",
    description:
      "Flights, hotels, tours and destination discovery connected through one expanding travel experience.",
    href: "/mega-aggregator",
    cta: "Explore Travel",
    icon: Plane,
    image: "/maldives-bg.jpg",
  },
  {
    id: "tender",
    title: "Tender",
    eyebrow: "Tender Intelligence",
    status: "IN DEVELOPMENT",
    description:
      "A future intelligence layer for tender discovery, structured opportunity analysis and workflow automation.",
    href: "#roadmap",
    cta: "View Roadmap",
    icon: FileText,
    image: "/placeholder.jpg",
  },
] as const;

export default function GTHHomeV13() {
  const [theme, setTheme] = useState<ThemeMode>("night");
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroVideo, setHeroVideo] = useState("/gth-pro-hero-v1.3.mp4");

  useEffect(() => {
    const saved = localStorage.getItem("gth-theme") as ThemeMode | null;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial: ThemeMode =
      saved === "day" || saved === "night" ? saved : systemDark ? "night" : "day";

    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "night");
    document.documentElement.dataset.gthTheme = initial;
  }, []);

  const toggleTheme = () => {
    const next: ThemeMode = theme === "night" ? "day" : "night";
    setTheme(next);
    localStorage.setItem("gth-theme", next);
    document.documentElement.classList.toggle("dark", next === "night");
    document.documentElement.dataset.gthTheme = next;
  };

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="GTH PRO home">
          <span className={styles.brandMain}>GTH</span>
          <span className={styles.brandPro}>PRO</span>
          <span className={styles.brandGlobe} aria-hidden="true">
            <Globe2 size={22} />
          </span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Main navigation">
          <a href="#ecosystem">Ecosystem</a>
          <Link href="/real-estate">Real Estate</Link>
          <Link href="/mega-aggregator">Travel</Link>
          <a href="#roadmap">Tender</a>
          <Link href="/contact">Contact</Link>
        </nav>

        <div className={styles.navActions}>
          <button
            type="button"
            className={styles.themeButton}
            onClick={toggleTheme}
            aria-label={theme === "night" ? "Switch to day mode" : "Switch to night mode"}
          >
            {theme === "night" ? <Sun size={17} /> : <Moon size={17} />}
            <span>{theme === "night" ? "Day" : "Night"}</span>
          </button>

          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <nav className={styles.mobileNav} aria-label="Mobile navigation">
            <a href="#ecosystem" onClick={() => setMenuOpen(false)}>Ecosystem</a>
            <Link href="/real-estate" onClick={() => setMenuOpen(false)}>Real Estate</Link>
            <Link href="/mega-aggregator" onClick={() => setMenuOpen(false)}>Travel</Link>
            <a href="#roadmap" onClick={() => setMenuOpen(false)}>Tender</a>
            <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
          </nav>
        )}
      </header>

      <section className={styles.hero} aria-labelledby="gth-home-title">
        <video
          className={styles.heroVideo}
          src={heroVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/header-earth.jpg"
          aria-label="GTH PRO cinematic ecosystem visual"
          onError={() => {
            if (heroVideo !== "/gth-story-hero.mp4") {
              setHeroVideo("/gth-story-hero.mp4");
            }
          }}
        />

        <div className={styles.videoShade} />
        <div className={styles.videoGrid} aria-hidden="true" />
        <div className={styles.orbitHalo} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.kicker}>
            <Sparkles size={14} />
            <span>GLOBAL TECHNICAL HUB</span>
          </div>

          <h1 id="gth-home-title">
            <span>GTH</span>
            <strong>PRO</strong>
          </h1>

          <p className={styles.heroTagline}>
            ONE INTELLIGENCE ECOSYSTEM
          </p>

          <p className={styles.heroLead}>
            Building the connected foundation for <b>Real Estate</b>, <b>Travel</b> and
            <b> Tender Intelligence</b> through data, automation and AI-assisted discovery.
          </p>

          <div className={styles.heroActions}>
            <a href="#ecosystem" className={styles.primaryCta}>
              Explore Ecosystem <ArrowUpRight size={16} />
            </a>
            <Link href="/real-estate" className={styles.secondaryCta}>
              Real Estate Build
            </Link>
          </div>

          <div className={styles.statusRow} aria-label="Ecosystem development status">
            <span><i /> Real Estate · In Development</span>
            <span><i /> Travel · Development Build</span>
            <span><i /> Tender · In Development</span>
          </div>
        </div>

        <a className={styles.scrollCue} href="#ecosystem" aria-label="Scroll to ecosystem">
          <span>DISCOVER</span>
          <i />
        </a>
      </section>

      <section id="ecosystem" className={styles.ecosystem}>
        <div className={styles.sectionIntro}>
          <span>THE GTH PRO CORE</span>
          <h2>Three industries. One connected intelligence layer.</h2>
          <p>
            Each vertical is being developed as its own focused product while sharing the
            larger GTH PRO vision, design language and automation foundation.
          </p>
        </div>

        <div className={styles.portalGrid}>
          {portals.map((portal) => {
            const Icon = portal.icon;
            const isAnchor = portal.href.startsWith("#");

            const content = (
              <>
                {portal.id === "tender" ? <img src={portal.image} alt="" className={styles.portalImage} /> : <BrandVideo name={portal.id === "travel" ? "travel-story" : "property-story"} className={styles.portalImage} label="AI-generated GTH PRO brand visual" controls={false} />}
                <div className={styles.portalShade} />
                <div className={styles.portalTop}>
                  <span className={styles.portalIcon}><Icon size={20} /></span>
                  <span className={styles.portalStatus}>{portal.status}</span>
                </div>
                <div className={styles.portalBody}>
                  <span className={styles.portalEyebrow}>{portal.eyebrow}</span>
                  <h3>{portal.title}</h3>
                  <p>{portal.description}</p>
                  <span className={styles.portalCta}>
                    {portal.cta} <ArrowUpRight size={15} />
                  </span>
                </div>
              </>
            );

            return isAnchor ? (
              <a key={portal.id} href={portal.href} className={styles.portalCard}>
                {content}
              </a>
            ) : (
              <Link key={portal.id} href={portal.href} className={styles.portalCard}>
                {content}
              </Link>
            );
          })}
        </div>
      </section>

      <section id="roadmap" className={styles.roadmap}>
        <div className={styles.roadmapGlow} aria-hidden="true" />
        <div>
          <span className={styles.roadmapLabel}>CURRENT BUILD ROADMAP</span>
          <h2>Ship the core. Improve continuously.</h2>
          <p>
            Real Estate, Travel and Tender are presented with development-stage labels so the
            public experience stays clear while the ecosystem moves toward production.
          </p>
        </div>
        <Link href="/contact" className={styles.roadmapCta}>
          Connect with GTH PRO <ArrowUpRight size={16} />
        </Link>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <span>GTH PRO</span>
          <small>GLOBAL TECHNICAL HUB</small>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/real-estate">Real Estate</Link>
          <Link href="/mega-aggregator">Travel</Link>
          <a href="#roadmap">Tender</a>
          <Link href="/privacy-policy">Privacy</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <p>© {new Date().getFullYear()} GTH PRO. Ecosystem in active development.</p>
      </footer>
    </main>
  );
}
