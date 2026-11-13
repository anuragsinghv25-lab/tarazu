import type { Campaign, Cart, Condition, Reward, Sku } from './types'

/* ─────────────────────────────────────────────────────────────
   The execution engine: decides, for one cart, which promotions
   apply, in what order, and what each one costs the seller.
   Gates, in order:  WHO → IF → STACK → LIMITS → applied
   ───────────────────────────────────────────────────────────── */

export interface CartCtx {
  skus: Sku[]
  commission: number
  payment: number
  /** ₹ charged to the customer when no free-shipping offer applies. */
  shippingFee: number
  /** ₹ the seller pays the courier for this order. */
  courier: number
  marginFloor: number
  /** Most discount the seller is willing to give on one order. */
  maxOrderDiscount: number
  /** Treat this campaign as live, to test a draft. */
  preview?: string
  today?: number
}

export type GateKey = 'who' | 'if' | 'stack' | 'limits'
export const GATES: { key: GateKey; label: string }[] = [
  { key: 'who', label: 'Who' }, { key: 'if', label: 'If' }, { key: 'stack', label: 'Stack' }, { key: 'limits', label: 'Limits' },
]

export interface Check { label: string; ok: boolean; hint?: string }

export interface Eval {
  campaign: Campaign
  checks: Check[]
  gates: Record<GateKey, boolean | null>
  stopAt: GateKey | null
  reason: string
  /** ₹ off the price the customer pays. */
  discount: number
  capped: boolean
  freeItem?: { sku: Sku; value: number }
  freeShipping?: boolean
  points?: number
  cashback?: number
  sellerCost: number
  partnerCost: number
  nudge?: string
}

export interface CartResult {
  lines: { sku: Sku; qty: number; gross: number }[]
  units: number
  subtotal: number
  discount: number
  shipping: number
  total: number
  saved: number
  cashback: number
  points: number
  freeItems: { sku: Sku; value: number }[]
  sellerFunded: number
  partnerFunded: number
  cogs: number
  fees: number
  courier: number
  extraCosts: number
  margin: number
  marginPct: number
  evals: Eval[]
  leak: { amount: number; reasons: string[]; fix?: { id: string; label: string; patch: Partial<Campaign> } } | null
}

/** Lower-case only the first letter, so codes like GLOW15 survive inside a sentence. */
export const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
export const PAYMENTS: Record<string, string> = { upi: 'UPI', 'credit-card': 'Credit card', 'debit-card': 'Debit card', emi: 'EMI', cod: 'Cash on delivery' }
export const SEGMENTS: Record<string, string> = { all: 'Everyone', new: 'New customers', regular: 'Regular customers', gold: 'Gold members', lapsed: 'Lapsed 90+ days' }

const defaultShare = (c: Campaign) => c.partnerShare ?? (c.funding === 'seller' ? 0 : c.funding === 'co-funded' ? 0.5 : 1)

function unitsOf(lines: CartResult['lines'], ref: { sku?: string; category?: string }) {
  return lines.filter((l) => (ref.sku ? l.sku.id === ref.sku : ref.category ? l.sku.category === ref.category : true))
}

export function describeCondition(c: Condition, skus: Sku[]): string {
  const name = (id: string) => skus.find((s) => s.id === id)?.line ?? id
  switch (c.kind) {
    case 'cartMin': return `Cart is ${inr(c.value)} or more`
    case 'hasCategory': return `Cart has any ${c.value.toLowerCase()}`
    case 'hasSku': return `Cart has ${name(c.value)}`
    case 'qtyMin': return `${c.value}+ units of ${c.sku ? name(c.sku) : (c.category ?? 'anything').toLowerCase()}`
    case 'code': return `Code ${c.value} entered`
    case 'payment': return `Paid by ${PAYMENTS[c.value] ?? c.value}`
  }
}

