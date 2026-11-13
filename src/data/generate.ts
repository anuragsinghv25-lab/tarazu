import type { Sku, Tag } from '@/engine/types'

/* Deterministic catalogue generator: the same seed always yields the same data,
   so every demo of a seller tells the same story. */

export interface CatSpec {
  category: string
  lines: string[]
  variants: { label: string; priceMult: number; rateMult: number }[]
  price: [number, number]
  costRatio: [number, number]
  rate: [number, number]
  elasticity: number
  cannibal: number
  halo: number
  window: number
  returnRate?: number
  expiry?: number
}

export type Patch = Partial<Sku> & { tags?: Tag[] }

export function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export function generate(seed: number, cats: CatSpec[], story: Record<string, Patch>, opts: { price9?: boolean } = {}): Sku[] {
  const rnd = mulberry32(seed)
  const between = (a: number, b: number) => a + (b - a) * rnd()
  const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5)
  const priceFn = opts.price9 === false ? (n: number) => Math.round(n / 10) * 10 - 1 : (n: number) => Math.round(n / 50) * 50 - 1
  const sales = (rate: number, trend: number) =>
    Array.from({ length: 12 }, (_, i) => Math.max(0, Math.round(rate * (1 + trend * (i - 6) / 12) * between(0.82, 1.18))))

  const out: Sku[] = []
  for (const cat of cats) {
    for (const line of cat.lines) {
      const linePrice = between(cat.price[0], cat.price[1])
      const lineRate = between(cat.rate[0], cat.rate[1])
      for (const v of cat.variants) {
        const price = priceFn(linePrice * v.priceMult)
        const rate = Math.max(1, lineRate * v.rateMult)
        const window = cat.window
        const wos = between(4, window * 1.45)
        const sku: Sku = {
          id: slug(`${line} ${v.label}`),
          name: cat.variants.length > 1 ? `${line} · ${v.label}` : line,
          line, variant: v.label, category: cat.category,
          price, cost: Math.round(price * between(cat.costRatio[0], cat.costRatio[1])),
          stock: round5(rate * wos),
          weeklySales: sales(rate, between(-0.25, 0.25)),
          ageWeeks: Math.round(between(2, 18)),
          sellWindowWeeks: window,
          elasticity: +(cat.elasticity * between(0.85, 1.15)).toFixed(2),
          cannibalRate: v.label === cat.variants[0].label && cat.variants.length > 1 ? cat.cannibal : cat.cannibal * 0.7,
          haloRate: cat.halo, haloMargin: Math.round(between(110, 190)),
          tags: [],
        }
        if (cat.returnRate) sku.returnRate = cat.returnRate
        if (cat.expiry) sku.expiryWeeks = cat.expiry
        out.push(sku)
      }
    }
  }
  const missing = Object.keys(story).filter((id) => !out.some((s) => s.id === id))
  if (missing.length) throw new Error(`Story SKUs not in catalogue: ${missing.join(', ')}`)
  return out.map((s) => (story[s.id] ? { ...s, ...story[s.id] } : s))
}
