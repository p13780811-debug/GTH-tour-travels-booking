
export const cityToIata: Record<string, string> = {
  delhi: "DEL",
  mumbai: "BOM",
  goa: "GOI",
  dubai: "DXB",
  bangkok: "BKK",
  kolkata: "CCU",
  chennai: "MAA",
};

export function getIata(city: string) {
  return cityToIata[city.toLowerCase()] || "DEL";
}