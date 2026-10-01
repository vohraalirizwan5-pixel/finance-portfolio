// Indian number format: 1234567.5 -> ₹12,34,567.50
const inrFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
export const inr = (n) => inrFormatter.format(n || 0);

// Short form for chart axes: 125000 -> ₹1.3L
export function inrShort(n) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(0)}k`;
  return `₹${n}`;
}

// "2025-06" -> "Jun 2025"
export function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
}

// local date as YYYY-MM-DD (toISOString() would use UTC and can show yesterday's date in India before 5:30 AM)
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const currentMonth = () => today().slice(0, 7);
