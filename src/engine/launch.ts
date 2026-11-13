/* Release 4 · The Launch: the builder half of a promotion engine.
   Pure functions for audiences, codes, schedules, channel formats, pre-flight checks, approvals,
   the campaign lifecycle and live guardrails. The UI composes these; tests pin the rules. */
import type { AudienceRule, Campaign, CampaignStatus, Cart, Controls, Reward, Sku } from './types'
import type { SellerDef } from '@/data/sellers/types'
import { feeFor, recommend, simulate } from './engine'
import { costPerRedemption, evaluateCart, type CartCtx } from './cart'

/* ───────── Audience ───────── */

/** Customers each demo seller can reach directly (own channel + marketplace buyers with consent). */
const CUSTOMERS: Record<string, number> = { meera: 18400, farhan: 52600, kabir: 31200, anaya: 0 }

/** Share of a segment that would have bought anyway, without the offer. */
const ANYWAY: Record<AudienceRule['kind'], number> = { new: 0.15, repeat: 0.55, lapsed: 0.1, member: 0.65, aov: 0.5, city: 0.4, app: 0.45, list: 0.3 }

export const RULE_LABEL: Record<AudienceRule['kind'], string> = {
  new: 'New customers', repeat: 'Repeat buyers', lapsed: 'No order in', member: 'Loyalty members', aov: 'Average order above', city: 'Lives in', app: 'Shops on the app', list: 'Uploaded list',
}

export function describeRule(r: AudienceRule): string {
  switch (r.kind) {
    case 'lapsed': return `No order in ${r.value ?? 90} days`
    case 'aov': return `Average order above ₹${(r.value ?? 999).toLocaleString('en-IN')}`
    case 'city': return `Lives in ${(r.values ?? []).join(', ') || 'any city'}`
    case 'list': return `Uploaded list (${(r.value ?? 0).toLocaleString('en-IN')} people)`
    default: return RULE_LABEL[r.kind]
  }
}

export function audience(rules: AudienceRule[], s: SellerDef) {
  const base = CUSTOMERS[s.id] ?? 0
  if (!base) return { size: 0, anyway: 0, base, note: 'Retail and distributor channels don\'t share shopper data, so offers can\'t be targeted to people.' }
  if (!rules.length) return { size: base, anyway: 0.5, base, note: 'Everyone, including people who would pay full price.' }
  const list = rules.find((r) => r.kind === 'list')
  let share = 1
  for (const r of rules) {
    switch (r.kind) {
      case 'new': share *= 0.22; break
      case 'repeat': share *= 0.45; break
      case 'lapsed': share *= 0.38 * Math.min(1, (r.value ?? 90) / 90) ** -0.35 * 0.8; break
      case 'member': share *= s.loyalty ? s.loyalty.members / base : 0; break
      case 'aov': share *= Math.max(0.02, Math.min(1, Math.exp(-((r.value ?? 999) / s.avgOrder - 0.6)))); break
      case 'city': share *= Math.min(1, (r.values?.length ?? 0) * 0.12); break
      case 'app': share *= 0.38; break
      case 'list': break
    }
  }
  const size = list ? Math.round(Math.min(list.value ?? 0, base) * (share / 1)) : Math.round(base * share)
  // Blended "would buy anyway": the least price-sensitive rule dominates.
  const anyway = Math.max(...rules.map((r) => ANYWAY[r.kind])) * (rules.length > 1 ? 0.85 : 1)
  return { size, anyway, base, note: rules.length > 1 ? 'Rules combine with AND; overlap is assumed independent.' : '' }
}

/* ───────── Codes ───────── */

/** No 0/O, 1/I/L: codes are read aloud, typed on phones and printed on cards. */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function rng(seed: number) {
  let t = seed >>> 0
  return () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296 }
}
const hash = (s: string) => [...s].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) | 0, 7)

