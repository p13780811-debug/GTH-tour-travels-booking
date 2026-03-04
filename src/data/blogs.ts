export interface Blog {
    slug: string
    title: string
    description: string
    image: string
    content: string
}

export const blogs: Blog[] = [
    {
        slug: "best-hotels-in-goa",
        title: "Best Luxury Hotels in Goa (2026 Guide)",
        description: "Discover the top luxury hotels in Goa for beachside comfort and premium experiences.",
        image: "/goa.jpg",
        content: `
Goa is one of India's most popular luxury travel destinations.

Top Areas:
- Baga Beach
- Calangute
- Candolim

Luxury hotels in Goa offer:
- Private beach access
- Infinity pools
- Premium dining
- Nightlife access

Best time to visit: November to February.
`
    },
    {
        slug: "luxury-stay-in-digha",
        title: "Luxury Stay in Digha – Complete Travel Guide",
        description: "Everything you need to know before booking a hotel in Digha.",
        image: "/digha.jpg",
        content: `
Digha is West Bengal’s most loved beach destination.

Top stays:
- Sea View Premium
- Hotel Dolphin

Best time: October to March.
`
    }
]