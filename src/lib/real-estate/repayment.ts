export function estimateRepayment(principal:number, annualRate:number, years:number) {
 if (!Number.isFinite(principal) || principal <= 0 || principal > 1e12 || !Number.isFinite(annualRate) || annualRate < 0 || annualRate > 40 || !Number.isInteger(years) || years < 1 || years > 40) return null
 const months = years * 12
 const rate = annualRate / 1200
 const monthly = rate === 0 ? principal / months : principal * rate / -Math.expm1(-months * Math.log1p(rate))
 return { monthly, total:monthly * months, interest: monthly * months - principal }
}
