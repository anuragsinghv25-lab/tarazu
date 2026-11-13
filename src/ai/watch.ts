/* Watchtower: the proactive agent. Scans the seller's data for things that need a decision and
   proposes one action each, with the money at stake. Whether Tarazu acts on its own depends on the
   autonomy dial and the guardrails; anything outside the guardrails always waits for the seller. */
import type { Campaign } from '@/engine/types'
import type { Guardrails } from '@/state/mind'
import { evaluateCart, costPerRedemption } from '@/engine/cart'
import { simulate, unitsAtRisk } from '@/engine/engine'
import { newCampaign } from '@/features/campaigns/templates'
import { PRESETS, cartContext, presetCart } from '@/features/sandbox/presets'
import { inrShort, pct, units } from '@/lib/format'
import { atRiskValue, dependency, risky, type Ctx } from './context'

export type Severity = 'urgent' | 'watch' | 'idea'
export interface Change { kind: 'create'; campaign: Campaign }
export interface Patch { kind: 'patch'; id: string; patch: Partial<Campaign> }
export interface Alert {
  id: string
  severity: Severity
  title: string
  body: string
  stake: number
  icon: 'stock' | 'rival' | 'leak' | 'budget' | 'slow' | 'fatigue' | 'deduction' | 'expiry'
  /** The one-tap action. Missing = information only. */
  action?: { label: string; changes: (Change | Patch)[]; done: string }
  alt?: { label: string; done: string }
  /** Can Tarazu do this on its own, within the guardrails? */
  safe: boolean
  why?: string
  to: string
  focus?: string
}