/** Random, non-sequential, collision-checked unique codes. Deterministic for a given prefix and seed. */
export function generateCodes(prefix: string, count: number, seed = 1, len = 6): string[] {
  const r = rng(hash(prefix) + seed)
  const out = new Set<string>()
  const p = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
  let guard = 0
  while (out.size < count && guard++ < count * 20) {
    let c = ''
    for (let i = 0; i < len; i++) c += CODE_ALPHABET[Math.floor(r() * CODE_ALPHABET.length)]
    out.add(p ? `${p}-${c}` : c)
  }
  return [...out]
}

export const normaliseCode = (raw: string) => raw.trim().replace(/\s+/g, '').toUpperCase()

/** Leak risk of a code setup, 0 (none) to 1 (will leak). */
export function codeRisk(c: Campaign): { score: number; reasons: string[] } {
  const mode = c.launch?.codes?.mode ?? (c.conditions.some((k) => k.kind === 'code') ? 'public' : 'auto')
  const reasons: string[] = []
  let score = 0
  if (mode === 'public') { score += 0.45; reasons.push('One public code can be shared on coupon sites') }
  if (mode === 'public' && !c.perCustomer) { score += 0.25; reasons.push('No per-customer limit') }
  if (mode === 'public' && !c.totalRedemptions) { score += 0.15; reasons.push('No cap on total uses') }
  if (c.stacking !== 'exclusive' && mode !== 'auto') { score += 0.15; reasons.push('Stacks with other offers') }
  if (mode === 'bulk') reasons.push('Single-use codes: a shared code works once')
  return { score: Math.min(1, score), reasons }
}

/* ───────── Schedule ───────── */

export const RECURRING: Record<NonNullable<NonNullable<Campaign['launch']>['recurring']>, string> = {
  none: 'Runs continuously', weekends: 'Saturdays and Sundays only', evenings: 'Every evening, 8 to 10 pm', flash: 'Flash slots you choose',
}

/** Active windows in the next `days` days, as day offsets with hours. */
export function windows(c: Campaign, todayDow: number, days = 14): { day: number; from: number; to: number }[] {
  const L = c.launch ?? {}
  const out: { day: number; from: number; to: number }[] = []
  const start = Math.max(0, c.startDay), end = Math.min(c.endDay, days)
  for (let d = start; d <= end; d++) {
    const dow = (todayDow + d) % 7
    if (L.recurring === 'weekends' && dow !== 6 && dow !== 0) continue
    if (L.recurring === 'flash') continue
    out.push(L.recurring === 'evenings' ? { day: d, from: 20, to: 22 } : { day: d, from: 0, to: 24 })
  }
  if (L.recurring === 'flash') return (L.flashSlots ?? []).filter((s) => s.day >= start && s.day <= end)
  return out
}

/** Order time decides, not payment time; a grace window covers slow payments. */
export function orderQualifies(orderedAtMin: number, paidAtMin: number, endAtMin: number, graceMin = 15) {
  return { byOrder: orderedAtMin <= endAtMin, byPayment: paidAtMin <= endAtMin, withGrace: orderedAtMin <= endAtMin && paidAtMin <= endAtMin + graceMin }
}

/* ───────── Channel format mapping (illustrative) ───────── */

type Fit = 'native' | 'adapted' | 'unsupported'
interface Format { name: string; fits: Reward['kind'][]; note: string; codes?: boolean; targeting?: boolean }

