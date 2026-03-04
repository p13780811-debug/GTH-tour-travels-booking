export interface Hotel {
    name: string
    price: string
}

export interface Guide {
    name: string
    experience: string
}

export interface Destination {
    slug: string
    name: string
    description: string
    heroImage: string
    featuredHotel: {
        name: string
        location: string
        price: string
        whatsapp: string
    }
    hotels: Hotel[]
    guides: Guide[]
}

export const destinations: Destination[] = [
    {
        slug: "digha",
        name: "Digha",
        description: "Digha is one of the most popular beach destinations in West Bengal.",
        heroImage: "/digha.jpg",
        featuredHotel: {
            name: "Sea View Premium Stay",
            location: "New Digha",
            price: "₹2500 / night",
            whatsapp: "919339952669"
        },
        hotels: [
            { name: "Hotel Dolphin", price: "₹1800 / night" },
            { name: "Hotel Blue Wave", price: "₹2200 / night" }
        ],
        guides: [
            { name: "Raju Guide", experience: "5 years experience" }
        ]
    },

    {
        slug: "goa",
        name: "Goa",
        description: "Goa is India’s most famous beach destination known for nightlife and luxury resorts.",
        heroImage: "/goa.jpg",
        featuredHotel: {
            name: "Royal Beach Resort",
            location: "Baga Beach",
            price: "₹6500 / night",
            whatsapp: "919339952669"
        },
        hotels: [
            { name: "Ocean Pearl Goa", price: "₹5200 / night" },
            { name: "Sunset Bay Resort", price: "₹4800 / night" }
        ],
        guides: [
            { name: "Anthony Fernandes", experience: "8 years experience" }
        ]
    },

    {
        slug: "darjeeling",
        name: "Darjeeling",
        description: "Darjeeling is a scenic hill station famous for tea gardens and Himalayan views.",
        heroImage: "/darjeeling.jpg",
        featuredHotel: {
            name: "Himalayan Crown Hotel",
            location: "Mall Road",
            price: "₹4200 / night",
            whatsapp: "919339952669"
        },
        hotels: [
            { name: "Snow View Lodge", price: "₹3500 / night" },
            { name: "Tea Garden Retreat", price: "₹3900 / night" }
        ],
        guides: [
            { name: "Sonam Sherpa", experience: "6 years experience" }
        ]
    },

    {
        slug: "manali",
        name: "Manali",
        description: "Manali is a popular mountain destination known for adventure sports and snow views.",
        heroImage: "/manali.jpg",
        featuredHotel: {
            name: "Alpine Luxury Stay",
            location: "Old Manali",
            price: "₹5000 / night",
            whatsapp: "919339952669"
        },
        hotels: [
            { name: "Snow Peak Resort", price: "₹4500 / night" },
            { name: "River View Inn", price: "₹4000 / night" }
        ],
        guides: [
            { name: "Vikram Thakur", experience: "7 years experience" }
        ]
    },

    {
        slug: "jaipur",
        name: "Jaipur",
        description: "Jaipur, the Pink City, is known for royal palaces and heritage luxury hotels.",
        heroImage: "/jaipur.jpg",
        featuredHotel: {
            name: "Royal Palace Heritage Hotel",
            location: "City Palace Area",
            price: "₹7000 / night",
            whatsapp: "919339952669"
        },
        hotels: [
            { name: "Amber Fort Residency", price: "₹5200 / night" },
            { name: "Pink City Haveli", price: "₹4800 / night" }
        ],
        guides: [
            { name: "Rajesh Sharma", experience: "10 years experience" }
        ]
    },

    {
        slug: "dubai",
        name: "Dubai",
        description: "Dubai is a global luxury destination known for skyscrapers and ultra premium resorts.",
        heroImage: "/dubai.jpg",
        featuredHotel: {
            name: "Golden Sands Luxury Tower",
            location: "Downtown Dubai",
            price: "₹12000 / night",
            whatsapp: "919339952669"
        },
        hotels: [
            { name: "Palm Island Resort", price: "₹15000 / night" },
            { name: "Desert Crown Hotel", price: "₹9800 / night" }
        ],
        guides: [
            { name: "Ahmed Al Noor", experience: "9 years experience" }
        ]
    }
]