/**
 * Source: Nuitee Connect /v3.0/data/hotels countryCode=MV, inspected
 * 2026-11-20. Real supplier hotel IDs/photos/metadata, NOT fabricated
 * property cards or confirmed live room rates. No paid Places lookup.
 * Use the supplier's hotel-level /hotels/{hotelId} deep link for bookings.
 */
export type VerifiedMaldivesHotel = Readonly<{
  id:string;name:string;area:string;photo:string;
  stars:number;rating:number;reviews:number;
}>;

export const VERIFIED_MALDIVES_HOTELS:readonly VerifiedMaldivesHotel[]=[
  {id:"lp39ce1",name:"Baros Maldives",area:"North Malé Atoll",
    photo:"https://static.cupid.travel/hotels/440909107.jpg",stars:5,rating:9.7,reviews:451},
  {id:"lp685b0",name:"Sun Siyam Olhuveli",area:"South Malé Atoll",
    photo:"https://static.cupid.travel/hotels/190196558.jpg",stars:4,rating:9.4,reviews:3647},
  {id:"lp65576992",name:"Hilton Maldives Amingiri Resort & Spa",area:"North Malé Atoll",
    photo:"https://static.cupid.travel/hotels/482598600.jpg",stars:5,rating:9.8,reviews:452},
  {id:"lp1c5085",name:"Waldorf Astoria Maldives Ithaafushi",area:"South Malé Atoll",
    photo:"https://static.cupid.travel/hotels/483820519.jpg",stars:5,rating:9.6,reviews:61},
  {id:"lp5236e",name:"Anantara Kihavah Maldives Villas",area:"Baa Atoll",
    photo:"https://static.cupid.travel/hotels/164629881.jpg",stars:5,rating:9.8,reviews:85},
  {id:"lpab022",name:"Vakkaru Maldives - Luxury Private Island Resort",area:"Baa Atoll",
    photo:"https://static.cupid.travel/hotels/545696431.jpg",stars:5,rating:9.7,reviews:123},
  {id:"lp597e5",name:"Constance Moofushi Maldives - All Inclusive",area:"Ari Atoll · Himandhoo",
    photo:"https://static.cupid.travel/hotels/425769492.jpg",stars:5,rating:9.7,reviews:312},
  {id:"lp4b8b8",name:"W Maldives",area:"Ari Atoll · Fesdu Island",
    photo:"https://static.cupid.travel/hotels/465571064.jpg",stars:5,rating:9.6,reviews:199},
  {id:"lp22064",name:"Conrad Maldives Rangali Island",area:"South Ari Atoll · Mandhoo",
    photo:"https://static.cupid.travel/hotels/612346435.jpg",stars:5,rating:9.2,reviews:57},
  {id:"lp18275d",name:"Samann Grand",area:"Malé City",
    photo:"https://static.cupid.travel/hotels/167739721.jpg",stars:4,rating:9.4,reviews:2685},
  {id:"lp36afa",name:"Kurumba Maldives",area:"North Malé Atoll · Vihamanafushi",
    photo:"https://static.cupid.travel/hotels/ex_8d29e390_z.jpg",stars:5,rating:9.4,reviews:116},
  {id:"lp97ed4",name:"Four Seasons Resort Maldives at Kuda Huraa",area:"North Malé Atoll",
    photo:"https://www.fourseasons.com/alt/img-opt/~75.430.609,7742-0,0000-2249,3333-1687,0000/publish/content/dam/fourseasons/images/web/MAL/MAL_1645_original.jpg",stars:5,rating:9.4,reviews:136},
] as const;

const HOTEL_ID = /^lp[a-f0-9]{4,12}$/i;
export function verifiedMaldivesHotel(id:unknown):VerifiedMaldivesHotel|null {
  return typeof id==="string" && HOTEL_ID.test(id)
    ? VERIFIED_MALDIVES_HOTELS.find(item=>item.id===id)??null : null;
}
