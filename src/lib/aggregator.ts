// GTH PRO API Aggregator - Advanced Version
export const fetchGTHData = async (query: string) => {
    try {
        const marker = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER;
        const token = process.env.TRAVELPAYOUTS_API_TOKEN;
        const socialFund = process.env.NEXT_PUBLIC_SOCIAL_FUND_PERCENT || "1";

        // Yahan hum multiple programs ko parallel fetch kar sakte hain
        const response = await fetch(
            `https://api.travelpayouts.com/v1/search?query=${query}&marker=${marker}`,
            {
                headers: { 'Authorization': `Bearer ${token}` },
                next: { revalidate: 3600 } // Data 1 ghante tak cache rahega (Fast speed!)
            }
        );

        if (!response.ok) throw new Error('API Connection Failed');

        const data = await response.json();

        // Data mapping with 1% Social Mission Lock
        return (data.results || data).map((item: any) => ({
            id: item.id || Math.random().toString(36),
            name: item.name || item.title,
            description: item.description || `Luxury deals in ${query}`,
            // Har link mein 1% education fund ka logic automatic add hota hai
            partner_link: `${item.link || item.url}?marker=${marker}&subid=edu${socialFund}percent`,
            price: item.price || 'Check Live',
            currency: item.currency || 'USD'
        }));
    } catch (error) {
        console.error("GTH Aggregator Error:", error);
        return []; // Error aane par empty array bhejega taaki site crash na ho
    }
};