/** How each channel can express an offer. Illustrative of typical seller-panel options, not official rules. */
export const FORMATS: Record<string, Format[]> = {
  amazon: [
    { name: 'Coupon', fits: ['pctOff', 'amountOff'], note: 'Clip-on coupon on the product page; charged per redemption', codes: false },
    { name: 'Lightning Deal', fits: ['pctOff'], note: 'Time-boxed deal on one product; deal fee; needs stock' },
    { name: 'Buy One Get One promotion', fits: ['bxgy', 'multiBuy'], note: 'Quantity-based promotion' },
    { name: 'Promo code', fits: ['pctOff', 'amountOff', 'freeShipping'], note: 'Claim code for social and influencer use', codes: true },
  ],
  flipkart: [
    { name: 'Deal of the Day', fits: ['pctOff'], note: 'Single-day placement for one product; deal slot fee' },
    { name: 'Flash sale', fits: ['pctOff', 'amountOff'], note: 'Short window, limited stock' },
    { name: 'Buy more, save more', fits: ['tiered', 'multiBuy', 'bxgy'], note: 'Quantity or value tiers' },
    { name: 'Combo offer', fits: ['bundlePrice'], note: 'Pre-built bundle listing' },
  ],
  meesho: [
    { name: 'Product discount', fits: ['pctOff', 'amountOff'], note: 'Lower price on the listing; no codes, no targeting' },
    { name: 'Sale event entry', fits: ['pctOff'], note: 'Opt in to a platform sale with a minimum discount' },
  ],
  nykaa: [
    { name: 'Brand offer', fits: ['pctOff', 'amountOff'], note: 'On product or brand page' },
    { name: 'Gift with purchase', fits: ['freeItem'], note: 'Free gift above a value' },
    { name: 'Combo', fits: ['bundlePrice', 'multiBuy'], note: 'Bundle listing' },
  ],
  website: [{ name: 'Native rule', fits: ['pctOff', 'amountOff', 'tiered', 'bxgy', 'multiBuy', 'freeItem', 'freeShipping', 'bundlePrice', 'points', 'cashback'], note: 'Every mechanic, code type and audience', codes: true, targeting: true }],
  quick: [{ name: 'Combo pack / price point', fits: ['bundlePrice', 'multiBuy', 'pctOff'], note: 'Quick-commerce apps favour packs at ₹99 / ₹199 price points' }],
  modern: [{ name: 'Store promotion', fits: ['pctOff', 'multiBuy', 'bundlePrice', 'freeItem'], note: 'Agreed with the retailer; funded as trade spend' }],
  kirana: [{ name: 'Trade scheme', fits: ['multiBuy', 'freeItem'], note: 'Runs through the distributor; see Brand mode' }],
}

const NEAREST: Partial<Record<Reward['kind'], Reward['kind'][]>> = { tiered: ['amountOff', 'pctOff'], bxgy: ['multiBuy', 'pctOff'], multiBuy: ['bxgy', 'pctOff'], freeItem: ['amountOff'], bundlePrice: ['multiBuy', 'pctOff'], points: ['pctOff'], cashback: ['pctOff'], freeShipping: ['amountOff'] }

export function mapChannels(c: Campaign, s: SellerDef, ctl: Controls) {
  const chans = c.launch?.channels?.length ? c.launch.channels : c.channel === 'all' ? Object.keys(s.market.channels) : [c.channel]
  const hasCode = (c.launch?.codes?.mode ?? 'auto') !== 'auto' || c.conditions.some((k) => k.kind === 'code')
  const targeted = (c.launch?.audience?.length ?? 0) > 0 || c.segment !== 'all'
  return chans.filter((ch) => s.market.channels[ch]).map((ch) => {
    const formats = FORMATS[ch] ?? FORMATS.website
    const exact = formats.find((f) => f.fits.includes(c.reward.kind))
    const near = exact ? null : formats.find((f) => (NEAREST[c.reward.kind] ?? []).some((k) => f.fits.includes(k)))
    let fit: Fit = exact ? 'native' : near ? 'adapted' : 'unsupported'
    const notes: string[] = []
    if (exact) notes.push(exact.note)
    if (near) notes.push(`Not available as is; nearest: ${near.name}. ${near.note}`)
    if (hasCode && !(exact ?? near)?.codes && fit !== 'unsupported') { notes.push('Codes aren\'t supported here: the offer runs without one'); fit = 'adapted' }
    if (targeted && !(exact ?? near)?.targeting && fit !== 'unsupported') { notes.push('No audience targeting: everyone on this channel sees it'); fit = 'adapted' }
    const f = feeFor(ch, ctl)
    return { channel: ch, label: s.market.channels[ch].label, format: (exact ?? near)?.name ?? '—', fit, notes, commission: f.commission, funding: s.market.channels[ch].funding }
  })
}

