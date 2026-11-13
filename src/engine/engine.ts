import type {
  ChannelOrBlend, Confidence, Controls, CurvePoint, FeeModel, Health, Recommendation, SimInput, SimResult, Sku,
} from './types'

export type { FeeModel } from './types'

/* ─────────────────────────────────────────────────────────────
   Tarazu engine — every number on screen comes from here.
   The formulas follow the research tab of the product doc:
   net impact = lift profit − subsidy − fees − cannibalization
                − pull-forward + halo + write-off avoided.
   ───────────────────────────────────────────────────────────── */

const FEE_LEVEL = { low: 0.75, current: 1, high: 1.3 } as const
export const SALVAGE = 0.35

export const channelsOf = (c: Controls) => Object.keys(c.market.channels)

export function feeFor(channel: ChannelOrBlend, c: Controls): FeeModel {
  const k = FEE_LEVEL[c.feeLevel]
  const fees = c.market.channels
  if (channel !== 'blended') {
    const f = fees[channel] ?? Object.values(fees)[0]
    return { ...f, commission: f.commission * k, dealPerDay: f.dealPerDay * k }
  }
  const blend = Object.keys(fees).reduce(
    (a, ch) => {
      const f = fees[ch]
      a.commission += f.commission * f.share
      a.payment += f.payment * f.share
      a.shipSubsidy += f.shipSubsidy * f.share
      return a
    },
    { commission: 0, payment: 0, shipSubsidy: 0 },
  )
  return { label: 'All channels', ...blend, commission: blend.commission * k, dealPerDay: c.market.blendDealPerDay * k, share: 1, boost: 1, note: 'Weighted across your channels' }
}

export const effStock = (s: Sku, c: Controls) => Math.round(s.stock * c.stockMult)

/** Hi-Lo trains buyers to wait for sales (more pull-forward, more price sensitivity); EDLP does the opposite. */
export const STRATEGY = {
  edlp: { pull: -0.06, elasticity: 0.85, label: 'EDLP · everyday low price' },
  balanced: { pull: 0, elasticity: 1, label: 'Balanced' },
  hilo: { pull: 0.1, elasticity: 1.15, label: 'Hi-Lo · frequent deep promos' },
} as const
const effPull = (c: Controls) => Math.min(0.6, Math.max(0, c.pullForward + STRATEGY[c.strategy].pull))
export const effElasticity = (s: Sku, c: Controls) => s.elasticity * c.elasticityMult * STRATEGY[c.strategy].elasticity

/** Expected weekly units with no promotion. */
export function baselineWeekly(s: Sku, c: Controls): number {
  // Run rate weighted to the last 4 weeks, so a post-festival drop shows up quickly.
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  const avg = 0.75 * mean(s.weeklySales.slice(-4)) + 0.25 * mean(s.weeklySales.slice(-8, -4))
  // Competitors getting cheaper takes demand away; dearer gives some back.
  const comp = Math.max(0.3, 1 + c.competitorPrice * 0.9 * Math.min(2, -s.elasticity * c.elasticityMult) / 1.8)
  return Math.max(0.2, avg * c.seasonality * comp)
}

export function weeksOfSupply(s: Sku, c: Controls) {
  return effStock(s, c) / baselineWeekly(s, c)
}

export function unitsAtRisk(s: Sku, c: Controls) {
  return Math.max(0, effStock(s, c) - baselineWeekly(s, c) * s.sellWindowWeeks)
}

export function health(s: Sku, c: Controls): Health {
  const stock = effStock(s, c)
  const wos = weeksOfSupply(s, c)
  const risk = unitsAtRisk(s, c)
  if (stock === 0) return 'fast'
  if (risk / stock > 0.35 || (s.expiryWeeks !== undefined && wos > s.expiryWeeks)) return 'at-risk'
  if (risk > 0 || wos > s.sellWindowWeeks * 0.9 || s.ageWeeks > 20) return 'slow'
  if (wos < 5) return 'fast'
  return 'healthy'
}

