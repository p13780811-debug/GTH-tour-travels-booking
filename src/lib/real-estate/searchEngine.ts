export function parseSearch(query: string) {
    if (!query) return {
        city: "",
        type: "",
        minPrice: 0,
        maxPrice: Infinity
    }

    const q = query.toLowerCase()

    let city = ""
    let type = ""
    let minPrice = 0
    let maxPrice = Infinity

    const cities = ["mumbai", "delhi", "kolkata", "bangalore", "pune"]

    for (const c of cities) {
        if (q.includes(c)) city = c
    }

    const priceMatch = q.match(/(\d+)(k|lakh|lac|crore)?/)

    if (priceMatch) {
        let value = Number(priceMatch[1])
        const unit = priceMatch[2]

        if (unit === "k") value *= 1000
        if (unit === "lakh" || unit === "lac") value *= 100000
        if (unit === "crore") value *= 10000000

        if (q.includes("under")) maxPrice = value
        if (q.includes("above")) minPrice = value
    }

    if (q.includes("2bhk")) type = "2bhk"
    if (q.includes("3bhk")) type = "3bhk"
    if (q.includes("villa")) type = "villa"

    return { city, type, minPrice, maxPrice }
}