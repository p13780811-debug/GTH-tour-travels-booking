export function calculateEmi(principal: number, years: number, annualRate: number) {
  if (![principal, years, annualRate].every(Number.isFinite) || principal < 100000 || principal > 100000000 || !Number.isInteger(years) || years < 1 || years > 30 || annualRate < 0 || annualRate > 20) return null
  const months = years * 12, monthlyRate = annualRate / 1200
  const monthly = monthlyRate === 0 ? principal / months : principal * monthlyRate * (1 + 1 / Math.expm1(months * Math.log1p(monthlyRate)))
  return { monthly, total: monthly * months, interest: monthly * months - principal, months }
}
export function homeLoanReferral(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null
  try { const u = new URL(value); if (u.protocol !== "https:" || u.username || u.password || u.port || !u.hostname.includes(".") || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname) || u.hostname.endsWith(".localhost") || u.hostname.endsWith(".local")) return null; return u.toString() } catch { return null }
}
