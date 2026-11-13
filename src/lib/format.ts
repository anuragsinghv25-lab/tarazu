const full = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const plain = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

/** ₹6,80,000 */
export const inr = (n: number) => (n < 0 ? '−' : '') + full.format(Math.abs(n)).replace('₹', '₹')
/** ₹6.8 L · ₹38.4 K · ₹1.2 Cr */
export function inrShort(n: number) {
  const a = Math.abs(n)
  const s = a >= 1e7 ? `₹${(a / 1e7).toFixed(1)} Cr` : a >= 1e5 ? `₹${(a / 1e5).toFixed(1)} L` : a >= 1e3 ? `₹${(a / 1e3).toFixed(1)} K` : `₹${Math.round(a)}`
  return n < 0 ? `−${s}` : s
}
export const units = (n: number) => plain.format(Math.round(n))
export const pct = (d: number, digits = 0) => `${(d * 100).toFixed(digits)}%`
export const signed = (n: number, f: (n: number) => string = inrShort) => (n > 0 ? '+' : '') + f(n)