export function simulate(s: Sku, c: Controls, input: SimInput): SimResult {
  const { discount: d, weeks: w, channel } = input
  const fee = feeFor(channel, c)
  const share = channel === 'blended' ? 1 : fee.share
  const stock = effStock(s, c)
  const base = baselineWeekly(s, c) * share
  const price = s.price
  const promoPrice = price * (1 - d)
  const e = effElasticity(s, c)

  const unitNet = (p: number) => p * (1 - fee.commission - fee.payment) - s.cost - fee.shipSubsidy
  const mult = d > 0 ? Math.pow(1 - d, e) * fee.boost : 1
  const avail = channel === 'blended' ? stock : stock * Math.max(share, 0.5)

  const baseUnits = Math.min(avail, base * w)
  const promoUnits = Math.min(avail, base * mult * w)
  const lift = Math.max(0, promoUnits - baseUnits)
  const cannibalized = Math.min(lift * 0.6, lift * s.cannibalRate * (0.5 + d))
  const pulledForward = lift * effPull(c)
  const incremental = Math.max(0, lift - cannibalized - pulledForward)

  const k = 1 - fee.commission - fee.payment
  const subsidyCost = baseUnits * price * d * k
  const dealFees = d > 0 ? fee.dealPerDay * 7 * w : 0
  const cannibalCost = cannibalized * Math.max(0, unitNet(price)) * 0.9
  const pullForwardCost = pulledForward * Math.max(0, unitNet(price))
  const liftProfit = lift * unitNet(promoPrice)
  const haloProfit = incremental * s.haloRate * s.haloMargin
  // Extra units bring extra returns: lost margin plus reverse logistics.
  const returnsCost = lift * (s.returnRate ?? 0) * (Math.max(0, unitNet(promoPrice)) + 80)

  const window = s.sellWindowWeeks
  const baseFull = baselineWeekly(s, c)
  const riskBefore = Math.max(0, stock - baseFull * window)
  const riskAfter = Math.max(0, stock - (promoUnits - baseUnits) - baseFull * window)
  const goalClear = c.goal === 'clear' ? 1.3 : 1
  const writeOffSaved = (riskBefore - riskAfter) * s.cost * (1 - SALVAGE) * goalClear

  const given = subsidyCost + dealFees + cannibalCost + pullForwardCost + returnsCost
  const earned = liftProfit + haloProfit + writeOffSaved
  const grow = c.goal === 'grow' ? incremental * promoPrice * 0.08 : 0
  const net = earned - given + grow

  return {
    ...input, price, promoPrice, baseUnits, promoUnits, lift, cannibalized, pulledForward, incremental,
    subsidyCost, dealFees, cannibalCost, pullForwardCost, returnsCost, liftProfit, haloProfit, writeOffSaved,
    given, earned, net,
    revenue: promoUnits * promoPrice,
    stockClearedPct: stock ? promoUnits / stock : 0,
    grossMarginPct: promoPrice > 0 ? (promoPrice - s.cost) / promoPrice : -1,
  }
}

/** Deepest discount that still respects the margin floor. */
export function floorMaxDiscount(s: Sku, c: Controls) {
  const floor = c.marginFloor + (c.goal === 'margin' ? 0.05 : 0)
  return Math.max(0, 1 - s.cost / ((1 - floor) * s.price))
}

export function curve(s: Sku, c: Controls, weeks = 2, channel: ChannelOrBlend = 'blended'): CurvePoint[] {
  const max = floorMaxDiscount(s, c)
  const pts: CurvePoint[] = []
  for (let i = 0; i <= 60; i++) {
    const d = i / 100
    pts.push({ d, net: simulate(s, c, { discount: d, weeks, channel }).net, allowed: d <= max + 1e-9 })
  }
  return pts
}

export function sweetSpot(pts: CurvePoint[]) {
  let best = pts[0]
  for (const p of pts) if (p.allowed && p.net > best.net) best = p
  const after = pts.find((p) => p.d > best.d && p.net < 0)
  return { best, cliff: after ? after.d : null }
}

const pct = (d: number) => `${Math.round(d * 100)}%`
const inrK = (n: number) => {
  const a = Math.abs(n)
  const s = a >= 1e5 ? `₹${(a / 1e5).toFixed(1)} L` : a >= 1e3 ? `₹${(a / 1e3).toFixed(1)} K` : `₹${Math.round(a)}`
  return n < 0 ? `−${s}` : s
}