/* ───────── Impact estimate for a draft ───────── */

function equivalentDepth(r: Reward, s: Sku | undefined): number | null {
  switch (r.kind) {
    case 'pctOff': return r.value
    case 'bxgy': return (r.get * r.getPct) / (r.buy + r.get)
    case 'multiBuy': return s ? Math.max(0, 1 - r.price / (s.price * r.qty)) : null
    default: return null
  }
}

export function targetSkus(c: Campaign, skus: Sku[]): Sku[] {
  const r = c.reward
  const ids = new Set<string>()
  const cats = new Set<string>()
  if (r.kind === 'pctOff' && r.ref) (r.target === 'sku' ? ids : cats).add(r.ref)
  if ((r.kind === 'bxgy' || r.kind === 'multiBuy') && r.ref) (r.refKind === 'sku' ? ids : cats).add(r.ref)
  for (const k of c.conditions) { if (k.kind === 'hasSku') ids.add(k.value); if (k.kind === 'hasCategory') cats.add(k.value) }
  return skus.filter((k) => ids.has(k.id) || cats.has(k.category)).slice(0, 24)
}

/** What the draft should earn and give away over its run: product-level offers use the Scale,
 *  cart-level offers use cost per redemption against orders the audience wouldn't have placed. */
export function estimate(c: Campaign, s: SellerDef, ctl: Controls) {
  const days = Math.max(1, c.endDay - Math.max(0, c.startDay))
  const weeks = Math.max(1, Math.round(days / 7))
  const targets = targetSkus(c, s.skus)
  const depth = equivalentDepth(c.reward, targets[0])
  if (targets.length && depth !== null) {
    const sims = targets.map((k) => simulate(k, ctl, { discount: Math.min(0.7, depth), weeks: Math.min(8, weeks), channel: 'blended' }))
    const given = sims.reduce((a, r) => a + r.given, 0), earned = sims.reduce((a, r) => a + r.earned, 0)
    return { method: 'scale' as const, given, earned, net: earned - given, redemptions: sims.reduce((a, r) => a + r.promoUnits, 0), skus: targets.length, depth }
  }
  const aud = audience(c.launch?.audience ?? [], s)
  const per = costPerRedemption(c, s.avgOrder, s.skus, s.shippingFee)
  const redemptions = Math.round(c.dailyRedemptions * days * (aud.size && aud.base ? Math.min(1.4, 0.6 + aud.size / aud.base) : 1))
  const incremental = redemptions * (1 - aud.anyway)
  const marginPerOrder = s.avgOrder * 0.42
  const given = redemptions * per
  const earned = incremental * marginPerOrder
  return { method: 'orders' as const, given, earned, net: earned - given, redemptions, skus: 0, depth: null }
}

/* ───────── Pre-flight ───────── */

export type Level = 'block' | 'warn' | 'ok' | 'info'
export interface Flight { id: string; level: Level; title: string; detail: string; fix?: { label: string; patch: Partial<Campaign> } }

const overlaps = (a: Campaign, b: Campaign) => a.startDay <= b.endDay && b.startDay <= a.endDay

/** A cart that satisfies the campaign's conditions, to price the worst case. */
export function qualifyingCart(c: Campaign, s: SellerDef): Cart {
  const lines: Cart['lines'] = []
  const add = (id: string, q = 1) => { const ex = lines.find((l) => l.skuId === id); if (ex) ex.qty += q; else lines.push({ skuId: id, qty: q }) }
  const t = targetSkus(c, s.skus)
  if (t[0]) add(t[0].id, c.reward.kind === 'bxgy' ? c.reward.buy + c.reward.get : c.reward.kind === 'multiBuy' ? c.reward.qty : 1)
  if (c.reward.kind === 'bundlePrice') c.reward.skus.forEach((id) => add(id))
  if (c.reward.kind === 'freeItem') add(c.reward.sku, 0)
  const min = Math.max(...c.conditions.map((k) => (k.kind === 'cartMin' ? k.value : 0)), c.reward.kind === 'tiered' ? Math.max(...c.reward.tiers.map((x) => x.min)) : 0)
  const filler = [...s.skus].sort((a, b) => b.price - a.price)
  let total = lines.reduce((a, l) => a + (s.skus.find((k) => k.id === l.skuId)?.price ?? 0) * l.qty, 0)
  for (const f of filler) { if (total >= min) break; add(f.id); total += f.price }
  if (!lines.length) add(filler[Math.floor(filler.length / 2)].id)
  const code = c.conditions.find((k) => k.kind === 'code')?.value ?? ''
  const pay = c.conditions.find((k) => k.kind === 'payment')?.value ?? 'upi'
  const seg = c.segment === 'all' ? 'regular' : c.segment
  return { lines: lines.filter((l) => l.qty > 0), segment: seg, code, payment: pay, channel: c.channel === 'all' ? Object.keys(s.market.channels)[0] : c.channel }
}

