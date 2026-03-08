export const fetchGTHData = async (query: string) => {
    try {
        const token = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_API_TOKEN;
        const marker = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER;

        // NAYA URL: Travelpayouts Hotel Search API v2/v3 logic
        // Hum 'engine' endpoint use kar rahe hain jo sabhi programs ko aggregate karta hai
        const response = await fetch(
            `https://api.travelpayouts.com/v1/search_hotels_by_location?name=${query}&marker=${marker}&token=${token}`,
            {
                method: 'GET',
                headers: { 'Accept-Encoding': 'gzip' },
                next: { revalidate: 3600 }
            }
        );

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Travelpayouts API Status:", response.status);
            throw new Error(`Connection Error: ${response.status}`);
        }

        const data = await response.json();

        // Data mapping for your UI
        return (data.hotels || data).map((item: any) => ({
            id: item.id || Math.random().toString(36),
            name: item.name || item.label,
            description: `Luxury stay in ${query}`,
            partner_link: `https://search.hotellook.com/?marker=${marker}&destination=${query}`,
            price: item.price || 'Check Live',
            currency: 'INR'
        }));

    } catch (error) {
        console.error("GTH Aggregator Error:", error);
        return [];
    }
};