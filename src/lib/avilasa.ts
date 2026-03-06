export async function getTours(destination: string) {
    const res = await fetch(
        `https://api.avilasa.com/v1/tours?destination=${destination}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.AVILASA_TOKEN}`,
            },
        }
    )

    return res.json()
}