import { faker } from "@faker-js/faker";

export function generateAIPropertyDescription(title: string, city: string) {
    return `Experience luxury living at ${title} located in the heart of ${city}. 
  Designed for modern lifestyle with premium amenities, smart home features, 
  and world-class architecture. Ideal for families and investors looking for high ROI.`;
}

export function generateSEOKeywords(city: string) {
    return [
        `${city} luxury apartments`,
        `${city} real estate`,
        `buy property in ${city}`,
        `${city} villas for sale`
    ];
}