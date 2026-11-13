import { describe, expect, it } from 'vitest'
import { SELLERS, controlsFor } from '@/data/sellers'
import { newCampaign } from '@/features/campaigns/templates'
import { cartContext } from '@/features/sandbox/presets'
import { audience, canMove, CODE_ALPHABET, codeRisk, estimate, generateCodes, mapChannels, normaliseCode, orderQualifies, preflight, verdict } from '../launch'
import { CASES, DEMOS } from '../edge'

const meera = SELLERS.find((s) => s.id === 'meera')!
const c0 = controlsFor(meera)
const ctx = (cart: Parameters<typeof cartContext>[2]) => cartContext(meera, c0, cart)

describe('codes', () => {
  it('are unique, unambiguous and deterministic', () => {
    const a = generateCodes('glow', 2000, 3)
    expect(new Set(a).size).toBe(2000)
    expect(a.every((x) => /^GLOW-[A-Z0-9]{6}$/.test(x) && [...x.slice(5)].every((ch) => CODE_ALPHABET.includes(ch)))).toBe(true)
    expect(generateCodes('glow', 5, 3)).toEqual(a.slice(0, 5))
  })
  it('normalise case and spaces', () => expect(normaliseCode(' gLoW 15 ')).toBe('GLOW15'))
  it('public code with no limits is risky', () => {
    const c = newCampaign(meera, 'Coupon code', { conditions: [{ kind: 'code', value: 'X' }] })
    expect(codeRisk(c).score).toBeGreaterThanOrEqual(0.6)
    expect(codeRisk({ ...c, perCustomer: 1, totalRedemptions: 100, stacking: 'exclusive' }).score).toBeLessThan(0.6)
  })
})

describe('lifecycle', () => {
  it('maker cannot approve; approval-needed drafts cannot skip review', () => {
    expect(canMove('review', 'approved', 'maker', true).ok).toBe(false)
    expect(canMove('review', 'approved', 'checker', true).ok).toBe(true)
    expect(canMove('draft', 'scheduled', 'maker', true).ok).toBe(false)
    expect(canMove('draft', 'scheduled', 'maker', false).ok).toBe(true)
    expect(canMove('archived', 'live', 'checker', false).ok).toBe(false)
  })
  it('order time decides, with a grace window', () => {
    expect(orderQualifies(-1, 2, 0, 15).withGrace).toBe(true)
    expect(orderQualifies(1, 2, 0, 15).withGrace).toBe(false)
  })
})

describe('pre-flight', () => {
  it('blocks a bundle above MRP and an empty audience', () => {
    const [a, b] = meera.skus
    const bundle = newCampaign(meera, 'Bundle', { reward: { kind: 'bundlePrice', skus: [a.id, b.id], price: a.price + b.price + 100 } })
    expect(preflight(bundle, meera, c0, meera.campaigns, ctx).some((f) => f.id === 'mrp' && f.level === 'block')).toBe(true)
    const empty = newCampaign(meera, 'Percentage off', { launch: { audience: [{ kind: 'city', values: [] }] } })
    expect(audience(empty.launch!.audience!, meera).size).toBe(0)
    expect(verdict(preflight(empty, meera, c0, meera.campaigns, ctx))).toBe('blocked')
  })
  it('blocks a discount under the margin floor until marked a loss leader', () => {
    const s = meera.skus[0]
    const deep = newCampaign(meera, 'Percentage off', { reward: { kind: 'pctOff', value: 0.75, target: 'sku', ref: s.id } })
    expect(preflight(deep, meera, c0, meera.campaigns, ctx).find((f) => f.id === 'floor')?.level).toBe('block')
    expect(preflight({ ...deep, launch: { lossLeader: true } }, meera, c0, meera.campaigns, ctx).find((f) => f.id === 'floor')?.level).toBe('warn')
  })
  it('runs cleanly for every seller and template', () => {
    for (const s of SELLERS) {
      const c = controlsFor(s)
      for (const camp of s.campaigns) {
        const f = preflight(camp, s, c, s.campaigns, (cart) => cartContext(s, c, cart))
        expect(f.length).toBeGreaterThan(0)
        f.forEach((x) => expect(x.title + x.detail).not.toMatch(/NaN|undefined|Infinity/))
        const e = estimate(camp, s, c)
        expect(Number.isFinite(e.net)).toBe(true)
        mapChannels(camp, s, c).forEach((m) => expect(['native', 'adapted', 'unsupported']).toContain(m.fit))
      }
    }
  })
  it('an exclusive offer does not "stack" with stackable ones; stackable ones do', () => {
    const live = [newCampaign(meera, 'Percentage off', { id: 'l1', status: 'live', startDay: -2, endDay: 20, stacking: 'stackable', reward: { kind: 'amountOff', value: 100 } })]
    const ex = newCampaign(meera, 'Win-back', { stacking: 'exclusive', reward: { kind: 'amountOff', value: 200 } })
    expect(preflight(ex, meera, c0, live, ctx).some((f) => f.id === 'conflict')).toBe(false)
    expect(preflight({ ...ex, stacking: 'stackable' }, meera, c0, live, ctx).some((f) => f.id === 'conflict')).toBe(true)
  })
  it('maps a tiered offer on Meesho to the nearest format, not native', () => {
    const farhan = SELLERS.find((s) => s.id === 'farhan')!
    const t = newCampaign(farhan, 'Tiered', { channel: 'meesho', reward: { kind: 'tiered', tiers: [{ min: 999, off: 100 }] } })
    expect(mapChannels(t, farhan, controlsFor(farhan))[0].fit).not.toBe('native')
  })
})

describe('edge-case lab', () => {
  it('has ~50 cases and every demo runs cleanly', () => {
    expect(CASES.length).toBeGreaterThanOrEqual(45)
    for (const c of CASES.filter((x) => x.demo)) {
      const d = DEMOS[c.demo!]
      expect(d, c.id).toBeTruthy()
      const r = d.run(Object.fromEntries(d.inputs.map((i) => [i.key, i.value])))
      expect(r.without + r.with + r.detail).not.toMatch(/NaN|undefined|Infinity/)
    }
  })
})
