export const AREA_UNITS = { sqft: { label: "Square feet", factor: 1 }, sqm: { label: "Square metres", factor: 10.7639104167 }, sqyd: { label: "Square yards", factor: 9 }, acre: { label: "Acres", factor: 43560 } } as const
export type AreaUnit = keyof typeof AREA_UNITS
export function convertArea(value: number, from: AreaUnit, to: AreaUnit) {
  if (!Number.isFinite(value) || value <= 0 || value > 1e9 || !AREA_UNITS[from] || !AREA_UNITS[to]) return null
  return value * AREA_UNITS[from].factor / AREA_UNITS[to].factor
}
/** Area basis is not a unit. Use only a buyer-supplied documented efficiency. */
export function estimateAreaBasis(value: number, basis: "carpet" | "built_up", efficiency: number) {
  if (!Number.isFinite(value) || value <= 0 || value > 1e9 || !Number.isFinite(efficiency) || efficiency <= 0 || efficiency > 100) return null
  return basis === "carpet" ? value / (efficiency / 100) : value * efficiency / 100
}
