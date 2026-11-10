export function askingPriceChange(amount: unknown, previous: unknown) {
  const read = (value: unknown) => typeof value === "number" || (typeof value === "string" && /^\d+(?:\.\d{1,2})?$/.test(value)) ? Number(value) : NaN
  // Source amounts are stored to two decimal places. Compare integer minor units.
  const current = Math.round(read(amount) * 100)
  const prior = Math.round(read(previous) * 100)
  if (!Number.isSafeInteger(current) || !Number.isSafeInteger(prior) || current <= 0 || prior <= 0) return null
  const cents = current - prior
  return { amount: cents / 100, ratio: cents / prior }
}
