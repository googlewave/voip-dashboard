export const MONTHLY_PLAN_PRICE = 8.95;
export const ANNUAL_PLAN_PRICE = 96.66;
export const ANNUAL_MONTHLY_EQUIVALENT = 8.06;

export function getPlanPriceLabel(plan: 'monthly' | 'annual') {
  return plan === 'annual' ? `$${ANNUAL_PLAN_PRICE.toFixed(2)}/year` : `$${MONTHLY_PLAN_PRICE.toFixed(2)}/month`;
}