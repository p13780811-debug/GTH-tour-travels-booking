export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const term = searchParams.get("term");

    if (!term) return Response.json([]);

    try {
        const res = await fetch(
            `https://autocomplete.travelpayouts.com/places2?term=${term}&locale=en&types[]=city&types[]=airport`,
            {
                headers: {
                    "X-Access-Token": process.env.TRAVELPAYOUTS_TOKEN || "",
                },
                cache: "no-store",
            }
        );

        const data = await res.json();

        return Response.json(data.slice(0, 8)); // limit results
    } catch (err) {
        console.error(err);
        return Response.json([]);
    }
}