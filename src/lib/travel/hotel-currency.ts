export const HOTEL_CURRENCY_OPTIONS = [
  {code:"INR",name:"Indian Rupee"},{code:"USD",name:"US Dollar"},
  {code:"EUR",name:"Euro"},{code:"GBP",name:"British Pound"},
  {code:"AED",name:"UAE Dirham"},{code:"SGD",name:"Singapore Dollar"},
  {code:"AUD",name:"Australian Dollar"},{code:"CAD",name:"Canadian Dollar"},
  {code:"JPY",name:"Japanese Yen"},
] as const;
export function hotelCurrency(value:unknown):string{
  return typeof value==="string"&&HOTEL_CURRENCY_OPTIONS.some(item=>item.code===value)?value:"INR";
}
