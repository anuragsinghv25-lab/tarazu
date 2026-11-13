import type { Controls, Sku } from './types'
import { baselineWeekly, effElasticity, effStock, feeFor, health, SALVAGE, unitsAtRisk } from './engine'

export interface Pair { slow: Sku; anchor: Sku; attach: number }

/** Slow movers paired with fast sellers that the same customers buy. */
export function matchBundles(skus: Sku[], c: Controls, affinity: Record<string, { category: string; rate: number }[]>, n = 6): Pair[] {
  const slow = skus.filter((s) => { const h = health(s, c); return (h === 'slow' || h === 'at-risk') && affinity[s.category] })
    .sort((a, b) => unitsAtRisk(b, c) * b.cost - unitsAtRisk(a, c) * a.cost).slice(0, n + 4)
  const anchors = skus.filter((s) => { const h = health(s, c); return h === 'fast' || h === 'healthy' || s.tags.includes('bestseller') })
  const seen = new Set<string>()
  return slow.filter((s) => (seen.has(s.line) ? false : (seen.add(s.line), true))).flatMap((s) => {
    let best: Pair | null = null
    for (const a of affinity[s.category]) {
      for (const k of anchors) {
        if (k.category !== a.category || k.id === s.id) continue
        const score = a.rate * baselineWeekly(k, c)
        if (!best || score > best.attach * baselineWeekly(best.anchor, c)) best = { slow: s, anchor: k, attach: a.rate }
      }
    }
    return best ? [best] : []
  }).slice(0, n)
}

export interface BundleSim { d: number; price: number; list: number; perWeek: number; cleared: number; clearedPct: number; marginBundle: number; marginAnchor: number; net: number; writeOffSaved: number; subsidy: number }

export function bundleSim(p: Pair, c: Controls, d: number, weeks = 4): BundleSim {
  const fee = feeFor('blended', c)
  const { slow, anchor, attach } = p
  const list = slow.price + anchor.price
  const price = list * (1 - d)
  const k = 1 - fee.commission - fee.payment
  const baseA = baselineWeekly(anchor, c)
  // More anchor buyers add the slow mover as the bundle gets cheaper; elasticity of the slow mover sets how fast.
  // No discount, no reason to bundle: take-up comes only from the price cut.
  const pull = Math.max(0, Math.pow(1 - d, effElasticity(slow, c) * 0.8) - 1)
  const want = baseA * attach * 0.9 * pull
  const cap = Math.min(effStock(slow, c), effStock(anchor, c) * 0.5) / weeks
  const perWeek = Math.min(want, cap)
  const cleared = perWeek * weeks
  const marginBundle = price * k - slow.cost - anchor.cost - fee.shipSubsidy
  const marginAnchor = anchor.price * k - anchor.cost - fee.shipSubsidy
  // 80% of bundle buyers would have bought the anchor anyway at full price.
  const existing = 0.8
  const perBundle = existing * (marginBundle - marginAnchor) + (1 - existing) * marginBundle
  const risk = unitsAtRisk(slow, c)
  const writeOffSaved = Math.min(cleared, risk) * slow.cost * (1 - SALVAGE)
  const subsidy = cleared * existing * Math.max(0, list - price) * k
  return { d, price, list, perWeek, cleared, clearedPct: risk ? Math.min(1, cleared / risk) : cleared / Math.max(1, effStock(slow, c)), marginBundle, marginAnchor, net: cleared * perBundle + writeOffSaved, writeOffSaved, subsidy }
}

export function bestBundle(p: Pair, c: Controls) {
  let best = bundleSim(p, c, 0)
  for (let i = 1; i <= 40; i++) { const r = bundleSim(p, c, i / 100); if (r.net > best.net) best = r }
  return best
}
