export async function getLiveHotels(city = "Dubai") {

    const url = `https://engine.hotellook.com/api/v2/cache.json?location=${city}&limit=20&currency=usd&token=YOUR_TOKEN`

    const res = await fetch(url, { cache: "no-store" })

    const data = await res.json()

    return data
}