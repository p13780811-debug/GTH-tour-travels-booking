export type PortfolioProject = {
 id: string
 title: string
 category: string
 description: string
 href: string
 advertise: boolean
}

// Owner-managed project catalogue shared by the portfolio and sidebar ads.
// Add only owned projects with a real destination; no invented results or badges.
export const portfolioProjects: readonly PortfolioProject[] = [
 {
  id: "thali-treats-palava",
  title: "Thali Treats Palava",
  category: "Food business website",
  description: "Explore the Thali Treats Palava kitchen website.",
  href: "https://thali.gthproglobal.com/",
  advertise: true,
 },
 {
  id: "gth-pro-portfolio",
  title: "GTH PRO Portfolio",
  category: "Our digital portfolio",
  description: "Discover GTH PRO creative work, digital projects and portfolio.",
  href: "https://gth-pro-portfolio.pages.dev/",
  advertise: true,
 },
 {
  id: "gth-real-estate",
  title: "GTH PRO Real Estate",
  category: "Property platform",
  description: "Explore property listings, recorded details and the enquiry journey.",
  href: "/real-estate",
  advertise: false,
 },
]
