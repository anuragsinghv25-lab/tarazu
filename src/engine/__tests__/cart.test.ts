import { describe, expect, it } from 'vitest'
import { SELLER_BY_ID } from '@/data/sellers'
import { evaluateCart, type CartCtx } from '@/engine/cart'
import type { Cart } from '@/engine/types'

const m = SELLER_BY_ID.meera
const ctx: CartCtx = { skus: m.skus, commission: 0, payment: 0.02, shippingFee: 79, courier: 55, marginFloor: 0.2, maxOrderDiscount: 0.25 }
const base: Cart = { lines: [{ skuId: 'kumkumadi-glow-serum-30-ml', qty: 1 }, { skuId: 'rose-toner-200-ml', qty: 1 }, { skuId: 'ubtan-face-wash-100-ml', qty: 2 }], segment: 'regular', code: '', payment: 'upi', channel: 'website' }

describe('cart engine', () => {
  it('applies tiers, free shipping, free item and cashback without a code', () => {
    const r = evaluateCart(base, m.campaigns, ctx)
    const on = r.evals.filter((e) => e.stopAt === null).map((e) => e.campaign.id)
    expect(on).toEqual(expect.arrayContaining(['glow-tier', 'free-ship', 'face-wash-balm', 'upi-cb']))
    expect(on).not.toContain('glow15')
    expect(r.shipping).toBe(0)
    expect(r.freeItems.length).toBeGreaterThanOrEqual(1)
    expect(r.leak).toBeNull()
  })
  it('flags leakage when the influencer code stacks with tiers, and the fix stops it', () => {
    const cart = { ...base, code: 'glow15' }
    const r = evaluateCart(cart, m.campaigns, ctx)
    expect(r.evals.find((e) => e.campaign.id === 'glow15')!.stopAt).toBeNull()
    expect(r.leak).not.toBeNull()
    const fix = r.leak!.fix!
    const fixed = m.campaigns.map((c) => (c.id === fix.id ? { ...c, ...fix.patch } : c))
    const r2 = evaluateCart(cart, fixed, ctx)
    expect(r2.evals.find((e) => e.campaign.id === 'glow-tier')!.stopAt).toBe('stack')
    expect(r2.discount).toBeLessThan(r.discount)
    console.log({ before: Math.round(r.discount), after: Math.round(r2.discount), leak: r.leak, margin: Math.round(r.marginPct * 100) })
  })
  it('exclusive win-back is blocked by a higher-priority offer and wins when alone', () => {
    const lapsed = { ...base, segment: 'lapsed' as const }
    const r = evaluateCart(lapsed, m.campaigns, ctx)
    expect(r.evals.find((e) => e.campaign.id === 'winback')!.stopAt).toBeNull()
    expect(r.evals.find((e) => e.campaign.id === 'glow-tier')!.stopAt).toBe('stack')
    const withCode = evaluateCart({ ...lapsed, code: 'GLOW15' }, m.campaigns, ctx)
    expect(withCode.evals.find((e) => e.campaign.id === 'winback')!.stopAt).toBe('stack')
  })
  it('nudges toward the next threshold', () => {
    const r = evaluateCart({ ...base, lines: [{ skuId: 'rose-toner-200-ml', qty: 1 }] }, m.campaigns, ctx)
    expect(r.evals.some((e) => e.nudge?.includes('Glow tiers'))).toBe(true)
  })
})
