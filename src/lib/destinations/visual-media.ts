/** Local editorial service illustrations, not product photographs. No external image lookup. */
const media:Readonly<Record<string,string>>={
 hotels:"/images/mega/hotels.jpg","list-hotel":"/images/mega/hotels.jpg",flights:"/images/mega/flights.jpg",packages:"/images/travel.jpg",tours:"/images/mega/tours.jpg",activities:"/images/mega/tours.jpg",attractions:"/images/mega/tours.jpg",stadiums:"/images/travel.jpg",tickets:"/images/travel.jpg",transfers:"/images/mega/transfers.jpg",cars:"/images/mega/transfers.jpg",bus:"/images/mega/transfers.jpg",train:"/images/travel.jpg",guides:"/images/travel.jpg",blog:"/images/travel.jpg",properties:"/images/real-estate.jpg","post-property":"/images/real-estate.jpg",tenders:"/images/tender.jpg","tender-assistant":"/images/tender.jpg"
};
export function destinationServicePhoto(key:string):string{return Object.prototype.hasOwnProperty.call(media,key)?media[key]:"/images/travel.jpg";}
