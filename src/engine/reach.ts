/* R5 · The Reach: creators, affiliates, referrals and community selling, weighed like any other
   promotion. Each function returns money given and money earned, so everything lands on the Scale. */
import type { Controls, Sku } from './types'
import type { SellerDef } from '@/data/sellers/types'
import type { Affiliate, Creator, Journey, ReferralEvent } from '@/data/reach'
import { health } from './engine'

const weekly = (k: Sku) => k.weeklySales.reduce((a, b) => a + b, 0) / Math.max(1, k.weeklySales.length)

/** Average gross margin across the catalogue, weighted by base sales. */
export function avgMargin(s: SellerDef): number {
  const w = s.skus.reduce((a, k) => a + weekly(k) * k.price, 0)
  return s.skus.reduce((a, k) => a + weekly(k) * k.price * ((k.price - k.cost) / k.price), 0) / Math.max(1, w)
}

/** What an extra order really contributes: gross margin less channel fees, shipping and returns (about 20 points). */
export const contribution = (s: SellerDef) => Math.max(0.12, avgMargin(s) - 0.2)

/* ───────── Creators ───────── */

export type PayModel = 'flat' | 'commission' | 'seeding' | 'hybrid'
export interface Deal { model: PayModel; fee: number; commission: number; discount: number; seedUnits: number; uniqueCodes: boolean }

/** Payout models a creator of each size will accept. Big names don't post for free product. */
export const MODELS: Record<Creator['tier'], PayModel[]> = { nano: ['seeding', 'commission', 'hybrid', 'flat'], micro: ['flat', 'hybrid', 'commission', 'seeding'], macro: ['flat', 'hybrid'], celebrity: ['flat'] }

export const defaultDeal = (c: Creator): Deal => ({ model: c.tier === 'nano' ? 'seeding' : c.tier === 'micro' ? 'hybrid' : 'flat', fee: c.rate, commission: 0.1, discount: 0.1, seedUnits: c.tier === 'nano' ? 3 : 2, uniqueCodes: true })

const ANYWAY: Record<Creator['tier'], number> = { nano: 0.16, micro: 0.2, macro: 0.27, celebrity: 0.32 }

export interface CreatorResult {
  reach: number; clicks: number; orders: number; anyway: number; leaked: number; incremental: number; newBuyers: number
  revenue: number; fee: number; commission: number; seeding: number; discountGiven: number; returns: number
  given: number; earned: number; net: number; perNewBuyer: number; vsAds: number; fakeLoss: number
}

/** One campaign with one creator (a post plus stories over two weeks). */
export function creatorSim(c: Creator, d: Deal, s: SellerDef, cac: number): CreatorResult {
  const real = c.followers * (1 - c.fakeRisk)
  const reach = real * c.engagement * 4.2
  const fakeLoss = c.followers * c.fakeRisk * c.engagement * 4.2
  const clicks = reach * 0.045 * (0.4 + c.match)
  const conv = 0.028 * (1 + d.discount * 2.2)
  const orders = clicks * conv
  // A public code leaks to coupon sites; single-use codes don't.
  const leaked = d.uniqueCodes ? orders * c.leakHistory * 0.1 : orders * c.leakHistory
  const anyway = (orders - leaked) * ANYWAY[c.tier]
  const incremental = Math.max(0, orders - leaked - anyway)
  const aov = s.avgOrder
  const revenue = orders * aov * (1 - d.discount)
  const m = contribution(s)
  const unitCost = s.skus.reduce((a, k) => a + k.cost, 0) / s.skus.length
  const fee = d.model === 'flat' ? d.fee : d.model === 'hybrid' ? d.fee * 0.5 : 0
  const commission = d.model === 'commission' || d.model === 'hybrid' ? revenue * d.commission : 0
  const seeding = d.model === 'seeding' || d.model === 'hybrid' ? d.seedUnits * unitCost * (d.model === 'seeding' ? 1 : 0.5) + 150 : 0
  const discountGiven = orders * aov * d.discount
  const returns = orders * aov * 0.06 * 0.35
  const given = fee + commission + seeding + discountGiven * (1 - incremental / Math.max(1, orders)) + returns
  const earned = incremental * aov * (1 - d.discount) * m + incremental * aov * 0.08 /* repeat value */
  const newBuyers = incremental * 0.62
  const cost = fee + commission + seeding + discountGiven
  return { reach, clicks, orders, anyway, leaked, incremental, newBuyers, revenue, fee, commission, seeding, discountGiven, returns, given, earned, net: earned - given, perNewBuyer: cost / Math.max(1, newBuyers), vsAds: cac, fakeLoss }
}

