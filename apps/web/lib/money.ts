/**
 * Storefront price formatting: "₹320" for whole rupees, "₹320.50" otherwise, the way
 * Indian shoppers expect to read prices. (The ERP keeps the two-decimal `formatMoney`
 * from `@sweets/api-client`.)
 */
export function formatMoney(amount: string | number, currency = 'INR', locale = 'en-IN') {
  const n = Number(amount);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}