export function describeReward(r: Reward, skus: Sku[]): string {
  const name = (id: string) => skus.find((s) => s.id === id)?.line ?? id
  switch (r.kind) {
    case 'pctOff': return `${Math.round(r.value * 100)}% off ${r.target === 'cart' ? 'the order' : r.target === 'category' ? (r.ref ?? '').toLowerCase() : name(r.ref ?? '')}`
    case 'amountOff': return `${inr(r.value)} off the order`
    case 'tiered': return r.tiers.map((t) => `${inr(t.off)} off at ${inr(t.min)}`).join(', ')
    case 'bxgy': return `Buy ${r.buy}, get ${r.get} ${r.getPct >= 1 ? 'free' : `at ${Math.round(r.getPct * 100)}% off`} (${r.refKind === 'sku' ? name(r.ref) : r.ref.toLowerCase()})`
    case 'multiBuy': return `${r.qty} for ${inr(r.price)} (${r.refKind === 'sku' ? name(r.ref) : r.ref.toLowerCase()})`
    case 'freeItem': return `Free ${name(r.sku)}`
    case 'freeShipping': return 'Free shipping'
    case 'bundlePrice': return `${r.skus.map(name).join(' + ')} for ${inr(r.price)}`
    case 'points': return `${r.multiplier}× loyalty points`
    case 'cashback': return `${Math.round(r.pct * 100)}% cashback up to ${inr(r.max)}`
  }
}

function checkCondition(c: Condition, lines: CartResult['lines'], subtotal: number, cart: Cart, skus: Sku[]): Check {
  const label = describeCondition(c, skus)
  switch (c.kind) {
    case 'cartMin': return { label, ok: subtotal >= c.value, hint: `add ${inr(c.value - subtotal)} more` }
    case 'hasCategory': return { label, ok: lines.some((l) => l.sku.category === c.value), hint: `add any ${c.value.toLowerCase()}` }
    case 'hasSku': return { label, ok: lines.some((l) => l.sku.id === c.value), hint: `add ${skus.find((s) => s.id === c.value)?.line ?? 'the product'}` }
    case 'qtyMin': {
      const n = unitsOf(lines, c).reduce((a, l) => a + l.qty, 0)
      return { label, ok: n >= c.value, hint: `add ${c.value - n} more` }
    }
    case 'code': return { label, ok: cart.code.trim().toUpperCase() === c.value.toUpperCase(), hint: `enter code ${c.value}` }
    case 'payment': return { label, ok: cart.payment === c.value, hint: `pay by ${PAYMENTS[c.value] ?? c.value}` }
  }
}

function rewardValue(r: Reward, lines: CartResult['lines'], base: number, subtotal: number, skus: Sku[]): { discount: number; freeItem?: Sku; freeShipping?: boolean; pointsMult?: number; cashback?: { pct: number; max: number } } {
  switch (r.kind) {
    case 'pctOff': {
      if (r.target === 'cart') return { discount: base * r.value }
      const g = r.target === 'category' ? unitsOf(lines, { category: r.ref }) : unitsOf(lines, { sku: r.ref })
      return { discount: g.reduce((a, l) => a + l.gross, 0) * r.value }
    }
    case 'amountOff': return { discount: Math.min(r.value, base) }
    case 'tiered': {
      const t = [...r.tiers].sort((a, b) => b.min - a.min).find((x) => subtotal >= x.min)
      return { discount: t ? Math.min(t.off, base) : 0 }
    }
    case 'bxgy': {
      const g = unitsOf(lines, r.refKind === 'sku' ? { sku: r.ref } : { category: r.ref })
      const prices = g.flatMap((l) => Array(l.qty).fill(l.sku.price) as number[]).sort((a, b) => a - b)
      const free = Math.floor(prices.length / (r.buy + r.get)) * r.get
      return { discount: prices.slice(0, free).reduce((a, b) => a + b, 0) * r.getPct }
    }
    case 'multiBuy': {
      const g = unitsOf(lines, r.refKind === 'sku' ? { sku: r.ref } : { category: r.ref })
      const n = g.reduce((a, l) => a + l.qty, 0)
      const unit = n ? g.reduce((a, l) => a + l.gross, 0) / n : 0
      return { discount: Math.max(0, Math.floor(n / r.qty) * (r.qty * unit - r.price)) }
    }
    case 'freeItem': return { discount: 0, freeItem: skus.find((s) => s.id === r.sku) }
    case 'freeShipping': return { discount: 0, freeShipping: true }
    case 'bundlePrice': {
      const items = r.skus.map((id) => lines.find((l) => l.sku.id === id))
      if (items.some((x) => !x)) return { discount: 0 }
      return { discount: Math.max(0, items.reduce((a, l) => a + l!.sku.price, 0) - r.price) }
    }
    case 'points': return { discount: 0, pointsMult: r.multiplier }
    case 'cashback': return { discount: 0, cashback: { pct: r.pct, max: r.max } }
  }
}

