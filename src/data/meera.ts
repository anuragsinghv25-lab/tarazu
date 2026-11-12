import type { Sku, Tag } from '@/engine/types'

/* Meera's catalogue — Saanjh Botanicals, Jaipur (fictional brand).
   140 SKUs generated deterministically from a seed, with a handful of
   hand-set "story" SKUs that drive the demo. Same seed → same data. */

export const seller = {
  id: 'meera',
  name: 'Meera',
  brand: 'Saanjh Botanicals',
  city: 'Jaipur',
  category: 'Ayurvedic skincare & wellness',
  channels: ['Amazon', 'Flipkart', 'Nykaa', 'Own website', 'WhatsApp community'],
  event: 'Big Billion Days',
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(2509)
const between = (a: number, b: number) => a + (b - a) * rnd()
const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5)
const price9 = (n: number) => Math.round(n / 50) * 50 - 1

interface CatSpec {
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
}

const CATS: CatSpec[] = [
  { category: 'Face serums', lines: ['Kumkumadi Glow Serum', 'Vitamin C Saffron Serum', 'Niacinamide Neem Serum', 'Bakuchi Night Serum', 'Hyaluronic Aloe Serum', 'Licorice Brightening Serum'], variants: [{ label: '30 ml', priceMult: 1, rateMult: 1 }, { label: '50 ml', priceMult: 1.45, rateMult: 0.45 }], price: [699, 999], costRatio: [0.24, 0.3], rate: [14, 40], elasticity: -1.5, cannibal: 0.32, halo: 0.3, window: 14 },
  { category: 'Cleansers', lines: ['Ubtan Face Wash', 'Neem Tulsi Face Wash', 'Rose Milk Cleanser', 'Charcoal Clay Wash'], variants: [{ label: '100 ml', priceMult: 1, rateMult: 1 }, { label: '200 ml', priceMult: 1.7, rateMult: 0.4 }], price: [299, 399], costRatio: [0.22, 0.3], rate: [25, 60], elasticity: -1.9, cannibal: 0.25, halo: 0.25, window: 12 },
  { category: 'Moisturisers', lines: ['Aloe Day Moisturiser', 'Saffron Night Cream', 'Kokum Barrier Cream', 'Under-eye Almond Gel', 'Sandal Matte Gel', 'Ashwagandha Repair Cream'], variants: [{ label: '50 g', priceMult: 1, rateMult: 1 }, { label: '100 g', priceMult: 1.6, rateMult: 0.4 }], price: [449, 799], costRatio: [0.25, 0.32], rate: [10, 32], elasticity: -1.6, cannibal: 0.28, halo: 0.2, window: 14 },
  { category: 'Toners & mists', lines: ['Rose Toner', 'Vetiver Mist', 'Green Tea Toner', 'Cucumber Mist', 'Hibiscus Toner'], variants: [{ label: '100 ml', priceMult: 1, rateMult: 1 }, { label: '200 ml', priceMult: 1.6, rateMult: 0.35 }], price: [299, 449], costRatio: [0.2, 0.28], rate: [6, 20], elasticity: -1.8, cannibal: 0.22, halo: 0.25, window: 12 },
  { category: 'Soaps', lines: ['Neem Soap', 'Sandalwood Soap', 'Turmeric Soap', 'Rose Goat Milk Soap', 'Charcoal Soap', 'Lemongrass Soap', 'Kesar Malai Soap', 'Coffee Scrub Soap'], variants: [{ label: 'single', priceMult: 1, rateMult: 1 }, { label: 'pack of 3', priceMult: 2.6, rateMult: 0.35 }], price: [149, 199], costRatio: [0.2, 0.28], rate: [18, 50], elasticity: -2.2, cannibal: 0.3, halo: 0.1, window: 16 },
  { category: 'Lip care', lines: ['Beetroot Lip Balm', 'Rose Lip Balm', 'Kokum Lip Butter', 'Honey Lip Scrub', 'Ghee Lip Balm', 'Mulberry Tint'], variants: [{ label: 'regular', priceMult: 1, rateMult: 1 }, { label: 'duo', priceMult: 1.8, rateMult: 0.3 }], price: [199, 299], costRatio: [0.2, 0.26], rate: [8, 28], elasticity: -2.3, cannibal: 0.2, halo: 0.15, window: 12 },
  { category: 'Hair care', lines: ['Bhringraj Hair Oil', 'Onion Hair Oil', 'Amla Shampoo', 'Hibiscus Conditioner', 'Rosemary Scalp Tonic'], variants: [{ label: '100 ml', priceMult: 1, rateMult: 1 }, { label: '200 ml', priceMult: 1.7, rateMult: 0.45 }], price: [299, 499], costRatio: [0.22, 0.3], rate: [12, 38], elasticity: -1.6, cannibal: 0.25, halo: 0.2, window: 14 },
  { category: 'Body', lines: ['Kokum Body Butter', 'Coffee Body Scrub', 'Sandal Body Lotion', 'Ubtan Body Polish', 'Saffron Body Oil', 'Vetiver Body Wash'], variants: [{ label: 'regular', priceMult: 1, rateMult: 1 }, { label: 'large', priceMult: 1.6, rateMult: 0.4 }], price: [399, 699], costRatio: [0.24, 0.3], rate: [8, 24], elasticity: -1.9, cannibal: 0.22, halo: 0.2, window: 14 },
  { category: 'Masks', lines: ['Multani Mitti Mask', 'Ubtan Glow Mask', 'Rice Water Sheet Mask', 'Charcoal Peel Mask', 'Saffron Overnight Mask', 'Tomato Tan Mask'], variants: [{ label: 'jar', priceMult: 1, rateMult: 1 }], price: [299, 599], costRatio: [0.2, 0.28], rate: [6, 22], elasticity: -2.0, cannibal: 0.15, halo: 0.2, window: 12 },
  { category: 'Sun care', lines: ['Mineral Sunscreen SPF 50', 'Tinted Sunscreen SPF 30', 'Sun Stick SPF 50'], variants: [{ label: '50 g', priceMult: 1, rateMult: 1 }, { label: '100 g', priceMult: 1.6, rateMult: 0.35 }], price: [449, 599], costRatio: [0.24, 0.3], rate: [18, 45], elasticity: -2.2, cannibal: 0.25, halo: 0.25, window: 10 },
  { category: 'Gift sets', lines: ['Diwali Glow Box', 'Mini Ritual Kit', 'Bridal Glow Hamper', 'His Grooming Kit', 'Lip Love Trio', 'Self-care Sunday Box'], variants: [{ label: 'set', priceMult: 1, rateMult: 1 }], price: [999, 1999], costRatio: [0.32, 0.38], rate: [4, 16], elasticity: -2.5, cannibal: 0.12, halo: 0.1, window: 6 },
  { category: 'Kajal & kohl', lines: ['Almond Kajal', 'Camphor Kohl', 'Herbal Eyeliner', 'Brow Oil'], variants: [{ label: 'regular', priceMult: 1, rateMult: 1 }], price: [199, 349], costRatio: [0.2, 0.26], rate: [10, 30], elasticity: -1.7, cannibal: 0.15, halo: 0.15, window: 16 },
  { category: 'Attars', lines: ['Mitti Attar', 'Rose Attar', 'Mogra Attar', 'Oud Attar', 'Khus Attar', 'Sandal Attar'], variants: [{ label: '8 ml', priceMult: 1, rateMult: 1 }], price: [499, 999], costRatio: [0.26, 0.34], rate: [3, 12], elasticity: -1.3, cannibal: 0.12, halo: 0.1, window: 20 },
  { category: 'Travel minis', lines: ['Mini Face Wash', 'Mini Serum', 'Mini Moisturiser', 'Mini Hair Oil', 'Mini Body Butter', 'Mini Toner', 'Mini Sunscreen', 'Mini Lip Balm', 'Mini Shampoo', 'Mini Scrub'], variants: [{ label: 'travel', priceMult: 1, rateMult: 1 }], price: [99, 199], costRatio: [0.24, 0.32], rate: [8, 30], elasticity: -2.6, cannibal: 0.3, halo: 0.25, window: 14 },
  { category: 'Tools', lines: ['Kansa Wand', 'Neem Wood Comb', 'Rose Quartz Roller', 'Konjac Sponge', 'Gua Sha Stone', 'Bamboo Headband', 'Copper Tongue Cleaner', 'Muslin Face Cloth', 'Silk Pillowcase', 'Wooden Soap Dish'], variants: [{ label: 'single', priceMult: 1, rateMult: 1 }], price: [249, 899], costRatio: [0.3, 0.4], rate: [3, 14], elasticity: -1.4, cannibal: 0.1, halo: 0.25, window: 24 },
]

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