export function preflight(c: Campaign, s: SellerDef, ctl: Controls, all: Campaign[], ctx: (cart: Cart) => CartCtx): Flight[] {
  const out: Flight[] = []
  const L = c.launch ?? {}
  // 1 · Margin floor and profit cliff on the products it discounts
  const targets = targetSkus(c, s.skus)
  const depth = equivalentDepth(c.reward, targets[0])
  if (targets.length && depth !== null) {
    const below = targets.filter((k) => (k.price * (1 - depth) - k.cost - k.price * (1 - depth) * feeFor('blended', ctl).commission) / (k.price * (1 - depth)) < ctl.marginFloor)
    if (below.length && !L.lossLeader) out.push({ id: 'floor', level: 'block', title: `${below.length} product${below.length > 1 ? 's fall' : ' falls'} below the ${Math.round(ctl.marginFloor * 100)}% margin floor`, detail: `${below.slice(0, 3).map((k) => k.line).join(', ')}${below.length > 3 ? '…' : ''} would sell under the floor at this depth. Lower the discount, drop them, or mark this a deliberate loss leader.`, fix: { label: 'Mark as a loss leader', patch: { launch: { ...L, lossLeader: true } } } })
    else if (below.length) out.push({ id: 'floor', level: 'warn', title: 'Loss leader: below the margin floor on purpose', detail: 'Recorded with the reason in the audit log. The approver will see it.' })
    else out.push({ id: 'floor', level: 'ok', title: 'Every product stays above the margin floor', detail: `At ${Math.round(depth * 100)}% off, the lowest margin is still above ${Math.round(ctl.marginFloor * 100)}%.` })
    const rec = recommend(targets[0], ctl)
    if (rec.cliff && depth > rec.cliff) out.push({ id: 'cliff', level: 'warn', title: `Past the profit cliff on ${targets[0].line}`, detail: `Above ${Math.round(rec.cliff * 100)}% this product loses money: each extra point of discount costs more than the sales it adds.`, fix: { label: `Cap at ${Math.round(rec.cliff * 100)}%`, patch: c.reward.kind === 'pctOff' ? { reward: { ...c.reward, value: rec.cliff } } : {} } })
  }
  // 2 · Never above MRP
  if (c.reward.kind === 'bundlePrice') {
    const sum = c.reward.skus.reduce((a, id) => a + (s.skus.find((k) => k.id === id)?.price ?? 0), 0)
    if (c.reward.price > sum) out.push({ id: 'mrp', level: 'block', title: 'Bundle price is above the items\' MRP', detail: `₹${c.reward.price} vs ₹${sum} for the items separately. Selling above MRP isn't allowed.`, fix: { label: `Set to ₹${Math.round(sum * 0.9)}`, patch: { reward: { ...c.reward, price: Math.round(sum * 0.9) } } } })
  }
  // 3 · Audience
  const aud = audience(L.audience ?? [], s)
  if ((L.audience?.length ?? 0) > 0 && aud.base && aud.size === 0) out.push({ id: 'audience', level: 'block', title: 'The audience is empty', detail: 'No customer matches every rule. Remove a rule or widen one.' })
  // 4 · Conflicts with live or scheduled offers on the same carts.
  //     Exclusive vs exclusive: they compete (only one applies). Anything vs "always": they stack.
  //     Stackable vs stackable: they stack. Exclusive vs stackable: they don't combine.
  const mine = new Set(targets.map((k) => k.id))
  const sameCarts = (o: Campaign) => {
    const theirs = targetSkus(o, s.skus)
    return !mine.size || !theirs.length || theirs.some((k) => mine.has(k.id))
  }
  const live = all.filter((o) => o.id !== c.id && (o.status === 'live' || o.status === 'scheduled') && overlaps(o, c) && (o.channel === 'all' || c.channel === 'all' || o.channel === c.channel) && sameCarts(o))
  const stacks = live.filter((o) => o.stacking === 'always' || c.stacking === 'always' || (o.stacking === 'stackable' && c.stacking === 'stackable'))
  const competes = live.filter((o) => o.stacking === 'exclusive' && c.stacking === 'exclusive')
  if (stacks.length) out.push({ id: 'conflict', level: 'warn', title: `Stacks with ${stacks.length} live offer${stacks.length > 1 ? 's' : ''}`, detail: `${stacks.slice(0, 2).map((k) => k.name).join('; ')}${stacks.length > 2 ? '…' : ''}. One cart could get both.`, fix: c.stacking !== 'exclusive' ? { label: 'Make it exclusive', patch: { stacking: 'exclusive' } } : undefined })
  if (competes.length) out.push({ id: 'compete', level: 'info', title: `Competes with ${competes.length} exclusive offer${competes.length > 1 ? 's' : ''}`, detail: `${competes.slice(0, 2).map((k) => k.name).join('; ')}. Only one applies per cart: the best for the customer, or the higher priority.` })
  // 5 · Worst stacked cart
  const cart = qualifyingCart(c, s)
  const res = evaluateCart(cart, [...all.filter((o) => o.id !== c.id), c], { ...ctx(cart), preview: c.id })
  const pctOff = res.subtotal ? (res.saved + res.cashback) / res.subtotal : 0
  const cap = L.maxOrderPct ?? 0.4
  if (pctOff > cap) out.push({ id: 'stack', level: 'warn', title: `A qualifying cart gets ${Math.round(pctOff * 100)}% off in total`, detail: `With other offers stacked, the worst cart is above your ${Math.round(cap * 100)}% per-order cap.`, fix: { label: 'Make it exclusive', patch: { stacking: 'exclusive' } } })
  else out.push({ id: 'stack', level: 'ok', title: `Worst qualifying cart: ${Math.round(pctOff * 100)}% off, ${Math.round(res.marginPct * 100)}% margin`, detail: 'Priced with every live offer that could stack.' })
  // 6 · Codes
  const risk = codeRisk(c)
  if (risk.score >= 0.6) out.push({ id: 'codes', level: 'warn', title: 'This code will probably leak', detail: risk.reasons.join('; ') + '.', fix: { label: 'Limit to 1 per customer', patch: { perCustomer: 1, totalRedemptions: c.totalRedemptions ?? 500 } } })
  // 7 · Budget
  const per = costPerRedemption(c, s.avgOrder, s.skus, s.shippingFee)
  const days = Math.max(1, c.endDay - Math.max(0, c.startDay))
  const need = per * c.dailyRedemptions * days
  if (need > c.budget * 1.05) out.push({ id: 'budget', level: 'warn', title: `Budget runs out around day ${Math.max(1, Math.floor(c.budget / Math.max(1, per * c.dailyRedemptions)))} of ${days}`, detail: `Expected spend is ₹${Math.round(need).toLocaleString('en-IN')} against a ₹${c.budget.toLocaleString('en-IN')} budget.`, fix: { label: `Raise budget to ₹${Math.round(need / 1000) * 1000}`, patch: { budget: Math.round(need / 1000) * 1000 } } })
  // 8 · Channels
  const map = mapChannels(c, s, ctl)
  const unsupported = map.filter((m) => m.fit === 'unsupported')
  if (unsupported.length === map.length && map.length) out.push({ id: 'channels', level: 'block', title: 'No chosen channel can run this offer', detail: `${unsupported.map((m) => m.label).join(', ')} can't express a ${c.reward.kind} reward.` })
  else if (unsupported.length) out.push({ id: 'channels', level: 'warn', title: `${unsupported.map((m) => m.label).join(', ')} can't run it`, detail: 'It will run on the other channels only.' })
  // 9 · Honest urgency
  if (L.countdown && c.endDay - Math.max(0, c.startDay) > 7) out.push({ id: 'urgency', level: 'warn', title: 'A countdown on a long offer reads as fake urgency', detail: 'Countdowns must show a real end. Over 7 days, drop the countdown or shorten the offer (false urgency is a listed dark pattern in India\'s 2023 CCPA guidelines).', fix: { label: 'Remove countdown', patch: { launch: { ...L, countdown: false } } } })
  // 10 · Calendar
  const ev = s.calendar.find((e) => e.kind === 'event' && c.startDay <= e.day + e.length && e.day <= c.endDay)
  if (ev) out.push({ id: 'event', level: 'info', title: `Runs during ${ev.label}`, detail: 'Traffic is higher and so is competition for discounts; full-price buyers are most exposed now.' })
  return out
}

