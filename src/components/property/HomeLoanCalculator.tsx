"use client"
import { useId, useState } from "react"
import { ArrowUpRight, Calculator } from "lucide-react"
import { calculateEmi, homeLoanReferral } from "@/lib/real-estate/emi"
import styles from "./PropertyUpgrade.module.css"
const money = (value: number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(value)
export default function HomeLoanCalculator() {
  const [amount, setAmount] = useState(5000000), [years, setYears] = useState(20), [rate, setRate] = useState(8.5), id = useId()
  const estimate = calculateEmi(amount,years,rate), referral = homeLoanReferral(process.env.NEXT_PUBLIC_HOME_LOAN_AFFILIATE_URL)
  return <section className={styles.calculator} aria-labelledby={`${id}-title`}><Calculator size={23} className="gold-text" /><p className={`${styles.eyebrow} mt-3`}>PLAN THE NUMBERS</p><h2 id={`${id}-title`}>Your monthly EMI, explored.</h2><p className={styles.note}>An illustration using the amount, tenure and rate you choose. Your inputs stay on this device.</p>
    <label htmlFor={`${id}-amount`}>Loan amount<output>{money(amount)}</output></label><input id={`${id}-amount`} aria-label="Loan amount" type="range" min={100000} max={100000000} step={100000} value={amount} onChange={event => setAmount(Number(event.target.value))} aria-valuetext={money(amount)} />
    <label htmlFor={`${id}-years`}>Tenure<output>{years} years</output></label><input id={`${id}-years`} aria-label="Loan tenure" type="range" min={1} max={30} value={years} onChange={event => setYears(Number(event.target.value))} aria-valuetext={`${years} years`} />
    <label htmlFor={`${id}-rate`}>Annual interest rate<output>{rate.toFixed(2)}%</output></label><input id={`${id}-rate`} aria-label="Annual interest rate" type="range" min={0} max={20} step={0.05} value={rate} onChange={event => setRate(Number(event.target.value))} aria-valuetext={`${rate.toFixed(2)} percent`} />
    {estimate && <div className={styles.emi} aria-live="polite"><span>Illustrative monthly repayment</span><strong>{money(estimate.monthly)}</strong><dl><div><dt>Total interest</dt><dd>{money(estimate.interest)}</dd></div><div><dt>Total repayment</dt><dd>{money(estimate.total)}</dd></div></dl></div>}
    <p className={styles.note}>This is not a lender quote or a credit approval. It assumes a fixed rate and excludes fees, insurance and taxes.</p>
    {referral && <><a className={styles.affiliate} href={referral} target="_blank" rel="sponsored noopener noreferrer">Explore lender offers<ArrowUpRight size={15} /></a><p className={`${styles.note} mt-2`}>Affiliate link: GTH PRO may earn a referral fee. Eligibility and terms are decided by the lender.</p></>}
  </section>
}