/** Creators ranked by expected net per rupee spent, with each one's best payout model. */
export function rankCreators(list: Creator[], s: SellerDef, cac: number) {
  return list.map((c) => {
    const models = MODELS[c.tier]
    const sims = models.map((m) => ({ m, r: creatorSim(c, { ...defaultDeal(c), model: m }, s, cac) }))
    const best = sims.sort((a, b) => b.r.net - a.r.net)[0]
    const fit = Math.round((c.match * 0.45 + Math.min(1, c.engagement / 0.08) * 0.3 + (1 - c.fakeRisk) * 0.15 + (1 - c.leakHistory) * 0.1) * 100)
    return { c, best: best.m, r: best.r, fit }
  }).sort((a, b) => b.r.net - a.r.net)
}

/** Same budget: one big name, or many small creators? */
export function budgetSplit(list: Creator[], s: SellerDef, cac: number) {
  const celeb = [...list].filter((c) => c.tier === 'celebrity' || c.tier === 'macro').sort((a, b) => b.followers - a.followers)[0]
  const small = list.filter((c) => c.tier === 'micro' || c.tier === 'nano')
  if (!celeb || !small.length) return null
  const budget = celeb.rate
  const one = creatorSim(celeb, { ...defaultDeal(celeb), model: 'flat', fee: budget, uniqueCodes: false }, s, cac)
  const n = Math.max(1, Math.round(budget / (small.reduce((a, c) => a + c.rate, 0) / small.length)))
  const picks = Array.from({ length: n }, (_, i) => small[i % small.length])
  const many = picks.map((c) => creatorSim(c, { ...defaultDeal(c), model: 'flat', fee: budget / n }, s, cac))
  const sum = (k: keyof CreatorResult) => many.reduce((a, r) => a + (r[k] as number), 0)
  return { budget, celeb, n, one, many: { orders: sum('orders'), incremental: sum('incremental'), newBuyers: sum('newBuyers'), net: sum('net'), perNewBuyer: budget / Math.max(1, sum('newBuyers')), leaked: sum('leaked') } }
}