export function mechanicFor(s: Sku, h: Health, d: number): string {
  if (d === 0) return 'Hold full price'
  if (s.tags.includes('overstock')) return Math.abs(d - 0.5) < 0.005 ? 'Buy 1 Get 1' : 'Bundle offer'
  if (s.tags.includes('giftset')) return 'Markdown ladder'
  if (s.tags.includes('expiring')) return 'Clearance markdown'
  if (s.tags.includes('seasonal')) return 'Lightning Deal'
  if (s.tags.includes('broken-sizes')) return 'Size clearance'
  if (s.tags.includes('old-model')) return d >= 0.3 ? 'Clearance markdown' : 'Bank offer + bundle'
  if (h === 'at-risk') return 'Clearance markdown'
  if (h === 'slow') return d >= 0.25 ? 'Markdown' : 'Bundle offer'
  return 'Event discount'
}

/** How much to trust a recommendation: noisy sales history or messy data lowers it. */
export function confidenceOf(s: Sku, c: Controls): { level: Confidence; why: string } {
  const xs = s.weeklySales.slice(-8)
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length)
  const cv = mean > 0 ? sd / mean : 1
  let score = cv < 0.15 ? 2 : cv < 0.35 ? 1 : 0
  if (mean < 3) score -= 1
  if (c.dataQuality === 'messy') score -= 1
  const level: Confidence = score >= 2 ? 'high' : score >= 1 ? 'medium' : 'low'
  const bits = [cv < 0.15 ? 'steady weekly sales' : cv < 0.35 ? 'sales vary week to week' : 'very uneven sales history']
  if (mean < 3) bits.push('few units a week')
  if (c.dataQuality === 'messy') bits.push('gaps and duplicates in the sales feed')
  return { level, why: bits.join(', ') }
}

export function recommend(s: Sku, c: Controls): Recommendation {
  const h = health(s, c)
  const weeks = h === 'at-risk' ? 3 : 2
  const pts = curve(s, c, weeks)
  const { best, cliff } = sweetSpot(pts)
  // A small win is not worth training customers to wait: hold instead.
  const hold = best.net < Math.max(1500, s.price * 4) && h !== 'at-risk'
  // Overstock that needs a deep cut reads better as Buy 1 Get 1 (an effective 50% off each unit).
  const bogo = !hold && s.tags.includes('overstock') && best.d >= 0.4 && floorMaxDiscount(s, c) >= 0.5
  const discount = hold ? 0 : bogo ? 0.5 : best.d
  const result = simulate(s, c, { discount, weeks, channel: 'blended' })
  const mechanic = mechanicFor(s, h, discount)
  const wos = weeksOfSupply(s, c)
  const fmax = floorMaxDiscount(s, c)

  let why: string
  if (discount === 0) {
    why = h === 'fast'
      ? `Selling fast with ${wos.toFixed(1)} weeks of cover. A discount would mostly subsidise buyers who were coming anyway. Keep it at full price.`
      : best.net <= 0
        ? `No discount level makes money here once subsidy, cannibalization and fees are counted. Hold the price and let it sell.`
        : `The best promotion only nets ${inrK(best.net)}, not worth teaching customers to wait for a sale. Hold the price.`
  } else {
    const parts = [
      `${Math.round(wos)} weeks of stock against ${s.sellWindowWeeks} weeks left to sell` + (s.ageWeeks > 12 ? `, ${s.ageWeeks} weeks old` : '') + '.',
      `${mechanic === 'Buy 1 Get 1' ? 'Buy 1 Get 1 (50% off each unit)' : `A ${pct(discount)} ${mechanic.toLowerCase()}`} for ${weeks} weeks clears about ${pct(result.stockClearedPct)} and nets ${inrK(result.net)} after fees.`,
    ]
    if (cliff !== null) parts.push(`Don't go past ${pct(cliff)}: that's the profit cliff.`)
    else if (fmax < 0.6) parts.push(`Your margin floor caps it at ${pct(fmax)}.`)
    why = parts.join(' ')
  }
  const short = discount === 0 ? 'Keep full price' : `${pct(discount)} · ${weeks} wks → ${inrK(result.net)}`
  const conf = confidenceOf(s, c)
  if (conf.level === 'low' && discount > 0) why += ' Treat this as a starting point: the data behind it is thin.'
  return { sku: s, health: h, mechanic, discount, weeks, result, why, short, floorMaxDiscount: fmax, cliff, confidence: conf.level, confidenceWhy: conf.why }
}

/* ───────── Truth Lens: what last festival's blanket sale really did ───────── */