export function scan(x: Ctx, g: Guardrails): Alert[] {
  const s = x.seller, c = x.c
  const out: Alert[] = []

  // 1 · Aged stock that needs a markdown now
  const aged = risky(x, 3).filter((r) => r.discount > 0)
  aged.slice(0, 2).forEach((r, i) => {
    const d = r.discount
    const camp = newCampaign(s, 'Percentage off', {
      id: `wt-md-${r.sku.id}`, name: `${r.mechanic}: ${r.sku.line} ${pct(d)} off`, status: 'live', startDay: 0, endDay: r.weeks * 7,
      conditions: [{ kind: 'hasSku', value: r.sku.id }], reward: { kind: 'pctOff', value: d, target: 'sku', ref: r.sku.id },
      budget: Math.max(5000, Math.round((r.result.subsidyCost + r.result.dealFees) / 1000) * 1000), dailyRedemptions: Math.max(2, Math.round(r.result.promoUnits / (r.weeks * 7))),
      note: 'Started by Watchtower',
    })
    const safe = d <= g.maxMarkdown && camp.budget <= g.maxSpend && !(g.protectBestsellers && r.sku.tags.includes('bestseller'))
    out.push({
      id: `aged-${r.sku.id}`, severity: i === 0 ? 'urgent' : 'watch', icon: r.sku.expiryWeeks ? 'expiry' : 'stock',
      title: r.sku.expiryWeeks ? `${r.sku.name}: batch expires in ${r.sku.expiryWeeks} weeks` : `${r.sku.name} has aged ${r.sku.ageWeeks} weeks`,
      body: `${inrShort(atRiskValue(r, c))} of it won't sell in time. A ${pct(d)} ${r.mechanic.toLowerCase()} for ${r.weeks} weeks clears ${pct(r.result.stockClearedPct)} and nets ${inrShort(r.result.net)}.`,
      stake: r.result.net, action: { label: `Approve ${pct(d)} markdown`, changes: [{ kind: 'create', campaign: camp }], done: `Markdown live on ${r.sku.line}` },
      alt: { label: 'Not now', done: 'Snoozed for a week' },
      safe, why: safe ? `Within guardrails: ${pct(d)} ≤ ${pct(g.maxMarkdown)}, budget ${inrShort(camp.budget)} ≤ ${inrShort(g.maxSpend)}` : `Needs you: ${d > g.maxMarkdown ? `${pct(d)} is deeper than the ${pct(g.maxMarkdown)} guardrail` : camp.budget > g.maxSpend ? `budget ${inrShort(camp.budget)} is above ${inrShort(g.maxSpend)}` : 'bestsellers are protected'}`,
      to: `/sku/${r.sku.id}`, focus: 'scale',
    })
  })

  // 2 · A rival undercut (always for the price-war sellers; for others when the Control Room says so)
  if (c.competitorPrice > 0 || s.id === 'kabir' || s.id === 'farhan') {
    const hero = s.skus.find((k) => k.id === s.heroSkuId)!
    const cut = Math.max(0.08, c.competitorPrice || (s.id === 'kabir' ? 0.12 : 0.1))
    const rc = { ...c, competitorPrice: cut }
    const hold = simulate(hero, rc, { discount: 0, weeks: 2, channel: 'blended' })
    const half = simulate(hero, rc, { discount: cut / 2, weeks: 2, channel: 'blended' })
    const full = simulate(hero, rc, { discount: cut, weeks: 2, channel: 'blended' })
    const better = half.net > full.net ? { d: cut / 2, r: half, k: 'partial match' } : { d: cut, r: full, k: 'full match' }
    const act = better.r.net > hold.net
    const camp = newCampaign(s, 'Flash deal', {
      id: `wt-rival-${hero.id}`, name: `Price match: ${hero.line} ${pct(better.d)} off`, status: 'live', startDay: 0, endDay: 14,
      conditions: [{ kind: 'hasSku', value: hero.id }], reward: { kind: 'pctOff', value: better.d, target: 'sku', ref: hero.id }, stacking: 'exclusive',
      budget: Math.round((better.r.subsidyCost + better.r.dealFees) / 1000) * 1000 || 5000, dailyRedemptions: Math.max(3, Math.round(better.r.promoUnits / 14)), note: 'Started by Watchtower',
    })
    out.push({
      id: `rival-${hero.id}`, severity: 'urgent', icon: 'rival',
      title: `A rival cut ${hero.line} by ${pct(cut)}`,
      body: act
        ? `Holding loses sales; a ${better.k} at ${pct(better.d)} earns ${inrShort(better.r.net - hold.net)} more than holding over two weeks. A full match gives the cut to every loyal buyer too.`
        : `Matching costs more than it brings back: holding your price is ${inrShort(hold.net - better.r.net)} better over two weeks.`,
      stake: Math.abs(better.r.net - hold.net),
      action: act ? { label: `Match ${pct(better.d)}`, changes: [{ kind: 'create', campaign: camp }], done: `Price match live on ${hero.line}` } : undefined,
      alt: { label: act ? 'Hold price' : 'Keep holding', done: 'Holding price' },
      safe: act && better.d <= g.maxMarkdown && !(g.protectBestsellers && hero.tags.includes('bestseller')),
      why: act ? (better.d <= g.maxMarkdown ? 'Within the markdown guardrail' : `Needs you: ${pct(better.d)} is past the guardrail`) : undefined,
      to: `/sku/${hero.id}`, focus: 'scale',
    })
  }

  // 3 · Leaking codes, found by running the seller's preset carts
  for (const p of PRESETS[s.id]) {
    const cart = presetCart(s, p)
    const r = evaluateCart(cart, x.campaigns, cartContext(s, c, cart))
    if (r.leak?.fix && !out.some((a) => a.id === `leak-${r.leak!.fix!.id}`)) {
      const camp = x.campaigns.find((k) => k.id === r.leak!.fix!.id)!
      const perDay = r.leak.amount * Math.max(1, camp.dailyRedemptions * 0.4)
      out.push({
        id: `leak-${camp.id}`, severity: 'urgent', icon: 'leak',
        title: `${camp.name} is leaking`,
        body: `${r.leak.reasons[0].replace(/\.?$/, '.')} About ${inrShort(r.leak.amount)} too much per order, roughly ${inrShort(perDay * 7)} a week at today's redemptions.`,
        stake: perDay * 7,
        action: { label: r.leak.fix.label, changes: [{ kind: 'patch', id: camp.id, patch: r.leak.fix.patch }], done: `${camp.name} fixed` },
        safe: true, why: 'Tightening a rule never costs money, so it is always within guardrails',
        to: '/sandbox', focus: 'leak',
      })
    }
  }

  // 4 · Budget burning faster than planned
  for (const k of x.campaigns.filter((z) => z.status === 'live')) {
    const per = costPerRedemption(k, s.avgOrder, s.skus, s.shippingFee)
    const left = k.budget - k.spent
    const daysLeft = per > 0 ? left / (per * k.dailyRedemptions) : Infinity
    if (daysLeft < k.endDay - 1 && daysLeft < 10) {
      out.push({
        id: `budget-${k.id}`, severity: 'watch', icon: 'budget',
        title: `${k.name} runs out of budget in ${Math.max(1, Math.round(daysLeft))} day${Math.round(daysLeft) <= 1 ? '' : 's'}`,
        body: `${inrShort(left)} left at about ${inrShort(per * k.dailyRedemptions)} a day; it is planned to run ${k.endDay} more days. Cap daily redemptions to make it last, or let it end early.`,
        stake: left,
        action: { label: 'Cap daily uses', changes: [{ kind: 'patch', id: k.id, patch: { dailyRedemptions: Math.max(1, Math.floor(left / per / Math.max(1, k.endDay))) } }], done: `${k.name} capped` },
        alt: { label: 'Let it end early', done: 'Will end when the budget does' },
        safe: true, why: 'Lowering spend is always within guardrails',
        to: `/campaigns?id=${k.id}`, focus: 'burn-down',
      })
      if (out.filter((a) => a.icon === 'budget').length >= 2) break
    }
  }

  // 5 · A live offer under-delivering
  const slow = x.campaigns.filter((z) => z.status === 'live' && z.startDay < -3 && z.dailyRedemptions > 0)
    .map((z) => ({ z, rate: z.redeemed / (Math.abs(z.startDay) * z.dailyRedemptions) }))
    .filter((o) => o.rate < 0.55).sort((a, b) => a.rate - b.rate)[0]
  if (slow) {
    out.push({
      id: `slow-${slow.z.id}`, severity: 'watch', icon: 'slow',
      title: `Day ${Math.abs(slow.z.startDay)}: ${slow.z.name} is under-delivering`,
      body: `${units(slow.z.redeemed)} uses vs about ${units(Math.abs(slow.z.startDay) * slow.z.dailyRedemptions)} expected (${pct(slow.rate)}). The offer isn't changing behaviour; ending it saves the placement and the discount.`,
      stake: slow.z.budget - slow.z.spent,
      action: { label: 'Pause it', changes: [{ kind: 'patch', id: slow.z.id, patch: { status: 'paused' } }], done: `${slow.z.name} paused` },
      alt: { label: 'Extend a week', done: 'Extended by a week' },
      safe: true, why: 'Pausing never costs money',
      to: `/campaigns?id=${slow.z.id}`,
    })
  }

  // 6 · Promo fatigue
  const dep = dependency(x)
  if (dep >= 0.35) {
    out.push({
      id: 'fatigue', severity: dep >= 0.5 ? 'urgent' : 'idea', icon: 'fatigue',
      title: `${pct(dep)} of units only sell on discount`,
      body: 'Buyers are learning to wait for the next offer. Run one full-price week on bestsellers and keep offers only on stock that needs them.',
      stake: 0, safe: false, to: '/', focus: 'fatigue',
    })
  }

  // 7 · Brand mode: over-claimed deductions
  if (s.trade) {
    const bad = s.trade.deductions.filter((d) => d.claimed > d.accrued && d.status !== 'pending')
    const amt = bad.reduce((a, d) => a + d.claimed - d.accrued, 0)
    if (bad.length) out.push({
      id: 'deductions', severity: 'urgent', icon: 'deduction',
      title: `${inrShort(amt)} of deductions have nothing agreed behind them`,
      body: `${bad.length} retailer deductions are over-claimed or have no matching promotion, the oldest open ${Math.max(...bad.map((d) => d.daysOpen))} days. Disputes are easier inside 45 days.`,
      stake: amt, safe: false, why: 'Disputes go to the retailer, so they always need you', to: '/brand', focus: 'deductions',
    })
  }

  const rank: Record<Severity, number> = { urgent: 0, watch: 1, idea: 2 }
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || b.stake - a.stake)
}

export const unitsStuck = (x: Ctx) => x.p.recs.reduce((a, r) => a + unitsAtRisk(r.sku, x.c), 0)
