/** Editorial destination country labels -> ISO codes for OSM source filtering.
 * Only known mappings are used; never infer country from a place name alone.
 */
const CODES:Readonly<Record<string,string>>={
 "India":"IN","United Arab Emirates":"AE","France":"FR","Indonesia":"ID",
 "Thailand":"TH","Singapore":"SG","Japan":"JP","United Kingdom":"GB",
 "United States":"US","United States of America":"US","Maldives":"MV",
 "Sri Lanka":"LK","China":"CN","Hungary":"HU","South Africa":"ZA",
 "Denmark":"DK","Ireland":"IE","Switzerland":"CH","Vietnam":"VN",
 "Finland":"FI","South Korea":"KR","Taiwan":"TW","Netherlands":"NL",
 "Spain":"ES","Greece":"GR","Poland":"PL","Canada":"CA","Nepal":"NP",
 "Malaysia":"MY","Philippines":"PH","Norway":"NO","Portugal":"PT",
 "Czechia":"CZ","Austria":"AT","Sweden":"SE","Italy":"IT",
};
export function countryCodeForDestinationName(country:string|null|undefined){
 return country?CODES[country]??null:null;
}
