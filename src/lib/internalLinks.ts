import { destinations } from "@/data/destinations"

export function getRelatedDestinations(currentSlug: string) {

    const filtered = destinations.filter(
        (d: any) => d.slug !== currentSlug
    )

    return filtered.slice(0, 6)

}