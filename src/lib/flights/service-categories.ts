/** Shared labels and existing service routes for flight journey navigation. */
export const flightServiceCategories = [
  {
    group: "Flight protection",
    title: "Flight protection",
    tagline: "Insurance & delay claims",
    page: "/insurance", action: "Explore insurance",
    image: "/images/mega/airhelp.jpg",
  },
  {
    group: "Airport transfers",
    title: "Airport transfers",
    tagline: "Pickup & drop-off services",
    page: "/transfers", action: "Explore airport transfers",
    image: "/images/mega/transfers.jpg",
  },
  {
    group: "Car rentals",
    title: "Car rentals",
    tagline: "Self-drive options",
    page: "/cars", action: "Explore car rentals",
    image: "/images/mega/tripcom.jpg",
  },
  {
    group: "Airport essentials",
    title: "Airport extras",
    tagline: "eSIM & luggage storage",
    page: "/transfers", action: "Explore airport extras",
    image: "/images/cities/singapore.jpg",
  },
  {
    group: "At destination",
    title: "Tours & experiences",
    tagline: "See more after landing",
    page: "/tours", action: "Explore tours",
    image: "/images/mega/tours.jpg",
  },
] as const;

