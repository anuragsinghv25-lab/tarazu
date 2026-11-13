/* Brief to plan: turns a goal written in plain words into engine settings, then builds a plan
   from the engine's own recommendations under those settings. The parse is shown back to the
   seller as chips so they can see exactly how the brief was read. */
import type { Controls, Goal, Recommendation } from '@/engine/types'
import type { SellerDef } from '@/data/sellers'
import { portfolio, unitsAtRisk } from '@/engine/engine'
import { inrShort, pct } from '@/lib/format'

export interface Parsed {
  target?: number
  floor?: number
  goal?: Goal
  weeks?: number
  avoid: string[]
  only: string[]
  chips: { label: string; value: string }[]
}

const LAKH = 100000

export function parseBrief(text: string, s: SellerDef): Parsed {
  const t = text.toLowerCase().replace(/,/g, '')
  const out: Parsed = { avoid: [], only: [], chips: [] }
  // Amount: ₹4 L, 4 lakh, 4l, 40k, ₹400000, 1.5 cr
  const m = t.match(/₹?\s*(\d+(?:\.\d+)?)\s*(lakh|lac|l\b|k\b|cr|crore)?/g)
  if (m) {
    for (const raw of m) {
      const mm = raw.match(/(\d+(?:\.\d+)?)\s*(lakh|lac|l|k|cr|crore)?/)!
      const n = parseFloat(mm[1]), unit = mm[2]
      const near = t.slice(Math.max(0, t.indexOf(raw) - 1), t.indexOf(raw) + raw.length + 2)
      if (/%/.test(near)) continue
      const v = unit?.startsWith('l') ? n * LAKH : unit === 'k' ? n * 1000 : unit?.startsWith('cr') ? n * 100 * LAKH : n >= 1000 ? n : NaN
      if (!Number.isNaN(v)) { out.target = v; break }
    }
  }
  const floor = t.match(/(?:margin|marjin)[^\d%]{0,24}(\d{1,2})\s*%|(\d{1,2})\s*%\s*(?:margin|marjin)/)
  if (floor) out.floor = parseInt(floor[1] ?? floor[2], 10) / 100
  if (/clear|old stock|purana|stuck|phansa|liquidat|expir/.test(t)) out.goal = 'clear'
  else if (/grow|new (customers|buyers)|naye|reach|launch/.test(t)) out.goal = 'grow'
  else if (/protect|margin|profit|munafa/.test(t)) out.goal = 'margin'
  const wk = t.match(/(\d+)\s*(weeks?|wks?|hafte|hafton)/)
  if (wk) out.weeks = Math.min(8, parseInt(wk[1], 10))
  else if (/month|mahine/.test(t)) out.weeks = 4
  const cats = [...new Set(s.skus.map((k) => k.category))]
  for (const cat of cats) {
    const stem = cat.toLowerCase().replace(/s$/, '').split(' ')[0]
    const idx = t.indexOf(stem)
    if (idx < 0) continue
    const before = t.slice(Math.max(0, idx - 28), idx)
    if (/(don'?t|do not|never|not|no|without|except|mat|nahi|chhod)/.test(before)) out.avoid.push(cat)
    else if (/(only|just|sirf)/.test(before)) out.only.push(cat)
  }
  if (/bestseller|best seller|top seller/.test(t) && /(don'?t|never|not|no|mat)/.test(t)) out.avoid.push('bestsellers')

  if (out.target) out.chips.push({ label: 'Clear', value: inrShort(out.target) })
  if (out.floor !== undefined) out.chips.push({ label: 'Margin floor', value: pct(out.floor) })
  if (out.goal) out.chips.push({ label: 'Goal', value: { clear: 'Clear stock', grow: 'Grow', margin: 'Protect margin', launch: 'Launch' }[out.goal] })
  if (out.weeks) out.chips.push({ label: 'Within', value: `${out.weeks} weeks` })
  out.avoid.forEach((a) => out.chips.push({ label: 'Leave alone', value: a }))
  out.only.forEach((a) => out.chips.push({ label: 'Only', value: a }))
  return out
}

export interface PlanItem { rec: Recommendation; clears: number }
export interface BriefPlan {
  items: PlanItem[]
  cleared: number
  net: number
  holds: number
  target?: number
  short: boolean
  controls: Controls
  notes: string[]
}

export function buildPlan(s: SellerDef, base: Controls, p: Parsed): BriefPlan {
  const controls: Controls = { ...base, goal: p.goal ?? base.goal, marginFloor: p.floor ?? base.marginFloor }
  const port = portfolio(s.skus, controls)
  const isBest = (r: Recommendation) => r.sku.tags.includes('bestseller') || r.health === 'fast'
  let pool = port.promos.filter((r) => r.result.net > 0)
    .filter((r) => !p.avoid.includes(r.sku.category) && !(p.avoid.includes('bestsellers') && isBest(r)))
    .filter((r) => !p.only.length || p.only.includes(r.sku.category))
  if (p.weeks) pool = pool.filter((r) => r.weeks <= p.weeks!)
  const value = (r: Recommendation) => Math.min(unitsAtRisk(r.sku, controls), Math.max(0, r.result.promoUnits - r.result.baseUnits)) * r.sku.cost
  const ranked = [...pool].sort((a, b) => (controls.goal === 'clear' ? value(b) - value(a) : b.result.net - a.result.net))
  const items: PlanItem[] = []
  let cleared = 0
  for (const r of ranked) {
    if (p.target && cleared >= p.target) break
    if (items.length >= 12) break
    const v = value(r)
    items.push({ rec: r, clears: v })
    cleared += v
  }
  const net = items.reduce((a, i) => a + i.rec.result.net, 0)
  const notes: string[] = []
  if (p.target && cleared < p.target) notes.push(`Only ${inrShort(cleared)} of the ${inrShort(p.target)} target can be cleared without breaking the ${pct(controls.marginFloor)} margin floor. Lower the floor in the brief, or plan a bundle for the rest.`)
  if (p.avoid.length) notes.push(`Left alone as asked: ${p.avoid.join(', ')}.`)
  const below = port.promos.filter((r) => r.result.net <= 0).length
  if (below) notes.push(`${below} more offers were considered and dropped because they lose money after fees and cannibalisation.`)
  return { items, cleared, net, holds: s.skus.length - items.length, target: p.target, short: !!p.target && cleared < p.target, controls, notes }
}

export function examples(s: SellerDef): string[] {
  const cat = [...new Set(s.skus.map((k) => k.category))]
  const ex: Record<string, string[]> = {
    meera: [`Clear ₹2 L of old stock before ${s.event}, keep margin above 20%, don't touch face serums`, 'Grow new customers in 3 weeks without discounting bestsellers', `Protect margin this month, only discount ${cat[5]?.toLowerCase() ?? 'lip care'}`],
    farhan: ['Clear ₹4 L of saree stock in 3 weeks, keep margin above 15%', 'Wedding season mein naye customers chahiye, bestsellers pe discount mat do', 'Protect margin, only discount dupattas'],
    kabir: [`Clear ₹5 L of old chargers before the ${s.event}, margin above 18%`, 'Grow new buyers in 4 weeks without touching earbuds', 'Protect margin this month'],
    anaya: ['Clear ₹1.5 L of slow stock in 4 weeks, margin above 22%', 'Grow quick-commerce buyers, no discount on bestsellers', 'Protect margin in Q4, keep margin above 25%'],
  }
  return ex[s.id]
}