export function evaluateCart(cart: Cart, campaigns: Campaign[], ctx: CartCtx): CartResult {
  const skuMap = new Map(ctx.skus.map((s) => [s.id, s]))
  const lines = cart.lines.filter((l) => l.qty > 0 && skuMap.has(l.skuId)).map((l) => {
    const sku = skuMap.get(l.skuId)!
    return { sku, qty: l.qty, gross: sku.price * l.qty }
  })
  const units = lines.reduce((a, l) => a + l.qty, 0)
  const subtotal = lines.reduce((a, l) => a + l.gross, 0)
  const ordered = [...campaigns].sort((a, b) => a.priority - b.priority)

  const evals: Eval[] = []
  let priceDiscount = 0
  let exclusive: Campaign | null = null
  const applied: Campaign[] = []
  let freeShipping = false
  const freeItems: { sku: Sku; value: number }[] = []
  let pointsMult = 1
  let cashbackRule: { pct: number; max: number; share: number; id: string } | null = null

  for (const c of ordered) {
    const live = c.status === 'live' || c.id === ctx.preview
    const e: Eval = { campaign: c, checks: [], gates: { who: null, if: null, stack: null, limits: null }, stopAt: null, reason: '', discount: 0, capped: false, sellerCost: 0, partnerCost: 0 }
    const stop = (g: GateKey, reason: string) => { e.gates[g] = false; e.stopAt = g; e.reason = reason; evals.push(e) }

    // WHO
    if (!live) { stop('who', c.status === 'scheduled' ? `Scheduled: starts in ${c.startDay} days` : c.status === 'draft' ? 'Draft: not live yet' : c.status === 'review' ? 'Waiting for approval' : c.status === 'approved' ? 'Approved, not yet live' : c.status === 'paused' ? 'Paused' : 'Ended'); continue }
    if (c.channel !== 'all' && c.channel !== cart.channel) { stop('who', 'Runs on another channel'); continue }
    if (c.segment !== 'all' && c.segment !== cart.segment) { stop('who', `Only for ${SEGMENTS[c.segment].toLowerCase()}`); continue }
    e.gates.who = true

    // IF
    e.checks = c.conditions.map((x) => checkCondition(x, lines, subtotal, cart, ctx.skus))
    const condOk = c.conditions.length === 0 || (c.match === 'all' ? e.checks.every((x) => x.ok) : e.checks.some((x) => x.ok))
    const rv = rewardValue(c.reward, lines, Math.max(0, subtotal - priceDiscount), subtotal, ctx.skus)
    const hasValue = rv.discount > 0.5 || !!rv.freeItem || rv.freeShipping || !!rv.pointsMult || !!rv.cashback
    if (!condOk || !hasValue) {
      const missing = e.checks.filter((x) => !x.ok)
      const firstHint = missing[0]?.hint
      stop('if', missing.length ? `Needs: ${missing.map((x) => lc(x.label)).join(c.match === 'all' ? ' and ' : ' or ')}` : 'Nothing in the cart this offer applies to')
      if (firstHint && missing.length === 1 && missing[0].label.indexOf('Code') !== 0) e.nudge = `${firstHint[0].toUpperCase()}${firstHint.slice(1)} to unlock ${c.name}`
      continue
    }
    e.gates.if = true

    // STACK
    if (exclusive && c.stacking !== 'always') { stop('stack', `Blocked: "${exclusive.name}" is exclusive and won first`); continue }
    const nonAlways = applied.filter((a) => a.stacking !== 'always')
    if (c.stacking === 'exclusive' && nonAlways.length) { stop('stack', `Exclusive, but "${nonAlways[0].name}" already applied at higher priority`); continue }
    e.gates.stack = true

    // LIMITS
    const used = cart.usedBefore?.[c.id] ?? 0
    if (c.perCustomer !== undefined && used >= c.perCustomer) { stop('limits', `Already used ${used}× by this customer (limit ${c.perCustomer})`); continue }
    if (c.totalRedemptions !== undefined && c.redeemed >= c.totalRedemptions) { stop('limits', `All ${c.totalRedemptions} redemptions used`); continue }
    if (c.spent >= c.budget) { stop('limits', 'Budget used up'); continue }
    e.gates.limits = true

    // APPLY
    const share = defaultShare(c)
    let d = rv.discount
    if (c.maxDiscount !== undefined && d > c.maxDiscount) { d = c.maxDiscount; e.capped = true }
    d = Math.min(d, Math.max(0, subtotal - priceDiscount))
    e.discount = d
    priceDiscount += d
    e.sellerCost = d * (1 - share)
    e.partnerCost = d * share
    if (rv.freeItem) { e.freeItem = { sku: rv.freeItem, value: rv.freeItem.price }; freeItems.push(e.freeItem); e.sellerCost += rv.freeItem.cost }
    if (rv.freeShipping) { e.freeShipping = true; freeShipping = true; e.sellerCost += ctx.shippingFee }
    if (rv.pointsMult) pointsMult = Math.max(pointsMult, rv.pointsMult)
    if (rv.cashback) cashbackRule = { ...rv.cashback, share, id: c.id }
    e.reason = e.capped ? `Applied, capped at ${inr(c.maxDiscount!)}` : 'Applied'
    if (c.stacking === 'exclusive') exclusive = c
    applied.push(c)
    evals.push(e)
  }

  const afterDiscount = Math.max(0, subtotal - priceDiscount)
  const shipping = lines.length && !freeShipping ? ctx.shippingFee : 0
  const total = afterDiscount + shipping

  // Post-order rewards
  let cashback = 0
  if (cashbackRule) {
    cashback = Math.min(afterDiscount * cashbackRule.pct, cashbackRule.max)
    const e = evals.find((x) => x.campaign.id === cashbackRule!.id)!
    e.cashback = cashback; e.sellerCost += cashback * (1 - cashbackRule.share); e.partnerCost += cashback * cashbackRule.share
  }
  const points = pointsMult > 1 ? Math.round(afterDiscount * 0.05 * pointsMult) : 0
  let pointsCost = 0
  if (points) {
    const extra = points - Math.round(afterDiscount * 0.05)
    pointsCost = extra * 0.7 // ₹1 a point, ~30% never redeemed
    const e = evals.find((x) => x.campaign.reward.kind === 'points' && x.stopAt === null)
    if (e) { e.points = points; e.sellerCost += pointsCost }
  }

  const appliedEvals = evals.filter((e) => e.stopAt === null)
  const partnerFunded = appliedEvals.reduce((a, e) => a + e.partnerCost, 0)
  const sellerFunded = appliedEvals.reduce((a, e) => a + e.sellerCost, 0)
  const pricePartner = appliedEvals.reduce((a, e) => a + (e.discount > 0 ? e.discount * defaultShare(e.campaign) : 0), 0)
  const cogs = lines.reduce((a, l) => a + l.sku.cost * l.qty, 0) + freeItems.reduce((a, f) => a + f.sku.cost, 0)
  const fees = afterDiscount * (ctx.commission + ctx.payment)
  const sellerCashback = cashbackRule ? cashback * (1 - cashbackRule.share) : 0
  const extraCosts = sellerCashback + pointsCost
  const margin = lines.length ? total + pricePartner - fees - cogs - (lines.length ? ctx.courier : 0) - extraCosts : 0
  const marginPct = subtotal ? margin / subtotal : 0

  // Leakage: stacked offers that give away more than the seller ever intended.
  let leak: CartResult['leak'] = null
  if (lines.length) {
    const reasons: string[] = []
    let amount = 0
    const sellerPriceDiscount = priceDiscount - pricePartner
    const cap = ctx.maxOrderDiscount * subtotal
    if (sellerPriceDiscount > cap + 1) { reasons.push(`Offers stacked to ${Math.round((sellerPriceDiscount / subtotal) * 100)}% off, past your ${Math.round(ctx.maxOrderDiscount * 100)}% per-order limit`); amount = Math.max(amount, sellerPriceDiscount - cap) }
    if (marginPct < ctx.marginFloor) reasons.push(`Order margin ${Math.round(marginPct * 100)}% is below your ${Math.round(ctx.marginFloor * 100)}% floor`)
    const codeStack = appliedEvals.find((e) => e.campaign.conditions.some((x) => x.kind === 'code') && e.campaign.stacking === 'stackable' && appliedEvals.some((o) => o !== e && o.discount > 0 && o.campaign.stacking !== 'always'))
    if (codeStack) {
      const others = appliedEvals.filter((o) => o !== codeStack && o.discount > 0 && o.campaign.stacking !== 'always')
      reasons.push(`Code offer "${codeStack.campaign.name}" stacked with ${others.map((o) => `"${o.campaign.name}"`).join(', ')}`)
      amount = Math.max(amount, Math.min(codeStack.discount, others.reduce((a, o) => a + o.discount, 0)))
    }
    if (reasons.length) {
      const fix = codeStack
        ? { id: codeStack.campaign.id, label: `Make "${codeStack.campaign.name}" exclusive`, patch: { stacking: 'exclusive' as const } }
        : appliedEvals.filter((e) => e.discount > 0 && e.campaign.maxDiscount === undefined).sort((a, b) => b.discount - a.discount)[0]
          ? (() => { const big = appliedEvals.filter((e) => e.discount > 0 && e.campaign.maxDiscount === undefined).sort((a, b) => b.discount - a.discount)[0]; const capTo = Math.max(50, Math.round(big.discount * 0.5 / 50) * 50); return { id: big.campaign.id, label: `Cap "${big.campaign.name}" at ${inr(capTo)}`, patch: { maxDiscount: capTo } } })()
          : undefined
      leak = { amount, reasons, fix }
    }
  }

  return {
    lines, units, subtotal, discount: priceDiscount, shipping, total,
    saved: priceDiscount + freeItems.reduce((a, f) => a + f.value, 0) + (freeShipping ? ctx.shippingFee : 0) + cashback,
    cashback, points, freeItems, sellerFunded, partnerFunded, cogs, fees, courier: lines.length ? ctx.courier : 0, extraCosts,
    margin, marginPct, evals, leak,
  }
}

