import { describe, expect, it } from 'vitest'
import { SELLERS, controlsFor } from '@/data/sellers'
import { REACH } from '@/data/reach'
import { attribute, budgetSplit, commissionPlan, creatorSim, defaultDeal, disclosure, drop, groupBuy, MODELS, rankCreators, referralSim, resellerVsSitewide } from '../reach'

const bad = (o: object) => Object.values(o).some((v) => typeof v === 'number' && !Number.isFinite(v))

describe('creators', () => {
  for (const s of SELLERS) it(`${s.name}: every creator simulates cleanly and big names only take flat fees`, () => {
    const R = REACH[s.id]
    for (const x of rankCreators(R.creators, s, R.adsCac)) {
      expect(bad(x.r)).toBe(false)
      expect(MODELS[x.c.tier]).toContain(x.best)
    }
    expect(MODELS.celebrity).toEqual(['flat'])
  })
  it('the same budget on many small creators reaches more new buyers than one big name', () => {
    for (const s of SELLERS) {
      const b = budgetSplit(REACH[s.id].creators, s, REACH[s.id].adsCac)!
      expect(b.many.newBuyers).toBeGreaterThan(b.one.newBuyers)
    }
  })
  it('single-use codes leak far less than a public code', () => {
    const s = SELLERS[0], c = REACH.meera.creators[1]
    const pub = creatorSim(c, { ...defaultDeal(c), uniqueCodes: false }, s, 460), uni = creatorSim(c, { ...defaultDeal(c), uniqueCodes: true }, s, 460)
    expect(uni.leaked).toBeLessThan(pub.leaked / 5)
  })
  it('disclosure: needs an upfront ad label and no unprovable claims', () => {
    expect(disclosure('#ad My evening routine with Saanjh').ok).toBe(true)
    expect(disclosure('Loving this serum!').ok).toBe(false)
    expect(disclosure('Loving this serum! ' + 'so good '.repeat(30) + '#skincare #glow #ad').checks[1].ok).toBe(false)
    expect(disclosure('#ad the best serum, guaranteed results').checks[2].ok).toBe(false)
  })
})

describe('affiliates, referrals, community', () => {
  it('attribution moves money between partners but never changes the total', () => {
    const j = REACH.meera.journeys
    const total = (m: 'last' | 'first' | 'linear') => attribute(j, m, 0.08).reduce((a, x) => a + x.paid, 0)
    expect(total('last')).toBeCloseTo(total('first'))
    expect(total('linear')).toBeCloseTo(total('last'))
    expect(attribute(j, 'last', 0.08)[0].partner).not.toBe(attribute(j, 'first', 0.08)[0].partner)
  })
  it('commission is higher where stock needs clearing', () => {
    const p = commissionPlan(SELLERS[0], controlsFor(SELLERS[0]))
    expect(p[0].risky).toBeGreaterThanOrEqual(p[p.length - 1].risky)
  })
  it('referrals with rewards held until returns close lose less to fraud', () => {
    const s = SELLERS[0]
    const held = referralSim({ give: 150, get: 150, tiered: false, channel: 'whatsapp', releaseAfterReturns: true }, s, 18000)
    const now = referralSim({ give: 150, get: 150, tiered: false, channel: 'whatsapp', releaseAfterReturns: false }, s, 18000)
    expect(held.fraud).toBeLessThan(now.fraud)
  })
  it("Farhan's reseller network beats the 30% sitewide habit", () => {
    const f = SELLERS.find((x) => x.id === 'farhan')!
    const r = resellerVsSitewide(f, 0.15, 0.3, REACH.farhan.resellers!.count)
    expect(r.rNet).toBeGreaterThan(r.sNet)
  })
  it('bigger groups are less likely to complete; drops never sell more than stock', () => {
    const sku = SELLERS[0].skus[0]
    const g = groupBuy(sku, [{ size: 2, price: sku.price * 0.95 }, { size: 6, price: sku.price * 0.85 }], 500)
    expect(g[1].complete).toBeLessThan(g[0].complete)
    const d = drop(120, 2400, 6, 0.1, sku)
    expect(d.sold).toBeLessThanOrEqual(120)
  })
})
