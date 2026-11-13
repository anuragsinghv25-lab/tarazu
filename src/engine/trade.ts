import type { TradeData, TradeLine } from '@/data/sellers/types'

export const MECHANISM: Record<TradeLine['mechanism'], { label: string; note: string }> = {
  'off-invoice': { label: 'Off-invoice', note: 'Discount taken off the invoice when stock ships to the distributor or retailer, whether or not shoppers buy it.' },
  'scan-based': { label: 'Scan-based', note: 'Paid per unit actually scanned at the till, so it only pays for real shopper sales.' },
  'bill-back': { label: 'Bill-back', note: 'Retailer sells at a lower price, then invoices the brand for the difference.' },
  'free-goods': { label: 'Free goods', note: 'Extra cases given free with a purchase, e.g. buy 10 get 1.' },
  slotting: { label: 'Slotting / listing', note: 'Fee paid to get new products onto the shelf.' },
  'co-op': { label: 'Co-op display', note: 'Money for end-caps, displays and in-store promotion.' },
  visibility: { label: 'Visibility / ads', note: 'Search ads, banners and sponsored placements on digital shelves.' },
}

export const roi = (l: TradeLine) => (l.incGP - l.spend) / l.spend

export function grossToNet(t: TradeData) {
  const gross = t.accounts.reduce((a, x) => a + x.gross, 0)
  const by = (m: TradeLine['mechanism'][]) => t.lines.filter((l) => m.includes(l.mechanism)).reduce((a, l) => a + l.spend, 0)
  const dist = t.accounts.find((a) => a.kind.startsWith('Distributor'))
  const disputed = t.deductions.reduce((a, d) => a + Math.max(0, d.claimed - d.accrued), 0)
  const steps = [
    { key: 'oi', label: 'Off-invoice', value: by(['off-invoice']) },
    { key: 'fg', label: 'Free goods', value: by(['free-goods']) },
    { key: 'scan', label: 'Scan-based & bill-back', value: by(['scan-based', 'bill-back']) },
    { key: 'slot', label: 'Listing fees', value: by(['slotting']) },
    { key: 'coop', label: 'Displays & visibility', value: by(['co-op', 'visibility']) },
    { key: 'dist', label: 'Distributor margin', value: (dist?.gross ?? 0) * t.distributorMargin },
    { key: 'ret', label: 'Returns & damages', value: gross * t.returnsDamages },
    { key: 'ded', label: 'Unmatched deductions', value: disputed },
  ]
  const tradeSpend = t.lines.reduce((a, l) => a + l.spend, 0)
  const net = gross - steps.reduce((a, s) => a + s.value, 0)
  return { gross, steps, net, tradeSpend, tradeShare: tradeSpend / gross, disputed }
}

/** Incremental gross profit as a concave function of spend, calibrated to each line's actual result. */
const ELASTIC = 0.7
const gp = (l: TradeLine, spend: number) => (l.incGP / Math.pow(l.spend, ELASTIC)) * Math.pow(Math.max(0, spend), ELASTIC)

export function reallocate(from: TradeLine, to: TradeLine, amount: number) {
  const before = from.incGP + to.incGP
  const after = gp(from, from.spend - amount) + gp(to, to.spend + amount)
  return { before, after, gain: after - before }
}

export function bestMove(from: TradeLine, to: TradeLine) {
  let best = { amount: 0, gain: 0 }
  for (let i = 1; i <= 40; i++) {
    const amount = (from.spend * i) / 40
    const g = reallocate(from, to, amount).gain
    if (g > best.gain) best = { amount, gain: g }
  }
  return best
}

export function forwardBuying(t: TradeData) {
  const [a, b] = t.schemeWeeks
  let pipeline = 0
  const weeks = t.sellIn.map((inn, i) => {
    pipeline += inn - t.sellOut[i]
    return { week: i + 1, sellIn: inn, sellOut: t.sellOut[i], pipeline: Math.max(0, pipeline), scheme: i >= a && i <= b }
  })
  const loaded = t.sellIn.slice(a, b + 1).reduce((x, v, i) => x + (v - t.sellOut[a + i]), 0)
  const weeklyOut = t.sellOut.reduce((x, v) => x + v, 0) / t.sellOut.length
  return { weeks, loaded, weeksOfExtra: loaded / weeklyOut }
}
