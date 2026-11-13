import type { Campaign, Condition, Reward } from '@/engine/types'
import type { SellerDef } from '@/data/sellers'
import { skuOf } from '@/data/sellers'

const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
const r50 = (n: number) => Math.max(50, Math.round(n / 50) * 50)

/** One template per mechanic, filled with the current seller's own products and order sizes. */
export function templates(s: SellerDef): { mechanic: string; blurb: string; make: () => Partial<Campaign> }[] {
  const shelf = s.shelf.map((id) => skuOf(s, id)!).filter(Boolean)
  const cheap = [...shelf].sort((a, b) => a.price - b.price)[0]
  const hero = skuOf(s, s.heroSkuId)!
  const [a, b] = shelf
  const own = Object.keys(s.market.channels).find((k) => k === 'website') ?? Object.keys(s.market.channels)[0]
  const out: { mechanic: string; blurb: string; make: () => Partial<Campaign> }[] = [
    { mechanic: 'Percentage off', blurb: 'X% off the order above a minimum', make: () => ({ conditions: [{ kind: 'cartMin', value: r50(s.avgOrder * 0.8) }], reward: { kind: 'pctOff', value: 0.15, target: 'cart' }, maxDiscount: r50(s.avgOrder * 0.2) }) },
    { mechanic: 'Fixed amount off', blurb: '₹ off for new customers', make: () => ({ segment: 'new', conditions: [{ kind: 'cartMin', value: r50(s.avgOrder * 0.6) }], reward: { kind: 'amountOff', value: r50(s.avgOrder * 0.12) }, perCustomer: 1 }) },
    { mechanic: 'Tiered spend', blurb: 'Spend more, save more', make: () => ({ conditions: [{ kind: 'cartMin', value: r50(s.avgOrder * 0.9) }], reward: { kind: 'tiered', tiers: [{ min: r50(s.avgOrder * 0.9), off: r50(s.avgOrder * 0.08) }, { min: r50(s.avgOrder * 1.7), off: r50(s.avgOrder * 0.2) }] } }) },
    { mechanic: 'Buy X get Y', blurb: 'Buy 2, get 1 free in a category', make: () => ({ conditions: [{ kind: 'qtyMin', value: 3, category: a.category }], reward: { kind: 'bxgy', buy: 2, get: 1, getPct: 1, ref: a.category, refKind: 'category' } }) },
    { mechanic: 'Multi-buy', blurb: '3 for a fixed price', make: () => ({ conditions: [{ kind: 'qtyMin', value: 3, sku: cheap.id }], reward: { kind: 'multiBuy', qty: 3, price: Math.round(cheap.price * 3 * 0.8), ref: cheap.id, refKind: 'sku' } }) },
    { mechanic: 'Bundle', blurb: 'Two products at one price', make: () => ({ conditions: [{ kind: 'hasSku', value: a.id }, { kind: 'hasSku', value: b.id }], reward: { kind: 'bundlePrice', skus: [a.id, b.id], price: Math.round((a.price + b.price) * 0.85) } }) },
    { mechanic: 'Gift with purchase', blurb: 'A free item above a spend', make: () => ({ conditions: [{ kind: 'cartMin', value: r50(s.avgOrder * 1.3) }], reward: { kind: 'freeItem', sku: cheap.id }, perCustomer: 1 }) },
    { mechanic: 'Coupon', blurb: 'A code shared by an influencer or SMS', make: () => ({ conditions: [{ kind: 'code', value: `${s.brand.split(' ')[0].toUpperCase().slice(0, 6)}10` }], reward: { kind: 'pctOff', value: 0.1, target: 'cart' }, maxDiscount: r50(s.avgOrder * 0.15), perCustomer: 1, stacking: 'exclusive' }) },
    { mechanic: 'Flash deal', blurb: 'Steep, short, limited units', make: () => ({ endDay: 2, conditions: [{ kind: 'hasSku', value: hero.id }], reward: { kind: 'pctOff', value: 0.25, target: 'sku', ref: hero.id }, totalRedemptions: 200, stacking: 'exclusive', dailyRedemptions: 80 }) },
    { mechanic: 'Cashback', blurb: 'Partner-funded money back', make: () => ({ conditions: [{ kind: 'payment', value: 'upi' }], reward: { kind: 'cashback', pct: 0.05, max: 100 }, funding: 'partner', partnerShare: 1, stacking: 'always' }) },
  ]
  if (s.shippingFee > 0) out.push({ mechanic: 'Free shipping', blurb: 'Waive delivery above a spend', make: () => ({ channel: own, conditions: [{ kind: 'cartMin', value: r50(s.avgOrder * 0.5) }], reward: { kind: 'freeShipping' }, stacking: 'always' }) })
  if (s.ownChannel) out.push({ mechanic: 'Loyalty points', blurb: 'Extra points for members', make: () => ({ channel: own, segment: 'gold', conditions: [], reward: { kind: 'points', multiplier: 2 }, stacking: 'always' }) })
  return out
}

export function newCampaign(s: SellerDef, mechanic: string, patch: Partial<Campaign>): Campaign {
  const id = `${mechanic.toLowerCase().replace(/[^a-z]+/g, '-')}-${Date.now().toString(36).slice(-4)}`
  return {
    id, name: `New ${mechanic.toLowerCase()}`, mechanic, status: 'draft', channel: 'all', startDay: 1, endDay: 15,
    budget: Math.round(s.avgOrder * 60 / 1000) * 1000, spent: 0, segment: 'all', match: 'all',
    conditions: [] as Condition[], reward: { kind: 'pctOff', value: 0.1, target: 'cart' } as Reward,
    redeemed: 0, stacking: 'stackable', priority: 5, funding: 'seller', dailyRedemptions: 12,
    ...patch,
  }
}

export function sentence(c: Campaign, s: SellerDef, describeCondition: (x: Condition) => string, describeReward: (r: Reward) => string): string {
  const who = { all: 'Everyone', new: 'New customers', regular: 'Regular customers', gold: 'Gold members', lapsed: 'Customers lapsed 90+ days' }[c.segment]
  const where = c.channel === 'all' ? 'on every channel' : `on ${s.market.channels[c.channel]?.label ?? c.channel}`
  const conds = c.conditions.length ? ` when ${c.conditions.map((x) => lcFirst(describeCondition(x))).join(c.match === 'all' ? ' and ' : ' or ')}` : ''
  const caps = [c.maxDiscount !== undefined && `up to ₹${c.maxDiscount.toLocaleString('en-IN')}`, c.perCustomer !== undefined && `${c.perCustomer === 1 ? 'once' : `${c.perCustomer} times`} per customer`, c.totalRedemptions !== undefined && `first ${c.totalRedemptions.toLocaleString('en-IN')} orders only`].filter(Boolean).join(', ')
  const stack = c.stacking === 'exclusive' ? 'It never combines with other offers.' : c.stacking === 'always' ? 'It always combines, even with exclusive offers.' : 'It combines with other stackable offers.'
  const fund = c.funding === 'seller' ? `${s.name} pays for it.` : `${Math.round((c.partnerShare ?? (c.funding === 'co-funded' ? 0.5 : 1)) * 100)}% is paid by the ${c.funding === 'bank' ? 'bank' : c.funding === 'platform' || c.funding === 'co-funded' ? 'platform' : 'partner'}.`
  return `${who} ${where}${conds} get ${lcFirst(describeReward(c.reward))}${caps ? `, ${caps}` : ''}. ${stack} ${fund}`
}
