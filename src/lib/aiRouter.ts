// src/lib/aiRouter.ts

export function detectMode(message: string) {
    const q = message.toLowerCase()

    // 🏠 REAL ESTATE
    if (
        q.includes("1bhk") ||
        q.includes("1rk") ||
        q.includes("2bhk") ||
        q.includes("3bhk") ||
        q.includes("4bhk") ||
        q.includes("plot") ||
        q.includes("land") ||
        q.includes("house") ||
        q.includes(" apartment") ||
        q.includes("residential") ||
        q.includes("commercial") ||
        q.includes("villa") ||
        q.includes("property") ||
        q.includes("flat") ||
        q.includes("buy home")
    ) {
        return "real_estate"
    }

    // ✈️ TRAVEL
    if (
        q.includes("trip") ||
        q.includes("travel") ||
        q.includes("flight") ||
        q.includes("train") ||
        q.includes("bus") ||
        q.includes("car") ||
        q.includes("rental") ||
        q.includes("hotel") ||
        q.includes("tour") ||
        q.includes("booking") ||
        q.includes("cruise") ||
        q.includes("itinerary") ||
        q.includes("vacation")
    ) {
        return "travel"
    }

    return "general"
}