export interface TruthResult {
  label: string
  discount: number
  baseUnits: number
  promoUnits: number
  subsidized: number
  cannibalized: number
  pulledForward: number
  incremental: number
  headlineRevenueGain: number
  steps: { key: string; label: string; value: number }[]
  net: number
  planNet: number
}

export interface History { label: string; discount: number; weeks: number; seasonality: number }

export function truthLens(skus: Sku[], c: Controls, h: History = { label: 'Diwali 2025 · 40% off everything', discount: 0.4, weeks: 2, seasonality: 1.7 }): TruthResult {
  const { discount, weeks } = h
  // Neutral accounting: no goal weighting, festive demand, the stock she actually had.
  // History doesn't change with today's scenario; only modelling assumptions (sensitivity, pull-forward, fees) do.
  const festive: Controls = { ...c, seasonality: h.seasonality, competitorPrice: 0, stockMult: 1, marginFloor: 0.2, goal: 'launch' }
  let baseUnits = 0, promoUnits = 0, cannibalized = 0, pulledForward = 0, incremental = 0
  let revGain = 0, subsidy = 0, cannibalCost = 0, pullCost = 0, returns = 0, liftProfit = 0, halo = 0, writeOff = 0, net = 0, planNet = 0, perSkuFees = 0
  for (const s of skus) {
    const r = simulate(s, festive, { discount, weeks, channel: 'blended' })
    baseUnits += r.baseUnits; promoUnits += r.promoUnits; cannibalized += r.cannibalized
    pulledForward += r.pulledForward; incremental += r.incremental
    revGain += r.revenue - r.baseUnits * r.price
    subsidy += r.subsidyCost; cannibalCost += r.cannibalCost; pullCost += r.pullForwardCost; returns += r.returnsCost
    liftProfit += r.liftProfit; halo += r.haloProfit; writeOff += r.writeOffSaved; perSkuFees += r.dealFees
    net += r.net
    const rec = recommend(s, festive)
    planNet += rec.result.net
  }
  // A blanket sale books one campaign per channel, not one deal per SKU.
  const fees = 1000 * 7 * weeks * channelsOf(c).length
  net += perSkuFees - fees
  return {
    label: h.label,
    discount, baseUnits, promoUnits,
    subsidized: Math.min(baseUnits, promoUnits), cannibalized, pulledForward, incremental,
    headlineRevenueGain: revGain,
    steps: [
      { key: 'lift', label: 'Profit on the extra units', value: liftProfit },
      { key: 'halo', label: 'Halo on other products', value: halo },
      { key: 'writeoff', label: 'Old stock saved from write-off', value: writeOff },
      { key: 'subsidy', label: 'Discount to buyers who would have paid full price', value: -subsidy },
      { key: 'cannibal', label: 'Sales stolen from your own products', value: -cannibalCost },
      { key: 'pull', label: 'Future full-price sales pulled forward', value: -pullCost },
      ...(returns > 1 ? [{ key: 'returns', label: 'Returns on the extra orders', value: -returns }] : []),
      { key: 'fees', label: 'Deal and campaign fees', value: -fees },
    ],
    net, planNet,
  }
}

/* ───────── Portfolio roll-up for the Overview ───────── */

export function portfolio(skus: Sku[], c: Controls) {
  const recs = skus.map((s) => recommend(s, c))
  const atRisk = recs.filter((r) => r.health === 'at-risk' || r.health === 'slow')
  const stuck = atRisk.reduce((a, r) => a + unitsAtRisk(r.sku, c) * r.sku.cost, 0)
  const stockValue = skus.reduce((a, s) => a + effStock(s, c) * s.cost, 0)
  const gain = recs.reduce((a, r) => a + Math.max(0, r.result.net), 0)
  const promos = recs.filter((r) => r.discount > 0)
  const counts = { fast: 0, healthy: 0, slow: 0, 'at-risk': 0 } as Record<Health, number>
  recs.forEach((r) => counts[r.health]++)
  // Open-to-buy: cash released by selling risky stock sooner, available for new stock.
  const freed = promos.reduce((a, r) => a + Math.max(0, r.result.promoUnits - r.result.baseUnits) * r.sku.cost, 0)
  return { recs, stuck, stockValue, gain, promos, holds: recs.length - promos.length, counts, freed }
}
