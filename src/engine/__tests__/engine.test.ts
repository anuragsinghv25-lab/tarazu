import { describe, expect, it } from 'vitest'
import { SELLERS, SELLER_BY_ID, controlsFor, skuOf } from '@/data/sellers'
import { simulate, recommend, curve, sweetSpot, truthLens, portfolio, health, floorMaxDiscount } from '@/engine/engine'

const meera = SELLER_BY_ID.meera
const C = controlsFor(meera)
const sku = (id: string) => skuOf(meera, id)!

describe('engine · Meera', () => {
  it('has 140 deterministic SKUs', () => {
    expect(meera.skus.length).toBe(140)
    expect(new Set(meera.skus.map((s) => s.id)).size).toBe(140)
  })
  it('no discount means no lift and no cost', () => {
    const r = simulate(meera.skus[0], C, { discount: 0, weeks: 2, channel: 'blended' })
    expect(r.lift).toBe(0)
    expect(r.given).toBe(0)
    expect(Math.abs(r.net)).toBeLessThan(1e-6)
  })
  it('scale pans balance to net', () => {
    const r = simulate(sku('vitamin-c-saffron-serum-30-ml'), { ...C, goal: 'launch' }, { discount: 0.25, weeks: 2, channel: 'blended' })
    expect(r.earned - r.given).toBeCloseTo(r.net, 6)
    expect(r.incremental + r.cannibalized + r.pulledForward).toBeCloseTo(r.lift, 6)
  })
  it('expiring stock is at risk and gets a markdown', () => {
    const s = sku('vitamin-c-saffron-serum-30-ml')
    expect(health(s, C)).toBe('at-risk')
    expect(recommend(s, C).discount).toBeGreaterThan(0)
  })
  it('bestseller holds full price', () => {
    expect(recommend(sku('kumkumadi-glow-serum-30-ml'), C).discount).toBe(0)
  })
  it('sweet spot respects the margin floor', () => {
    for (const s of meera.skus.slice(0, 40)) {
      const { best } = sweetSpot(curve(s, C))
      expect(best.d).toBeLessThanOrEqual(floorMaxDiscount(s, C) + 1e-9)
    }
  })
  it('blanket sale loses money vs targeted plan', () => {
    const t = truthLens(meera.skus, C, meera.history)
    expect(t.net).toBeLessThan(t.planNet)
  })
})

describe('engine · every seller', () => {
  for (const s of SELLERS) {
    it(`${s.name}: story SKUs, picks and shelf exist; plan beats blanket sale`, () => {
      const c = controlsFor(s)
      for (const id of [s.heroSkuId, ...s.story.map((x) => x.id), ...s.comparePicks.map((x) => x.id), ...s.shelf]) expect(skuOf(s, id), id).toBeTruthy()
      const p = portfolio(s.skus, c)
      const t = truthLens(s.skus, c, s.history)
      expect(p.promos.length).toBeGreaterThan(0)
      expect(t.net).toBeLessThan(t.planNet)
      expect(Number.isFinite(p.gain)).toBe(true)
      console.log(s.name, { skus: s.skus.length, stuck: Math.round(p.stuck), gain: Math.round(p.gain), promos: p.promos.length, counts: p.counts, truth: Math.round(t.net), plan: Math.round(t.planNet), lift: +(t.promoUnits / t.baseUnits - 1).toFixed(2), incr: +(t.incremental / t.promoUnits).toFixed(2) })
      const hero = recommend(skuOf(s, s.heroSkuId)!, c)
      console.log('  hero', hero.mechanic, hero.discount, Math.round(hero.result.net), hero.confidence, '|', hero.why)
    })
  }
})
