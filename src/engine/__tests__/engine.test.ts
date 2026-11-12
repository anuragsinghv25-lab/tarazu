import { describe, expect, it } from 'vitest'
import { skus, getSku } from '@/data/meera'
import { DEFAULT_CONTROLS as C } from '@/engine/scenarios'
import { simulate, recommend, curve, sweetSpot, truthLens, portfolio, health, floorMaxDiscount } from '@/engine/engine'

describe('engine', () => {
  it('has 140 deterministic SKUs', () => {
    expect(skus.length).toBe(140)
    expect(new Set(skus.map((s) => s.id)).size).toBe(140)
  })
  it('no discount means no lift and no cost', () => {
    const r = simulate(skus[0], C, { discount: 0, weeks: 2, channel: 'blended' })
    expect(r.lift).toBe(0)
    expect(r.given).toBe(0)
    expect(Math.abs(r.net)).toBeLessThan(1e-6)
  })
  it('scale pans balance to net', () => {
    const s = getSku('vitamin-c-saffron-serum-30-ml')!
    const r = simulate(s, { ...C, goal: 'launch' }, { discount: 0.25, weeks: 2, channel: 'blended' })
    expect(r.earned - r.given).toBeCloseTo(r.net, 6)
    expect(r.incremental + r.cannibalized + r.pulledForward).toBeCloseTo(r.lift, 6)
  })
  it('expiring stock is at risk and gets a markdown', () => {
    const s = getSku('vitamin-c-saffron-serum-30-ml')!
    expect(health(s, C)).toBe('at-risk')
    expect(recommend(s, C).discount).toBeGreaterThan(0)
  })
  it('bestseller holds full price', () => {
    const rec = recommend(getSku('kumkumadi-glow-serum-30-ml')!, C)
    expect(rec.discount).toBe(0)
  })
  it('sweet spot respects the margin floor', () => {
    for (const s of skus.slice(0, 40)) {
      const { best } = sweetSpot(curve(s, C))
      expect(best.d).toBeLessThanOrEqual(floorMaxDiscount(s, C) + 1e-9)
    }
  })
  it('blanket 40% sale loses money vs targeted plan', () => {
    const t = truthLens(skus, C)
    expect(t.net).toBeLessThan(t.planNet)
  })
  it('prints a summary', () => {
    const p = portfolio(skus, C)
    const t = truthLens(skus, C)
    const story = ['kumkumadi-glow-serum-30-ml','vitamin-c-saffron-serum-30-ml','beetroot-lip-balm-regular','diwali-glow-box-set','mineral-sunscreen-spf-50-50-g','rose-toner-200-ml','neem-soap-pack-of-3']
    console.log({ stuck: Math.round(p.stuck), stockValue: Math.round(p.stockValue), gain: Math.round(p.gain), promos: p.promos.length, counts: p.counts })
    console.log({ truthNet: Math.round(t.net), planNet: Math.round(t.planNet), headline: Math.round(t.headlineRevenueGain), base: Math.round(t.baseUnits), promo: Math.round(t.promoUnits), inc: Math.round(t.incremental), steps: t.steps.map(s=>[s.key, Math.round(s.value)]) })
    for (const id of story) { const r = recommend(getSku(id)!, C); console.log(id, r.health, r.mechanic, r.discount, Math.round(r.result.net), r.cliff, r.why) }
  })
})
