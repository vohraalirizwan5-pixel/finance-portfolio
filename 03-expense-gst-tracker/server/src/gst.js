// GST rate slabs after the GST 2.0 reform (effective 22 Sep 2025).
// 12% and 28% were removed; 40% applies to luxury / sin goods.
export const GST_RATES = [0, 5, 18, 40];

export const CATEGORIES = [
  'Rent', 'Salaries', 'Inventory', 'Office Supplies', 'Travel', 'Food',
  'Utilities', 'Software', 'Marketing', 'Professional Fees', 'Other',
];

export const PAYMENT_MODES = ['UPI', 'Cash', 'Card', 'Bank Transfer', 'Cheque'];

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Splits an amount into taxable value + GST.
 *  inclusive = false: amount is BEFORE GST (₹1000 @18% -> GST 180, total 1180)
 *  inclusive = true:  amount ALREADY has GST (₹1180 @18% -> taxable 1000, GST 180)
 */
export function calcGst(amount, rate, inclusive = false) {
  const taxable = inclusive ? amount / (1 + rate / 100) : amount;
  const gst = taxable * (rate / 100);
  return {
    taxable: round2(taxable),
    gst_amount: round2(gst),
    total: round2(taxable + gst),
  };
}
