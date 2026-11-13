/* Shared context for the AI layer. Every number the AI says comes from here, i.e. from the engine;
   the AI layer only chooses which numbers matter and how to say them. */
import type { Campaign, Controls, Recommendation, Sku } from '@/engine/types'
import type { SellerDef } from '@/data/sellers'
import { channelsOf, portfolio, recommend, simulate, truthLens, unitsAtRisk, weeksOfSupply } from '@/engine/engine'
import { matchBundles, bestBundle, bundleSim } from '@/engine/bundles'
import { promoDependency } from '@/features/overview/FatigueCard'

export interface Ctx {
  seller: SellerDef
  c: Controls
  campaigns: Campaign[]
  p: ReturnType<typeof portfolio>
  truth: ReturnType<typeof truthLens>
}

const cache = new WeakMap<Controls, Map<string, Ctx>>()

export function makeCtx(seller: SellerDef, c: Controls, campaigns: Campaign[]): Ctx {
  let m = cache.get(c)
  if (!m) { m = new Map(); cache.set(c, m) }
  const key = `${seller.id}:${campaigns.length}:${campaigns.map((x) => x.id + x.status).join(',')}`
  const hit = m.get(key)
  if (hit) return hit
  const ctx = { seller, c, campaigns, p: portfolio(seller.skus, c), truth: truthLens(seller.skus, c, seller.history) }
  m.set(key, ctx)
  return ctx
}

export const atRiskValue = (r: Recommendation, c: Controls) => unitsAtRisk(r.sku, c) * r.sku.cost

export const topActions = (x: Ctx, n = 5) => [...x.p.promos].sort((a, b) => b.result.net - a.result.net).slice(0, n)

export const risky = (x: Ctx, n = 5) =>
  x.p.recs.filter((r) => r.health === 'at-risk' || r.health === 'slow').sort((a, b) => atRiskValue(b, x.c) - atRiskValue(a, x.c)).slice(0, n)

/** Products Tarazu leaves at full price, biggest sellers first. */
export const holds = (x: Ctx, n = 5) =>
  x.p.recs.filter((r) => r.discount === 0).sort((a, b) => b.result.baseUnits * b.sku.price - a.result.baseUnits * a.sku.price).slice(0, n)

export function channelCompare(x: Ctx, s: Sku, d: number, weeks = 2) {
  return channelsOf(x.c)
    .map((ch) => ({ ch, label: x.c.market.channels[ch].label, r: simulate(s, x.c, { discount: d, weeks, channel: ch }) }))
    .sort((a, b) => b.r.net - a.r.net)
}

export const recFor = (x: Ctx, s: Sku) => x.p.recs.find((r) => r.sku.id === s.id) ?? recommend(s, x.c)

export const dependency = (x: Ctx) => promoDependency(x.seller.promoShare, x.c.strategy)

export function bestPair(x: Ctx) {
  const pairs = matchBundles(x.seller.skus, x.c, x.seller.affinity)
  if (!pairs.length) return null
  const scored = pairs.map((p) => { const b = bestBundle(p, x.c); return { p, d: b.d, sim: bundleSim(p, x.c, b.d) } })
  return scored.sort((a, b) => b.sim.net - a.sim.net)[0]
}

export const wos = (s: Sku, c: Controls) => weeksOfSupply(s, c)

/* ───────── Finding a product the seller named ───────── */

const STOP = new Set('the and for with off sale stock discount price what which should run how much many kya mein kitna kitni karun daalun dalun chahiye pichli last this that from into your mera meri hamara best good buy get free amazon flipkart nykaa meesho website channel platform offer offers deal deals plan product products item items match rival competitor about over under than more less will would could does did make made money'.split(' '))

export function findSku(skus: Sku[], q: string): Sku | undefined {
  const words = q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 3 && !STOP.has(w))
  if (!words.length) return undefined
  let best: { s: Sku; score: number } | undefined
  for (const s of skus) {
    const name = s.name.toLowerCase()
    const score = words.reduce((a, w) => a + (name.includes(w) ? (w.length >= 4 ? 2 : 1) : 0), 0)
    // Prefer the base variant (first listed) when scores tie.
    if (score > 0 && (!best || score > best.score)) best = { s, score }
  }
  return best && best.score >= 2 ? best.s : undefined
}