export const verdict = (f: Flight[]) => (f.some((x) => x.level === 'block') ? 'blocked' : f.some((x) => x.level === 'warn') ? 'warnings' : 'clear')

/* ───────── Approval policy (maker-checker) ───────── */

export interface Policy { discountOver: number; budgetOver: number; codesOver: number }
export const DEFAULT_POLICY: Policy = { discountOver: 0.3, budgetOver: 25000, codesOver: 1000 }

export function approvalReasons(c: Campaign, s: SellerDef, p: Policy, flights: Flight[]): string[] {
  const out: string[] = []
  const t = targetSkus(c, s.skus)
  const d = equivalentDepth(c.reward, t[0])
  if (d !== null && d > p.discountOver) out.push(`Discount ${Math.round(d * 100)}% is above ${Math.round(p.discountOver * 100)}%`)
  if (c.budget > p.budgetOver) out.push(`Budget ₹${c.budget.toLocaleString('en-IN')} is above ₹${p.budgetOver.toLocaleString('en-IN')}`)
  if ((c.launch?.codes?.count ?? 0) > p.codesOver) out.push(`${c.launch!.codes!.count} codes is above ${p.codesOver}`)
  if (c.launch?.lossLeader) out.push('Marked as a loss leader')
  if (flights.some((f) => f.level === 'warn')) out.push('Pre-flight has warnings')
  if (s.trade) out.push('Trade promotions always need finance sign-off')
  return out
}