function sales(rate: number, trend: number): number[] {
  return Array.from({ length: 12 }, (_, i) => Math.max(0, Math.round(rate * (1 + trend * (i - 6) / 12) * between(0.82, 1.18))))
}

const generated: Sku[] = []
for (const cat of CATS) {
  for (const line of cat.lines) {
    const linePrice = between(cat.price[0], cat.price[1])
    const lineRate = between(cat.rate[0], cat.rate[1])
    for (const v of cat.variants) {
      const price = price9(linePrice * v.priceMult)
      const rate = Math.max(1, lineRate * v.rateMult)
      const window = cat.window
      const wos = between(4, window * 1.45)
      generated.push({
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
      })
    }
  }
}

/* The story SKUs — hand-set so Meera's demo always tells the same story. */
type Patch = Partial<Sku> & { tags?: Tag[] }
const STORY: Record<string, Patch> = {
  'kumkumadi-glow-serum-30-ml': { price: 899, cost: 240, stock: 520, weeklySales: [88, 92, 90, 97, 94, 99, 96, 101, 95, 98, 102, 97], ageWeeks: 3, elasticity: -1.4, cannibalRate: 0.38, haloRate: 0.32, haloMargin: 190, tags: ['bestseller', 'halo'] },
  'kumkumadi-glow-serum-50-ml': { price: 1299, cost: 330, stock: 260, weeklySales: [34, 38, 41, 37, 40, 42, 39, 41, 43, 38, 40, 42], ageWeeks: 5 },
  'vitamin-c-saffron-serum-30-ml': { price: 799, cost: 210, stock: 1100, weeklySales: [44, 42, 40, 41, 39, 38, 37, 39, 36, 38, 37, 36], ageWeeks: 34, sellWindowWeeks: 16, expiryWeeks: 16, elasticity: -2.1, tags: ['expiring'] },
  'beetroot-lip-balm-regular': { price: 249, cost: 55, stock: 900, weeklySales: [26, 25, 24, 22, 23, 21, 22, 20, 22, 21, 23, 22], ageWeeks: 22, elasticity: -2.4, cannibalRate: 0.18, tags: ['overstock'] },
  'diwali-glow-box-set': { price: 1499, cost: 520, stock: 400, weeklySales: [8, 10, 14, 22, 38, 64, 92, 71, 28, 14, 12, 11], ageWeeks: 9, sellWindowWeeks: 6, elasticity: -2.6, tags: ['giftset'] },
  'mineral-sunscreen-spf-50-50-g': { price: 549, cost: 150, stock: 700, weeklySales: [52, 55, 58, 61, 57, 60, 62, 59, 63, 60, 61, 64], ageWeeks: 6, sellWindowWeeks: 10, elasticity: -2.2, tags: ['seasonal'] },
  'rose-toner-200-ml': { price: 499, cost: 115, stock: 380, weeklySales: [12, 11, 11, 10, 9, 10, 9, 8, 9, 9, 8, 9], ageWeeks: 26 },
  'aloe-day-moisturiser-50-g': { tags: ['halo'], haloRate: 0.35 },
  'neem-soap-pack-of-3': { price: 399, cost: 92, stock: 420, weeklySales: [30, 32, 31, 33, 30, 34, 32, 31, 33, 32, 34, 33], cannibalRate: 0.35 },
}

export const skus: Sku[] = generated.map((s) => (STORY[s.id] ? { ...s, ...STORY[s.id] } : s))

export const storySkuIds = Object.keys(STORY)
export const heroSkuId = 'vitamin-c-saffron-serum-30-ml'
export const getSku = (id: string) => skus.find((s) => s.id === id)