/* ───────── Campaign economics for the builder ───────── */

export function costPerRedemption(c: Campaign, avgOrder: number, skus: Sku[], shippingFee: number): number {
  const r = c.reward
  const price = (id: string) => skus.find((s) => s.id === id)?.price ?? 0
  const cost = (id: string) => skus.find((s) => s.id === id)?.cost ?? 0
  let v = 0
  switch (r.kind) {
    case 'pctOff': v = r.target === 'cart' ? avgOrder * r.value : (r.target === 'sku' ? price(r.ref ?? '') : avgOrder * 0.4) * r.value; break
    case 'amountOff': v = r.value; break
    case 'tiered': v = r.tiers.reduce((a, t) => a + t.off, 0) / Math.max(1, r.tiers.length); break
    case 'bxgy': v = (r.refKind === 'sku' ? price(r.ref) : avgOrder * 0.3) * r.getPct * r.get; break
    case 'multiBuy': v = Math.max(0, (r.refKind === 'sku' ? price(r.ref) : avgOrder * 0.25) * r.qty - r.price); break
    case 'freeItem': v = cost(r.sku); break
    case 'freeShipping': v = shippingFee || 40; break
    case 'bundlePrice': v = Math.max(0, r.skus.reduce((a, id) => a + price(id), 0) - r.price); break
    case 'points': v = avgOrder * 0.05 * (r.multiplier - 1) * 0.7; break
    case 'cashback': v = Math.min(avgOrder * r.pct, r.max); break
  }
  if (c.maxDiscount !== undefined) v = Math.min(v, c.maxDiscount)
  return v * (1 - defaultShare(c))
}

export interface Burn { day: number; spend: number; budget: number }

/** Projected spend from today to the campaign's end, against its budget. */
export function burnDown(c: Campaign, perRedemption: number) {
  const pts: Burn[] = []
  let spend = c.spent
  let exhaustDay: number | null = null
  const start = Math.max(0, c.startDay)
  for (let d = Math.min(0, c.startDay); d <= c.endDay; d++) {
    if (d >= start && d > 0) spend += c.dailyRedemptions * perRedemption
    if (exhaustDay === null && spend >= c.budget) exhaustDay = d
    pts.push({ day: d, spend: Math.round(spend), budget: c.budget })
  }
  const days = Math.max(1, c.endDay - Math.max(0, c.startDay))
  const redemptions = c.redeemed + c.dailyRedemptions * days
  return { pts, exhaustDay, projected: spend, redemptions }
}
