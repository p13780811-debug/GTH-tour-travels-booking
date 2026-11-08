/**
 * Curated, source-backed examples of real named hotels. They are editorial guides,
 * NOT a booking supplier feed or a guarantee these properties are on Nuitee.
 * Photo: authentic hotel image from a documented Wikimedia Commons file page.
 * Keep photographer attribution, file page and license link beside every photo.
 * Never map unrelated OSM IDs to these examples or claim current prices/rooms.
 */
type SourcePhoto={file:string;author:string;license:string;licenseUrl:string};
type Example={name:string;city:string;country:string;description:string;photo:SourcePhoto|null};
const CC3="https://creativecommons.org/licenses/by-sa/3.0/";
const CC4="https://creativecommons.org/licenses/by-sa/4.0/";
const PD="https://creativecommons.org/publicdomain/mark/1.0/";
const CC0="https://creativecommons.org/publicdomain/zero/1.0/";

export const HOTEL_EDITORIAL_EXAMPLES:Record<string,Example>={
  mumbai:{name:"The Taj Mahal Palace",city:"Mumbai",country:"India",description:"A landmark hotel overlooking Mumbai's historic waterfront near the Gateway of India.",photo:{file:"Taj Mahal Palace Hotel.jpg",author:"Joe Ravi",license:"CC BY-SA 3.0",licenseUrl:CC3}},
  kolkata:{name:"The Oberoi Grand",city:"Kolkata",country:"India",description:"A heritage hotel on Jawaharlal Nehru Road near Kolkata's Esplanade district.",photo:{file:"Kolkata Grand Hotel.jpg",author:"P.K.Niyogi",license:"CC BY-SA 3.0",licenseUrl:CC3}},
  delhi:{name:"The Imperial, New Delhi",city:"New Delhi",country:"India",description:"An Art Deco-era hotel close to the central Connaught Place area.",photo:{file:"The Imperial, New Delhi.jpg",author:"RndmCrs",license:"CC0",licenseUrl:CC0}},
  chennai:{name:"ITC Grand Chola",city:"Chennai",country:"India",description:"A major hotel building in Chennai's Guindy district.",photo:{file:"ITC-Grand-Chola-Chennai-1.JPG",author:"Destination8infinity",license:"CC BY-SA 3.0",licenseUrl:CC3}},
  hyderabad:{name:"Taj Krishna",city:"Hyderabad",country:"India",description:"A hotel in Hyderabad's Banjara Hills area.",photo:{file:"Taj Krishna hotel in hyderabad.jpg",author:"Sajeev0101",license:"CC BY-SA (see file)",licenseUrl:CC4}},
  ahmedabad:{name:"Fortune Landmark Hotel",city:"Ahmedabad",country:"India",description:"A hotel in Ahmedabad, included as a public-reference accommodation example.",photo:{file:"Fortune Landmark Hotel in Ahmedabad - panoramio.jpg",author:"Helfmann",license:"CC BY-SA 3.0",licenseUrl:CC3}},
  london:{name:"The Savoy",city:"London",country:"United Kingdom",description:"A landmark hotel on the Strand in central London.",photo:{file:"Hôtel Savoy Londres.jpg",author:"CVB",license:"CC BY-SA 4.0",licenseUrl:CC4}},
  paris:{name:"Hôtel Ritz Paris",city:"Paris",country:"France",description:"A historic hotel at Place Vendôme in central Paris.",photo:{file:"Hotel Ritz Paris.jpg",author:"Vlastula",license:"Public domain",licenseUrl:PD}},
  "new-york":{name:"The Plaza Hotel",city:"New York",country:"United States",description:"A historic hotel facing Central Park in Manhattan.",photo:{file:"The Plaza Hotel.JPG",author:"David Shankbone",license:"CC BY-SA (see file)",licenseUrl:CC3}},
  dubai:{name:"Burj Al Arab",city:"Dubai",country:"United Arab Emirates",description:"A landmark hotel in Dubai, shown as an editorial example, not an authenticated supplier listing.",photo:null},
  singapore:{name:"Raffles Hotel",city:"Singapore",country:"Singapore",description:"A historic colonial-era hotel in central Singapore.",photo:{file:"Raffles Hotel in Singapore.jpg",author:"Edogang1",license:"CC0",licenseUrl:CC0}},
  tokyo:{name:"Imperial Hotel Tokyo",city:"Tokyo",country:"Japan",description:"A well-known hotel in central Tokyo, close to Hibiya.",photo:{file:"Imperial Hotel, Tokyo.jpg",author:"Ons",license:"CC BY-SA 2.5",licenseUrl:"https://creativecommons.org/licenses/by-sa/2.5/"}},
  bangkok:{name:"Mandarin Oriental, Bangkok",city:"Bangkok",country:"Thailand",description:"A riverside hotel in Bangkok also known historically as The Oriental.",photo:{file:"Hotel The Oriental Bangkok.JPG",author:"Hajotthu",license:"CC / GFDL (see file)",licenseUrl:CC3}},
  rome:{name:"Hotel de Russie",city:"Rome",country:"Italy",description:"A historic hotel on Via del Babuino in Rome.",photo:{file:"Campo Marzio - Hotel de Russie 1.JPG",author:"Croberto68",license:"Public domain",licenseUrl:PD}},
};

export function getHotelEditorialExample(slug:string):Example|null{
  return Object.prototype.hasOwnProperty.call(HOTEL_EDITORIAL_EXAMPLES,slug)
    ? HOTEL_EDITORIAL_EXAMPLES[slug] : null;
}
/** No external image API, thumbnails are Wikimedia-managed and keep file attribution.
 * This file URL is a redirect to the Commons licensed original/thumbnail.
 */
export function editorialPhotoUrl(photo:SourcePhoto):string{
  return "https://commons.wikimedia.org/wiki/Special:FilePath/"+
    encodeURIComponent(photo.file)+"?width=640";
}
export function editorialPhotoSource(photo:SourcePhoto):string{
  return "https://commons.wikimedia.org/wiki/File:"+encodeURIComponent(photo.file.replaceAll(" ","_"));
}
