import { describe, expect, it } from 'vitest'
import { controlsFor, SELLER_BY_ID } from '@/data/sellers'
import { FRONTIER } from '@/data/frontier'
import { REACH } from '@/data/reach'
import type { Controls } from '@/engine/types'
import { kindOf, ondcWeek, ONDC_DEFAULT, peekingPath, preorderSim, priceProtection, pValue, sampleSize, segmentResult, splitBudget, splitCurve, subscribeSim, targetingSummary, testPlan, upliftCurve } from '@/engine/frontier'
import { contribution } from '@/engine/reach'

const ctl = (id: keyof typeof FRONTIER): Controls => controlsFor(SELLER_BY_ID[id])

describe('uplift targeting', () => {
  for (const id of ['meera', 'farhan', 'kabir', 'anaya'] as const) {
    it(`targeting persuadables beats everyone and propensity for ${id}`, () => {
      const s = SELLER_BY_ID[id]
      const rows = FRONTIER[id].segments.map((g) => segmentResult(g, 0.12, s.avgOrder, contribution(s)))
      const up = targetingSummary(rows, 'uplift').net
      expect(up).toBeGreaterThan(targetingSummary(rows, 'everyone').net)
      expect(up).toBeGreaterThanOrEqual(targetingSummary(rows, 'propensity').net)
      expect(up).toBeGreaterThan(0)
    })
  }
  it('every seller has each kind of customer except where noted', () => {
    const kinds = new Set(FRONTIER.meera.segments.map(kindOf))
    expect([...kinds].sort()).toEqual(['lost', 'persuadable', 'sleeping', 'sure'])
  })
  it('sleeping dogs lose money on any offer', () => {
    const s = SELLER_BY_ID.meera
    const g = FRONTIER.meera.segments.find((x) => kindOf(x) === 'sleeping')!
    expect(segmentResult(g, 0.1, s.avgOrder, contribution(s)).net).toBeLessThan(0)
  })
  it('the uplift curve ends where everyone ends', () => {
    const s = SELLER_BY_ID.kabir
    const rows = FRONTIER.kabir.segments.map((g) => segmentResult(g, 0.15, s.avgOrder, contribution(s)))
    const curve = upliftCurve(rows)
    const last = curve[curve.length - 1]
    expect(Math.abs(last.uplift - last.propensity)).toBeLessThan(2)
    expect(Math.max(...curve.map((p) => p.uplift))).toBeGreaterThan(last.uplift)
  })
})

describe('ads vs discount', () => {
  it('the best split mixes both for Meera', () => {
    const s = SELLER_BY_ID.meera
    const { best, pts } = splitCurve(s, FRONTIER.meera, REACH.meera.adsCac)
    expect(best.share).toBeGreaterThan(0)
    expect(best.share).toBeLessThan(1)
    expect(best.net).toBeGreaterThan(pts[0].net)
    expect(best.net).toBeGreaterThan(pts[20].net)
  })
  it('spends exactly the budget', () => {
    const r = splitBudget(SELLER_BY_ID.anaya, FRONTIER.anaya, REACH.anaya.adsCac, 0.35)
    expect(r.ads + r.disc).toBeCloseTo(FRONTIER.anaya.budget)
  })
  it('a smaller budget earns more per rupee', () => {
    const s = SELLER_BY_ID.farhan, f = FRONTIER.farhan
    const small = splitBudget(s, f, REACH.farhan.adsCac, 0.5, 0.15, 10000)
    const big = splitBudget(s, f, REACH.farhan.adsCac, 0.5, 0.15, 40000)
    expect(small.net / 10000).toBeGreaterThan(big.net / 40000)
  })
})

describe('ONDC', () => {
  it('keeps more per order than the marketplace at par pricing', () => {
    for (const id of ['meera', 'farhan', 'kabir', 'anaya'] as const) {
      const w = ondcWeek(SELLER_BY_ID[id], ctl(id), FRONTIER[id].ondc, ONDC_DEFAULT)
      expect(w.ondcNet).toBeGreaterThan(w.mktNet)
    }
  })
  it('passing savings on lowers the price and brings more orders', () => {
    const s = SELLER_BY_ID.anaya
    const a = ondcWeek(s, ctl('anaya'), FRONTIER.anaya.ondc, ONDC_DEFAULT)
    const b = ondcWeek(s, ctl('anaya'), FRONTIER.anaya.ondc, { ...ONDC_DEFAULT, passThrough: 1 })
    expect(b.ondcPrice).toBeLessThan(a.ondcPrice)
    expect(b.orders).toBeGreaterThan(a.orders)
  })
})

describe('subscriptions, pre-orders and price protection', () => {
  it('is not offered where nothing is replenished', () => {
    expect(subscribeSim(FRONTIER.farhan.subscription, SELLER_BY_ID.farhan, 0.1)).toBeNull()
  })
  it('subscribers keep ordering longer than the same buyers would anyway', () => {
    const r = subscribeSim(FRONTIER.anaya.subscription, SELLER_BY_ID.anaya, 0.1)!
    expect(r.subOrders).toBeGreaterThan(r.baseOrders)
    expect(r.net).toBeGreaterThan(0)
  })
  it('a deeper subscriber discount lowers churn', () => {
    const a = subscribeSim(FRONTIER.meera.subscription, SELLER_BY_ID.meera, 0.05)!
    const b = subscribeSim(FRONTIER.meera.subscription, SELLER_BY_ID.meera, 0.15)!
    expect(b.churn).toBeLessThan(a.churn)
  })
  it('pre-orders narrow the forecast error; full payment cancels least', () => {
    const l = FRONTIER.kabir.launch
    const full = preorderSim(l, 0.1, 'full', 4), later = preorderSim(l, 0.1, 'none', 4)
    expect(full.errAfter).toBeLessThan(full.errBefore)
    expect(full.cancel).toBeLessThan(later.cancel)
    expect(full.cash).toBeGreaterThan(later.cash)
  })
  it('price protection costs claims only when a sale lands inside the window', () => {
    const s = SELLER_BY_ID.meera
    expect(priceProtection(s, 14, 21, 0.2, false).liability).toBe(0)
    expect(priceProtection(s, 30, 21, 0.2, false).liability).toBeGreaterThan(0)
    expect(priceProtection(s, 30, 21, 0.2, true).liability).toBe(0)
  })
})

describe('experiments', () => {
  it('sample size matches the textbook figure', () => {
    // 5% baseline, 20% relative lift, 95% confidence, 80% power: about 8,150 per arm.
    const n = sampleSize(0.05, 0.2)
    expect(n).toBeGreaterThan(8000)
    expect(n).toBeLessThan(8300)
  })
  it('smaller effects need far more visitors', () => {
    expect(sampleSize(0.02, 0.05)).toBeGreaterThan(sampleSize(0.02, 0.1) * 3.5)
  })
  it('alternating weeks take whole weeks', () => {
    expect(testPlan(FRONTIER.farhan.experiments, 0.1, 1).days % 7).toBe(0)
  })
  it('p-values are sane', () => {
    expect(pValue(1.96)).toBeCloseTo(0.05, 2)
    expect(pValue(0)).toBeCloseTo(1, 2)
  })
  it('peeking finds a false winner that disappears', () => {
    const { path, firstDip } = peekingPath(28)
    expect(firstDip).toBeGreaterThan(0)
    expect(path[path.length - 1].p).toBeGreaterThan(0.05)
  })
})
