import {estimateRepayment} from "./repayment";
export type OwnershipInputs={price:number;downPayment:number;upfrontCosts:number;annualRate:number;years:number;annualTax:number;annualInsurance:number;monthlyMaintenance:number;monthlyOther:number};
const amount=(n:number)=>Number.isFinite(n)&&n>=0&&n<=1e12;
export function ownershipEstimate(v:OwnershipInputs){
 if(!amount(v.price)||!v.price||![v.downPayment,v.upfrontCosts,v.annualTax,v.annualInsurance,v.monthlyMaintenance,v.monthlyOther].every(amount)||v.downPayment>v.price||!Number.isFinite(v.annualRate)||v.annualRate<0||v.annualRate>40||!Number.isInteger(v.years)||v.years<1||v.years>40)return null;
 const loan=v.price-v.downPayment,repayment=loan?estimateRepayment(loan,v.annualRate,v.years):{monthly:0,total:0,interest:0};
 if(!repayment)return null;
 const recurringMonthly=(v.annualTax+v.annualInsurance)/12+v.monthlyMaintenance+v.monthlyOther;
 const stress=[...new Set([Math.max(0,v.annualRate-1),v.annualRate,Math.min(40,v.annualRate+1)])].map(rate=>({rate,monthly:(loan?estimateRepayment(loan,rate,v.years)!.monthly:0)+recurringMonthly}));
 return {loan,repayment,recurringMonthly,monthlyTotal:repayment.monthly+recurringMonthly,cashRequired:v.downPayment+v.upfrontCosts,stress};
}
export function affordabilityEstimate(budget:number,ongoing:number,deposit:number,rate:number,years:number){
 if(![budget,ongoing,deposit].every(amount)||budget<ongoing)return null;
 const unit=estimateRepayment(1,rate,years);if(!unit)return null;
 const loan=(budget-ongoing)/unit.monthly;
 return Number.isFinite(loan)&&loan+deposit<=1e12?{loan,purchaseBudget:loan+deposit}:null;
}
export function rentalYieldEstimate(price:number,fees:number,rent:number,vacantMonths:number,expenses:number){
 if(![price,fees,rent,expenses].every(amount)||!price||price+fees>1e12||!Number.isFinite(vacantMonths)||vacantMonths<0||vacantMonths>12)return null;
 const grossRent=rent*12,collectedRent=rent*(12-vacantMonths),netIncome=collectedRent-expenses;
 return {grossRent,collectedRent,netIncome,grossYield:grossRent/(price+fees)*100,netYield:netIncome/(price+fees)*100};
}
export function yearlyAmortization(principal:number,rate:number,years:number){
 const estimate=estimateRepayment(principal,rate,years);if(!estimate)return [];
 let balance=principal;const rows:{year:number;principal:number;interest:number;balance:number}[]=[];
 for(let year=1;year<=years;year++){
  let paidPrincipal=0,paidInterest=0;
  for(let month=0;month<12;month++){const interest=balance*rate/1200,paid=Math.min(balance+interest,estimate.monthly);paidPrincipal+=paid-interest;paidInterest+=interest;balance=Math.max(0,balance-(paid-interest));}
  rows.push({year,principal:paidPrincipal,interest:paidInterest,balance:balance<.01?0:balance});
 }
 return rows;
}