/* ───────── Lifecycle ───────── */

export const LIFECYCLE: { status: CampaignStatus; label: string }[] = [
  { status: 'draft', label: 'Draft' }, { status: 'review', label: 'In review' }, { status: 'approved', label: 'Approved' }, { status: 'scheduled', label: 'Scheduled' },
  { status: 'live', label: 'Live' }, { status: 'paused', label: 'Paused' }, { status: 'ended', label: 'Ended' }, { status: 'archived', label: 'Archived' }, { status: 'rejected', label: 'Rejected' },
]
export const STATUS_LABEL = Object.fromEntries(LIFECYCLE.map((x) => [x.status, x.label])) as Record<CampaignStatus, string>

/** Allowed moves, and who may make them. */
export const MOVES: Record<CampaignStatus, { to: CampaignStatus; label: string; by: 'maker' | 'checker' | 'any' }[]> = {
  draft: [{ to: 'review', label: 'Submit for approval', by: 'maker' }, { to: 'scheduled', label: 'Schedule (no approval needed)', by: 'maker' }, { to: 'archived', label: 'Archive', by: 'any' }],
  review: [{ to: 'approved', label: 'Approve', by: 'checker' }, { to: 'rejected', label: 'Reject', by: 'checker' }, { to: 'draft', label: 'Withdraw', by: 'maker' }],
  approved: [{ to: 'scheduled', label: 'Schedule', by: 'any' }, { to: 'live', label: 'Go live now', by: 'any' }],
  rejected: [{ to: 'draft', label: 'Revise', by: 'maker' }, { to: 'archived', label: 'Archive', by: 'any' }],
  scheduled: [{ to: 'live', label: 'Start now', by: 'any' }, { to: 'draft', label: 'Unschedule', by: 'maker' }],
  live: [{ to: 'paused', label: 'Pause', by: 'any' }, { to: 'ended', label: 'End now', by: 'any' }],
  paused: [{ to: 'live', label: 'Resume', by: 'any' }, { to: 'ended', label: 'End', by: 'any' }],
  ended: [{ to: 'archived', label: 'Archive', by: 'any' }, { to: 'draft', label: 'Clone as draft', by: 'maker' }],
  archived: [],
}

