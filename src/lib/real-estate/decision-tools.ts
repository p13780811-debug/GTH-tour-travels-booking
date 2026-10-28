import {estimateRepayment} from "./repayment";

const amount=(n:number)=>Number.isFinite(n)&&n>=0&&n<=1e12;
const rate=(n:number,min=0,max=40)=>Number.isFinite(n)&&n>=min&&n<=max;
const term=(n:number)=>Number.isInteger(n)&&n>=1&&n<=40;
export type RentBuyInput={price:number;down:number;buyingFees:number;annualRate:number;loanYears:number;monthlyRent:number;annualRentGrowth:number;monthlyOwnerCosts:number;annualAppreciation:number;annualInvestmentReturn:number;sellingPercent:number;years:number};
/** Equal monthly cash budgets; each household invests its unused cash. No market/tax data inferred. */
export function compareRentBuy(v:RentBuyInput){
 if(![v.price,v.down,v.buyingFees,v.monthlyRent,v.monthlyOwnerCosts].every(amount)||v.price<=0||v.down>v.price||!rate(v.annualRate)||!rate(v.annualRentGrowth,0,30)||!rate(v.annualAppreciation,-20,30)||!rate(v.annualInvestmentReturn,-20,30)||!rate(v.sellingPercent,0,30)||!term(v.loanYears)||!term(v.years))return null;
 const loan=v.price-v.down;
 const repayment=loan?estimateRepayment(loan,v.annualRate,v.loanYears):null;
 if(loan&&!repayment)return null;
 const monthly=repayment?.monthly||0,interestRate=v.annualRate/1200;
 const investmentRate=Math.pow(1+v.annualInvestmentReturn/100,1/12)-1;
 let balance=loan,buyerSavings=0,renterSavings=v.down+v.buyingFees,totalOwnerOutflow=v.down+v.buyingFees,totalRent=0;
 const rows:{year:number;homeValue:number;loanBalance:number;buyerWealth:number;renterWealth:number;difference:number}[]=[];
 for(let month=1;month<=v.years*12;month++){
  const payment=balance>0?Math.min(monthly,balance*(1+interestRate)):0;
  balance=Math.max(0,balance*(1+interestRate)-payment);
  if(balance<0.01)balance=0;
  const rent=v.monthlyRent*Math.pow(1+v.annualRentGrowth/100,Math.floor((month-1)/12));
  const ownerCost=payment+v.monthlyOwnerCosts;
  buyerSavings=buyerSavings*(1+investmentRate)+Math.max(0,rent-ownerCost);
  renterSavings=renterSavings*(1+investmentRate)+Math.max(0,ownerCost-rent);
  totalOwnerOutflow+=ownerCost;totalRent+=rent;
  if(month%12===0){const homeValue=v.price*Math.pow(1+v.annualAppreciation/100,month/12),buyerWealth=homeValue*(1-v.sellingPercent/100)-balance+buyerSavings;rows.push({year:month/12,homeValue,loanBalance:balance,buyerWealth,renterWealth:renterSavings,difference:buyerWealth-renterSavings});}
 }
 return {rows,monthlyRepayment:monthly,totalOwnerOutflow,totalRent,firstOwnershipLeadYear:rows.find(row=>row.difference>=0)?.year??null};
}
export function prepaymentScenario(principal:number,annualRate:number,years:number,extraMonthly:number,lumpSum:number){
 if(!amount(principal)||principal<=0||!rate(annualRate)||!term(years)||!amount(extraMonthly)||!amount(lumpSum)||lumpSum>principal)return null;
 const baseline=estimateRepayment(principal,annualRate,years);if(!baseline)return null;
 let balance=principal-lumpSum,interest=0,months=0;
 while(balance>0.005&&months<years*12){const charge=balance*annualRate/1200;interest+=charge;balance=Math.max(0,balance+charge-baseline.monthly-extraMonthly);months++;}
 return {monthlyRepayment:baseline.monthly,months,monthsSaved:years*12-months,interest,interestSaved:Math.max(0,baseline.interest-interest),remainingBalance:balance};
}
export function saleProceeds(price:number,outstandingLoan:number,sellingCosts:number,taxes:number){
 if(![price,outstandingLoan,sellingCosts,taxes].every(amount)||price<=0)return null;
 return {net:price-outstandingLoan-sellingCosts-taxes,deductions:outstandingLoan+sellingCosts+taxes};
}
