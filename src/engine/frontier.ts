/* R6 · The Edge: the techniques that separate a good promotion team from a great one. Uplift
   targeting, ads vs discount, ONDC as a channel, subscriptions, pre-orders, price-drop protection
   and experiments. Each returns money given and money earned, so everything lands on the Scale. */
import type { Controls } from './types'
import type { SellerDef } from '@/data/sellers/types'
import type { Experiments, FrontierData, Launch, Ondc, Segment, Subscription } from '@/data/frontier'
import { feeFor } from './engine'
import { contribution } from './reach'

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/* ───────── Uplift targeting ───────── */

export type Kind = 'persuadable' | 'sure' | 'lost' | 'sleeping'
export const KIND: Record<Kind, { label: string; rule: string }> = {
  persuadable: { label: 'Persuadables', rule: 'Buy only if they get the offer. The only group worth paying.' },
  sure: { label: 'Sure things', rule: 'Buy anyway. An offer is a gift with no return.' },
  lost: { label: 'Lost causes', rule: 'Will not buy either way. Cheap to send, pointless to discount.' },
  sleeping: { label: 'Sleeping dogs', rule: 'Buy less when they get an offer. Leave them alone.' },
}

export const kindOf = (g: Segment): Kind => (g.u15 < 0 ? 'sleeping' : g.u15 >= 0.05 ? 'persuadable' : g.p0 >= 0.1 ? 'sure' : 'lost')

/** Chance of ordering at discount d. Positive effects grow with depth, with diminishing returns. */
export function p1(g: Segment, d: number) {
  if (d <= 0) return g.p0
  const effect = g.u15 >= 0 ? g.u15 * Math.pow(d / 0.15, 0.6) : g.u15 * Math.min(1, d / 0.1)
  return clamp(g.p0 + effect, 0, 1)
}

export interface SegmentResult { g: Segment; kind: Kind; p1: number; redeem: number; incremental: number; given: number; earned: number; net: number; perCustomer: number }

export function segmentResult(g: Segment, d: number, aov: number, m: number): SegmentResult {
  const q = p1(g, d)
  const redeem = g.size * q
  const incremental = g.size * (q - g.p0)
  const given = redeem * aov * d
  const earned = incremental * aov * m
  const net = earned - given
  return { g, kind: kindOf(g), p1: q, redeem, incremental, given, earned, net, perCustomer: net / g.size }
}

export type Targeting = 'everyone' | 'propensity' | 'uplift'
export const TARGETING: Record<Targeting, string> = { everyone: 'Everyone', propensity: 'Most likely to buy', uplift: 'Most likely to be persuaded' }

/** Who each approach sends the offer to. Propensity targets the top 30% by score, the way most CRM tools do. */
export function pick(rows: SegmentResult[], t: Targeting): Set<string> {
  if (t === 'everyone') return new Set(rows.map((r) => r.g.id))
  if (t === 'uplift') return new Set(rows.filter((r) => r.net > 0).map((r) => r.g.id))
  const total = rows.reduce((a, r) => a + r.g.size, 0)
  const out = new Set<string>()
  let n = 0
  for (const r of [...rows].sort((a, b) => b.g.score - a.g.score)) { if (n >= total * 0.3) break; out.add(r.g.id); n += r.g.size }
  return out
}

export function targetingSummary(rows: SegmentResult[], t: Targeting) {
  const chosen = pick(rows, t)
  const sel = rows.filter((r) => chosen.has(r.g.id))
  const sum = (f: (r: SegmentResult) => number) => sel.reduce((a, r) => a + f(r), 0)
  return { chosen, customers: sum((r) => r.g.size), incremental: sum((r) => r.incremental), given: sum((r) => r.given), earned: sum((r) => r.earned), net: sum((r) => r.net) }
}

