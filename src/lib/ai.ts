export function getBestDeals(tours: any[]) {
    return tours.map(t => ({
        ...t,
        score: (5 - t.price / 1000) + t.rating
    })).sort((a, b) => b.score - a.score)
}