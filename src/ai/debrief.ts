/* Sale debrief: the Truth Lens, narrated. Re-runs last festival's blanket offer product by product
   and writes what made money, what only looked good, and what to change next time. */
import type { Controls } from '@/engine/types'
import type { SellerDef } from '@/data/sellers'
import { recommend, simulate, truthLens } from '@/engine/engine'
import { inrShort, pct, units } from '@/lib/format'

export interface DebriefRow { id: string; name: string; category: string; net: number; revenueGain: number; units: number; incremental: number; better: number; betterD: number }

export function debrief(s: SellerDef, c: Controls) {
  const h = s.history
  const festive: Controls = { ...c, seasonality: h.seasonality, competitorPrice: 0, stockMult: 1, marginFloor: 0.2, goal: 'launch' }
  const truth = truthLens(s.skus, c, h)
  const rows: DebriefRow[] = s.skus.map((k) => {
    const r = simulate(k, festive, { discount: h.discount, weeks: h.weeks, channel: 'blended' })
    const rec = recommend(k, festive)
    return { id: k.id, name: k.name, category: k.category, net: r.net, revenueGain: r.revenue - r.baseUnits * r.price, units: r.promoUnits, incremental: r.incremental, better: rec.result.net, betterD: rec.discount }
  })
  const made = rows.filter((r) => r.net > 0).sort((a, b) => b.net - a.net)
  const looked = rows.filter((r) => r.net < 0).sort((a, b) => b.revenueGain - a.revenueGain)
  const byCat = Object.values(rows.reduce<Record<string, { category: string; net: number; n: number }>>((acc, r) => {
    (acc[r.category] ??= { category: r.category, net: 0, n: 0 }).net += r.net
    acc[r.category].n++
    return acc
  }, {})).sort((a, b) => a.net - b.net)
  const fullPrice = rows.filter((r) => r.betterD === 0).length
  const up = truth.promoUnits / Math.max(1, truth.baseUnits) - 1
  const event = h.label.split(' · ')[0]
  const biggestLeak = [...truth.steps].sort((a, b) => a.value - b.value)[0]

  const headline = `${event}: sales up ${pct(up)}, ${truth.net >= 0 ? `profit ${inrShort(truth.net)}` : `a loss of ${inrShort(-truth.net)}`}.`
  const summary = `${h.label.split(' · ')[1] ?? `${pct(h.discount)} off`} moved ${units(truth.promoUnits)} units against ${units(truth.baseUnits)} expected. Only ${units(truth.incremental)} of them were truly new sales. The biggest cost was "${biggestLeak.label.toLowerCase()}" at ${inrShort(-biggestLeak.value)}.`
  const changes = [
    `Leave ${fullPrice} of ${s.skus.length} products at full price next time. They sell anyway, so the discount on them was money handed to buyers who would have paid full price.`,
    `Discount by product, not sitewide: the worst category was ${byCat[0].category.toLowerCase()} at ${inrShort(byCat[0].net)}${byCat[byCat.length - 1].net > 0 ? `, while ${byCat[byCat.length - 1].category.toLowerCase()} made ${inrShort(byCat[byCat.length - 1].net)}` : ''}.`,
    `Run Tarazu's plan on the same event: ${inrShort(truth.planNet)} instead of ${inrShort(truth.net)}, a difference of ${inrShort(truth.planNet - truth.net)}.`,
    s.trade ? 'Move the money from off-invoice and free-goods schemes to scan-based deals, so you pay only for units shoppers actually buy.' : 'Watch the fatigue gauge: if more than a third of units only sell on discount, run a full-price week before the next event.',
  ]
  return { truth, rows, made: made.slice(0, 5), looked: looked.slice(0, 5), byCat, headline, summary, changes, event, up }
}