/** Cumulative net as more customers are targeted, in the order each approach would add them. */
export function upliftCurve(rows: SegmentResult[]) {
  const total = rows.reduce((a, r) => a + r.g.size, 0)
  const all = rows.reduce((a, r) => a + r.net, 0)
  const line = (sorted: SegmentResult[]) => {
    const pts: [number, number][] = [[0, 0]]
    let x = 0, y = 0
    for (const r of sorted) { x += r.g.size; y += r.net; pts.push([x / total, y]) }
    return (f: number) => { for (let i = 1; i < pts.length; i++) if (f <= pts[i][0] + 1e-9) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + ((y1 - y0) * (f - x0)) / Math.max(1e-9, x1 - x0) } return pts[pts.length - 1][1] }
  }
  const byUplift = line([...rows].sort((a, b) => b.perCustomer - a.perCustomer))
  const byScore = line([...rows].sort((a, b) => b.g.score - a.g.score))
  return Array.from({ length: 21 }, (_, i) => { const f = i / 20; return { pct: Math.round(f * 100), uplift: Math.round(byUplift(f)), propensity: Math.round(byScore(f)), random: Math.round(all * f) } })
}

/* ───────── Ads vs discount ───────── */

export interface SplitResult { share: number; ads: number; disc: number; adsBuyers: number; adsNet: number; discOrders: number; discIncremental: number; discNew: number; discNet: number; newBuyers: number; net: number }

/**
 * One monthly budget, split between paid ads and discounts. Ads buy new customers with diminishing
 * returns (cost per buyer rises as spend grows). Discounts mostly subsidise orders that would have
 * happened anyway, and the share that's truly extra falls as the discount reaches more people.
 */
export function splitBudget(s: SellerDef, f: FrontierData, cac: number, share: number, depth = 0.15, budget = f.budget): SplitResult {
  const m = contribution(s), aov = s.avgOrder, B = budget
  const ref = f.budget * 0.3
  const ads = B * share, disc = B - ads
  const adsBuyers = ads > 0 ? (ref / cac) * Math.pow(ads / ref, 0.55) : 0
  const adsNet = adsBuyers * aov * m * (1 + f.adsRepeat * 0.5) - ads
  const discOrders = disc / (aov * depth)
  const incShare = 0.75 / (1 + (3 * disc) / f.budget)
  const discIncremental = discOrders * incShare
  const discNew = discIncremental * 0.2
  const discNet = discIncremental * aov * m + discNew * aov * m * 0.4 - disc
  return { share, ads, disc, adsBuyers, adsNet, discOrders, discIncremental, discNew, discNet, newBuyers: adsBuyers + discNew, net: adsNet + discNet }
}

export function splitCurve(s: SellerDef, f: FrontierData, cac: number, depth = 0.15, budget = f.budget) {
  const pts = Array.from({ length: 21 }, (_, i) => splitBudget(s, f, cac, i / 20, depth, budget))
  const best = pts.reduce((a, b) => (b.net > a.net ? b : a))
  return { pts, best }
}

/* ───────── ONDC ───────── */

export interface OndcSettings { buyerFee: number; sellerFee: number; incentive: number; passThrough: number }
export const ONDC_DEFAULT: OndcSettings = { buyerFee: 0.03, sellerFee: 0.02, incentive: 0, passThrough: 0 }

/** One order of a given price: what a marketplace keeps vs what ONDC participants keep. */
export function ondcOrder(price: number, cost: number, c: Controls, o: Ondc, set: OndcSettings) {
  const fee = feeFor(o.versus, c)
  const ship = o.logistics
  const mktFees = price * (fee.commission + fee.payment) + fee.shipSubsidy + ship
  const saving0 = price * (fee.commission + fee.payment) + fee.shipSubsidy - price * (set.buyerFee + set.sellerFee)
  const cut = Math.max(0, saving0) * set.passThrough
  const ondcPrice = price - cut
  const ondcFees = ondcPrice * (set.buyerFee + set.sellerFee) + ship
  return { label: fee.label, price, ondcPrice, mktFees, ondcFees, mktNet: price - cost - mktFees, ondcNet: ondcPrice - cost - ondcFees, cut }
}

/** A week on ONDC at the seller's average order. Lower prices and network incentives bring more orders. */
export function ondcWeek(s: SellerDef, c: Controls, o: Ondc, set: OndcSettings) {
  const m = contribution(s) + 0.2
  const price = s.avgOrder, cost = price * (1 - m)
  const r = ondcOrder(price, cost, c, o, set)
  const elastic = 1 + (r.cut / price) * 2.2 + (set.incentive / price) * 2.5
  const orders = o.ordersPerWeek * elastic
  return { ...r, orders, net: orders * r.ondcNet, perOrderGain: r.ondcNet - r.mktNet }
}

