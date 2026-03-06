export async function getHotels(cityCode: string) {
    const res = await fetch(
        `https://api.travelpayouts.com/v1/hotels/search?city=${cityCode}`,
        {
            headers: {
                "X-Access-Token": process.env.TRAVELPAYOUTS_TOKEN!,
            },
        }
    )

    return res.json()
}