/** Disclosure check on a caption (ASCI influencer guidelines: a clear label, upfront). */
export function disclosure(caption: string) {
  const text = caption.toLowerCase()
  const label = /(#ad\b|#advertisement|#sponsored|#collab\b|#partnership|paid partnership)/.exec(text)
  const early = label ? label.index <= 140 : false
  const buried = label && !early
  return {
    ok: !!label && !buried,
    checks: [
      { ok: !!label, label: 'Has a clear ad label (#ad, #sponsored, #collab, paid partnership)' },
      { ok: !buried, label: 'Label is upfront, not buried among hashtags at the end' },
      { ok: !/(best|no\.?\s*1|guaranteed|100%\s*(natural|safe)|cure)/i.test(caption), label: 'No unprovable claims (best, guaranteed, cures)' },
    ],
  }
}

/* ───────── Affiliates ───────── */

/** Suggested commission per category: more for categories with stock to clear, less where products sell anyway. */
export function commissionPlan(s: SellerDef, ctl: Controls) {
  const cats = [...new Set(s.skus.map((k) => k.category))]
  return cats.map((cat) => {
    const skus = s.skus.filter((k) => k.category === cat)
    const risky = skus.filter((k) => { const h = health(k, ctl); return h === 'at-risk' || h === 'slow' }).length / skus.length
    const best = skus.filter((k) => k.tags.includes('bestseller')).length / skus.length
    const margin = skus.reduce((a, k) => a + (k.price - k.cost) / k.price, 0) / skus.length
    const rate = Math.max(0.02, Math.min(0.18, 0.06 + risky * 0.12 - best * 0.04 + (margin - 0.5) * 0.1))
    return { category: cat, skus: skus.length, risky, best, margin, rate: Math.round(rate * 100) / 100, why: risky > 0.3 ? 'Stock to clear: pay more for these' : best > 0.3 ? 'Sells anyway: pay less' : 'Standard rate' }
  }).sort((a, b) => b.rate - a.rate)
}

export type Attribution = 'last' | 'first' | 'linear'
export const ATTRIBUTION: Record<Attribution, string> = { last: 'Last click', first: 'First click', linear: 'Shared equally' }

/** Commission paid per partner across the journeys, under an attribution model. */
export function attribute(journeys: Journey[], model: Attribution, rate: number) {
  const out = new Map<string, number>()
  for (const j of journeys) for (const t of j.touches) out.set(t, 0)
  for (const j of journeys) {
    const pot = j.order * rate
    const touches = j.touches
    const share = (t: string, v: number) => out.set(t, (out.get(t) ?? 0) + v)
    if (model === 'last') share(touches[touches.length - 1], pot)
    else if (model === 'first') share(touches[0], pot)
    else touches.forEach((t) => share(t, pot / touches.length))
  }
  return [...out.entries()].map(([partner, paid]) => ({ partner, paid })).sort((a, b) => b.paid - a.paid || a.partner.localeCompare(b.partner))
}

/** Affiliate payouts this week: what's payable now vs held until the return window closes. */
export function affiliateLedger(list: Affiliate[], s: SellerDef, rate: number, holdDays: number) {
  return list.map((a) => {
    const gross = a.ordersPerWeek * s.avgOrder * rate
    const fraud = gross * a.selfReferral
    const held = holdDays > 0 ? (gross - fraud) * Math.min(1, holdDays / 21) : 0
    return { ...a, gross, fraud, held, payable: gross - fraud - held, flag: a.selfReferral > 0.12 ? 'High self-referral: buyers earning cashback on their own orders' : a.kind === 'Coupon site' ? 'Mostly last-click: often takes credit for sales others started' : '' }
  })
}

/* ───────── Referral 2.0 ───────── */

export interface ReferralDesign { give: number; get: number; tiered: boolean; channel: 'whatsapp' | 'link' | 'sms'; releaseAfterReturns: boolean }

export function referralSim(d: ReferralDesign, s: SellerDef, customers: number) {
  const reach = { whatsapp: 1, link: 0.55, sms: 0.35 }[d.channel]
  const referrers = customers * 0.06 * reach * (1 + Math.min(1, (d.get / s.avgOrder) * 1.5))
  const invites = referrers * 3.2 * (d.tiered ? 1.25 : 1)
  const friends = invites * 0.11 * (1 + Math.min(1, (d.give / s.avgOrder) * 2))
  const fraudShare = d.releaseAfterReturns ? 0.03 : 0.11
  const fraud = friends * fraudShare
  const real = friends - fraud
  const m = contribution(s)
  const cost = friends * d.give + (friends - (d.releaseAfterReturns ? fraud : 0)) * d.get * (d.tiered ? 1.15 : 1)
  const earned = real * 0.7 /* 30% of friends would have found the shop anyway */ * s.avgOrder * m * 1.25 /* first order + some repeat */
  return { referrers, invites, friends, fraud, real, cost, earned, net: earned - cost, perNewBuyer: cost / Math.max(1, real) }
}

export const SIGNAL_LABEL: Record<ReferralEvent['signals'][number], string> = { 'same-device': 'Same device', 'same-address': 'Same address', 'same-payment': 'Same payment method', velocity: 'Many sign-ups fast' }
export const riskOf = (e: ReferralEvent) => (e.signals.includes('velocity') || e.signals.length >= 2 ? 'block' : e.signals.length === 1 ? 'review' : 'ok')

/* ───────── Resellers ───────── */

/** Reseller network (sell through people who add their own margin) vs a blanket sitewide discount. */
export function resellerVsSitewide(s: SellerDef, resellerMargin: number, sitewide: number, resellers: number) {
  const m = contribution(s) + 0.08 /* resellers handle their own customer service */
  const aov = s.avgOrder
  const ordersPerReseller = 1.2 * (0.6 + resellerMargin * 2.5)
  const rOrders = resellers * ordersPerReseller
  const rNet = rOrders * aov * (m - resellerMargin) * 0.92 /* returns */
  const weeklyOrders = s.skus.reduce((a, k) => a + weekly(k), 0) / 1.6
  const lift = Math.pow(1 - sitewide, -1.6) - 1
  const sOrders = weeklyOrders * lift
  const sNet = sOrders * aov * (m - sitewide) - weeklyOrders * aov * sitewide /* discount to buyers who'd buy anyway */
  return { rOrders, rNet, sOrders, sNet }
}

/* ───────── Community: group buys and drops ───────── */

export function groupBuy(sku: Sku, tiers: { size: number; price: number }[], interested: number) {
  return tiers.map((t) => {
    const d = 1 - t.price / sku.price
    const complete = Math.max(0.03, Math.min(0.95, Math.exp(-(t.size - 2) * 0.32) * (0.6 + d * 1.5)))
    const groups = (interested / t.size) * complete
    const units = groups * t.size
    const margin = t.price - sku.cost
    const anyway = units * 0.3
    const net = (units - anyway) * margin - anyway * (sku.price - t.price)
    return { ...t, d, complete, groups, units, net, perUnit: margin }
  })
}

export function drop(stock: number, community: number, earlyHours: number, earlyDiscount: number, sku: Sku) {
  const want = community * 0.07 * (1 + earlyDiscount * 2)
  const earlyUnits = Math.min(stock, want * Math.min(1, earlyHours / 24) * 0.8)
  const publicUnits = Math.min(stock - earlyUnits, (stock - earlyUnits) * 0.7)
  const hours = Array.from({ length: 48 }, (_, h) => {
    const early = h < earlyHours ? Math.min(earlyUnits, (earlyUnits * (h + 1)) / Math.max(1, earlyHours) * 1.4) : earlyUnits
    const pub = h >= earlyHours ? Math.min(publicUnits, publicUnits * (1 - Math.exp(-(h - earlyHours + 1) / 6))) : 0
    return { h, sold: Math.round(Math.min(stock, early + pub)) }
  })
  const sold = hours[hours.length - 1].sold
  const revenue = earlyUnits * sku.price * (1 - earlyDiscount) + (sold - earlyUnits) * sku.price
  const fullPriceShare = (sold - earlyUnits) / Math.max(1, sold)
  return { hours, sold, sellThrough: sold / Math.max(1, stock), revenue, fullPriceShare, earlyUnits }
}