/** Products ranked by how much more each unit keeps on ONDC than on the marketplace. */
export function ondcFit(s: SellerDef, c: Controls, o: Ondc, set: OndcSettings, n = 6) {
  return s.skus
    .map((k) => { const r = ondcOrder(k.price, k.cost, c, o, set); return { sku: k, gain: r.ondcNet - r.mktNet, gainPct: (r.ondcNet - r.mktNet) / k.price, mktNet: r.mktNet, ondcNet: r.ondcNet } })
    .filter((x) => x.ondcNet > 0)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, n)
}

/* ───────── Subscribe and save ───────── */

/** A month's cohort of new subscribers over a year, against what the same buyers would have ordered anyway. */
export function subscribeSim(sub: Subscription, s: SellerDef, d: number) {
  if (sub.fit === 'none' || !sub.cycleDays || !sub.buyersPerMonth || sub.repeat == null) return null
  const m = contribution(s), aov = s.avgOrder * 0.75
  const uptake = clamp(0.03 + d * 0.55, 0, 0.3)
  const churn = clamp(0.16 - d * 0.5, 0.05, 0.3)
  const opm = 30 / sub.cycleDays
  const baseRepeat = Math.min(0.85, sub.repeat * 1.8)
  const N = sub.buyersPerMonth * uptake
  const series = Array.from({ length: 13 }, (_, mo) => ({ month: mo, sub: Math.round(N * Math.pow(1 - churn, mo)), base: Math.round(N * Math.pow(baseRepeat, mo * opm)) }))
  const subOrders = series.slice(0, 12).reduce((a, p) => a + p.sub * opm, 0)
  const baseOrders = series.slice(0, 12).reduce((a, p) => a + p.base * opm, 0)
  const incremental = subOrders - baseOrders
  const given = subOrders * aov * d
  const earned = incremental * aov * m
  return { N, uptake, churn, opm, series, subOrders, baseOrders, incremental, given, earned, net: earned - given, aov }
}

/* ───────── Pre-orders ───────── */

export type Payment = 'full' | 'deposit' | 'none'
export const PAYMENT: Record<Payment, { label: string; cancel: number; signup: number; upfront: number }> = {
  full: { label: 'Pay in full', cancel: 0.04, signup: 0.7, upfront: 1 },
  deposit: { label: '20% deposit', cancel: 0.12, signup: 1, upfront: 0.2 },
  none: { label: 'Reserve, pay later', cancel: 0.35, signup: 1.25, upfront: 0 },
}

/** A pre-order window before launch: early demand tells the seller how much stock to buy. */
export function preorderSim(l: Launch, early: number, pay: Payment, weeks: number) {
  const P = PAYMENT[pay]
  const signups = l.demand * 0.25 * (1 + early * 3) * Math.min(1, weeks / 4) * P.signup
  const confirmed = signups * (1 - P.cancel)
  const errBefore = 0.45
  const errAfter = clamp(errBefore - (confirmed / l.demand) * 1.2, 0.12, errBefore)
  const atRisk = (e: number) => l.demand * e * 0.4 * l.cost
  const cash = confirmed * l.price * (1 - early) * P.upfront
  const given = confirmed * l.price * early * 0.6
  const saved = atRisk(errBefore) - atRisk(errAfter)
  return { signups, confirmed, cancel: P.cancel, errBefore, errAfter, riskBefore: atRisk(errBefore), riskAfter: atRisk(errAfter), saved, cash, given, net: saved - given, buy: Math.round(l.demand * (1 + errAfter * 0.25)) }
}

/* ───────── Price-drop protection ───────── */

