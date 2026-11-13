import type { Controls, Sku } from './types'
import { baselineWeekly, effElasticity, effStock, feeFor, floorMaxDiscount, health, portfolio, SALVAGE, simulate, unitsAtRisk } from './engine'

/* ───────── Clearance countdown: a stepped markdown ladder ───────── */

export interface LadderWeek { week: number; discount: number; units: number; left: number; profit: number }
export interface LadderPlan { label: string; weeks: LadderWeek[]; profit: number; leftover: number; writeOff: number; steps: number[] }

function runLadder(s: Sku, c: Controls, weeks: number, at: (w: number) => number, label: string): LadderPlan {
  const fee = feeFor('blended', c)
  const base = baselineWeekly(s, c)
  const e = effElasticity(s, c)
  let left = effStock(s, c)
  const out: LadderWeek[] = []
  let profit = 0
  for (let w = 0; w < weeks; w++) {
    const d = at(w)
    const units = Math.min(left, base * (d > 0 ? Math.pow(1 - d, e) : 1))
    left -= units
    const p = units * (s.price * (1 - d) * (1 - fee.commission - fee.payment) - s.cost - fee.shipSubsidy)
    profit += p
    out.push({ week: w + 1, discount: d, units, left, profit: p })
  }
  const writeOff = left * s.cost * (1 - SALVAGE)
  return { label, weeks: out, profit: profit - writeOff, leftover: left, writeOff, steps: [...new Set(out.map((x) => x.discount))] }
}

export function clearance(s: Sku, c: Controls, weeks = Math.max(4, s.sellWindowWeeks)) {
  const cap = Math.min(0.6, floorMaxDiscount(s, { ...c, marginFloor: Math.min(c.marginFloor, 0.05) }))
  const nothing = runLadder(s, c, weeks, () => 0, 'Do nothing')
  const flat = runLadder(s, c, weeks, () => Math.min(cap, 0.5), `${Math.round(Math.min(cap, 0.5) * 100)}% off now`)
  let best: LadderPlan | null = null
  for (const start of [0.1, 0.15, 0.2, 0.25])
    for (const step of [0.05, 0.1, 0.15])
      for (const every of [1, 2, 3]) {
        const p = runLadder(s, c, weeks, (w) => Math.min(cap, start + Math.floor(w / every) * step), 'Tarazu ladder')
        if (!best || p.profit > best.profit) best = p
      }
  return { nothing, flat, ladder: best!, weeks, cap }
}

/* ───────── Scenario duel: two whole-catalogue strategies side by side ───────── */

export type DuelKind = 'tarazu' | 'blanket' | 'risky-only' | 'nothing'
export interface DuelResult { kind: DuelKind; label: string; net: number; revenue: number; subsidy: number; extraUnits: number; riskLeft: number; onOffer: number; skusOnOffer: number }

export function duel(skus: Sku[], c: Controls, kind: DuelKind, d = 0.3, weeks = 2): DuelResult {
  let net = 0, revenue = 0, subsidy = 0, extra = 0, riskLeft = 0, offerUnits = 0, allUnits = 0, n = 0
  const recs = kind === 'tarazu' ? portfolio(skus, c).recs : null
  skus.forEach((s, i) => {
    const h = health(s, c)
    let disc = 0, w = weeks
    if (kind === 'blanket') disc = d
    else if (kind === 'risky-only') disc = h === 'slow' || h === 'at-risk' ? d : 0
    else if (kind === 'tarazu') { disc = recs![i].discount; w = recs![i].weeks }
    const r = simulate(s, c, { discount: disc, weeks: w, channel: 'blended' })
    net += r.net; revenue += r.revenue; subsidy += r.subsidyCost; extra += r.promoUnits - r.baseUnits
    allUnits += r.promoUnits
    if (disc > 0) { offerUnits += r.promoUnits; n++ }
    const atRisk = unitsAtRisk(s, c)
    riskLeft += Math.max(0, atRisk - (r.promoUnits - r.baseUnits)) * s.cost
  })
  const label = { tarazu: "Tarazu's plan", blanket: `${Math.round(d * 100)}% off everything`, 'risky-only': `${Math.round(d * 100)}% off risky stock only`, nothing: 'Do nothing' }[kind]
  return { kind, label, net, revenue, subsidy, extraUnits: extra, riskLeft, onOffer: allUnits ? offerUnits / allUnits : 0, skusOnOffer: n }
}