export function canMove(from: CampaignStatus, to: CampaignStatus, role: 'maker' | 'checker', needsApproval: boolean) {
  const m = MOVES[from].find((x) => x.to === to)
  if (!m) return { ok: false, why: `Can't go from ${STATUS_LABEL[from]} to ${STATUS_LABEL[to]}` }
  if (m.by !== 'any' && m.by !== role) return { ok: false, why: m.by === 'checker' ? 'Only an approver can do this (switch to the checker role)' : 'Only the campaign maker can do this' }
  if (from === 'draft' && to === 'scheduled' && needsApproval) return { ok: false, why: 'This offer needs approval first' }
  return { ok: true, why: '' }
}

/** Field-by-field differences between two versions, for the audit log and approvals. */
export function diff(a: Campaign, b: Campaign): { field: string; from: string; to: string }[] {
  const show = (v: unknown) => (v === undefined ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v))
  const fields: (keyof Campaign)[] = ['name', 'status', 'channel', 'startDay', 'endDay', 'budget', 'segment', 'stacking', 'priority', 'maxDiscount', 'perCustomer', 'totalRedemptions', 'dailyRedemptions', 'reward', 'conditions', 'launch']
  return fields.filter((f) => show(a[f]) !== show(b[f])).map((f) => ({ field: String(f), from: show(a[f]), to: show(b[f]) }))
}

/* ───────── Live guardrails ───────── */

export interface Guard { id: 'margin' | 'spike' | 'budget' | 'coupon-site'; label: string; detail: string; threshold: number; unit: string; action: 'pause' | 'cap' }
export const GUARDS: Guard[] = [
  { id: 'margin', label: 'Margin breach', detail: 'Pause if a real order\'s margin falls below', threshold: 0.12, unit: '%', action: 'pause' },
  { id: 'spike', label: 'Redemption spike', detail: 'Pause if redemptions in an hour exceed the plan by', threshold: 3, unit: '×', action: 'pause' },
  { id: 'budget', label: 'Budget hit', detail: 'Stop when spend reaches this share of budget', threshold: 1, unit: '%', action: 'pause' },
  { id: 'coupon-site', label: 'Code on a coupon site', detail: 'Cap at 1 use per customer when a code shows up publicly', threshold: 1, unit: '', action: 'cap' },
]

/** Which guardrail a live campaign would trip right now, from its own numbers. */
export function tripped(c: Campaign, s: SellerDef): { guard: Guard['id']; reason: string } | null {
  if (c.status !== 'live') return null
  if (c.spent >= c.budget) return { guard: 'budget', reason: `Spent ₹${c.spent.toLocaleString('en-IN')} of ₹${c.budget.toLocaleString('en-IN')}` }
  const days = Math.max(1, -c.startDay)
  const rate = c.redeemed / days
  if (c.conditions.some((k) => k.kind === 'code') && !c.perCustomer && rate > c.dailyRedemptions * 2.5) return { guard: 'coupon-site', reason: `${Math.round(rate)} uses a day vs ${c.dailyRedemptions} planned; the code is circulating` }
  void s
  return null
}