/** Refund the difference if the price drops within `days`. Costs claims if a sale lands inside the window. */
export function priceProtection(s: SellerDef, days: number, daysToEvent: number, eventDepth: number, excludeEvents: boolean) {
  const m = contribution(s)
  const ordersPerDay = s.skus.reduce((a, k) => a + k.weeklySales.reduce((x, y) => x + y, 0) / Math.max(1, k.weeklySales.length), 0) / 7 / 1.3
  const exposed = !excludeEvents && daysToEvent <= days ? Math.min(days, daysToEvent) : 0
  const exposedOrders = ordersPerDay * exposed
  const liability = exposedOrders * 0.35 * s.avgOrder * eventDepth
  const horizon = Math.min(30, Math.max(days, 7))
  const lift = days === 0 ? 0 : (excludeEvents ? 0.025 : 0.05) * Math.min(1, days / 14)
  const gainOrders = ordersPerDay * horizon * lift
  const earned = gainOrders * s.avgOrder * m
  return { ordersPerDay, exposed, exposedOrders, liability, gainOrders, earned, net: earned - liability, warn: !excludeEvents && daysToEvent <= days }
}

/* ───────── Experiments ───────── */

const Z_ALPHA: Record<string, number> = { '0.1': 1.645, '0.05': 1.96, '0.01': 2.576 }
const Z_POWER: Record<string, number> = { '0.8': 0.8416, '0.9': 1.2816 }

/** Visitors needed in each arm to detect a relative lift `mde` on conversion `p`. */
export function sampleSize(p: number, mde: number, alpha = 0.05, power = 0.8) {
  const p2 = p * (1 + mde)
  const pb = (p + p2) / 2
  const za = Z_ALPHA[String(alpha)] ?? 1.96, zb = Z_POWER[String(power)] ?? 0.8416
  const n = Math.pow(za * Math.sqrt(2 * pb * (1 - pb)) + zb * Math.sqrt(p * (1 - p) + p2 * (1 - p2)), 2) / Math.pow(p2 - p, 2)
  return Math.ceil(n)
}

export function testPlan(e: Experiments, mde: number, inTest: number, alpha = 0.05, power = 0.8, holdout = 0) {
  const n = sampleSize(e.conversion, mde, alpha, power)
  const perDay = e.traffic * inTest * (1 - holdout)
  const days = e.method === 'ab' ? Math.ceil((2 * n) / Math.max(1, perDay)) : Math.ceil(n / Math.max(1, e.traffic * inTest)) * 2
  return { n, days: e.method === 'weeks' ? Math.max(14, Math.ceil(days / 7) * 7) : Math.max(7, days), perDay }
}

/** Deterministic pseudo-random numbers, so the demo shows the same path every time. */
function rng(seed: number) { let x = seed >>> 0; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296 } }
const normal = (r: () => number) => Math.sqrt(-2 * Math.log(Math.max(1e-12, r()))) * Math.cos(2 * Math.PI * r())

/** Two-sided p-value from a z score. */
export function pValue(z: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return 2 * p
}

/**
 * An A/A-style test where the two offers are truly identical, checked every day. Peeking finds a
 * "winner" that isn't there; waiting for the planned sample doesn't.
 */
export function peekingPath(days: number, seed = 7) {
  for (let s = seed; s < seed + 400; s++) {
    const r = rng(s)
    let sum = 0
    const path = Array.from({ length: days }, (_, i) => { sum += normal(r); const z = sum / Math.sqrt(i + 1); return { day: i + 1, p: Math.min(1, pValue(z)) } })
    const firstDip = path.findIndex((x) => x.p < 0.05)
    if (firstDip > 1 && firstDip < days * 0.6 && path[days - 1].p > 0.2) return { path, firstDip: firstDip + 1 }
  }
  return { path: [], firstDip: -1 }
}

/** Read out a finished test of two discount depths on both conversion and profit per visitor. */
export function readout(e: Experiments, s: SellerDef, dA: number, dB: number, n: number) {
  const m = contribution(s) + 0.2
  const lift = (dB - dA) * 2.2
  const pA = e.conversion * (1 + dA * 1.2), pB = pA * (1 + lift)
  const se = Math.sqrt((pA * (1 - pA)) / n + (pB * (1 - pB)) / n)
  const z = (pB - pA) / se
  const profit = (p: number, d: number) => p * s.avgOrder * (m - d)
  return { pA, pB, z, p: pValue(z), ci: [(pB - pA - 1.96 * se) / pA, (pB - pA + 1.96 * se) / pA] as [number, number], profitA: profit(pA, dA), profitB: profit(pB, dB) }
}
