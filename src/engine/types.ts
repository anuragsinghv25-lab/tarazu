export type Channel = 'amazon' | 'flipkart' | 'nykaa' | 'website'
export type ChannelOrBlend = Channel | 'blended'
export type Health = 'fast' | 'healthy' | 'slow' | 'at-risk'
export type Goal = 'clear' | 'grow' | 'margin' | 'launch'
export type ScenarioId = 'normal' | 'bbd' | 'monsoon' | 'price-war' | 'overstock' | 'custom'
export type FeeLevel = 'low' | 'current' | 'high'
export type Tag = 'bestseller' | 'overstock' | 'expiring' | 'giftset' | 'seasonal' | 'halo'

export interface Sku {
  id: string
  name: string
  line: string
  variant: string
  category: string
  price: number
  cost: number
  stock: number
  /** Units sold per week over the last 12 weeks, oldest first. */
  weeklySales: number[]
  /** Weeks since this batch was first stocked. */
  ageWeeks: number
  /** Weeks left to sell before expiry or season end. */
  sellWindowWeeks: number
  expiryWeeks?: number
  /** Price elasticity of demand, e.g. −1.8. */
  elasticity: number
  /** Share of promo lift that is stolen from the seller's own sibling products. */
  cannibalRate: number
  /** Extra units of complementary products sold per incremental unit. */
  haloRate: number
  /** Margin (₹) on each halo unit. */
  haloMargin: number
  tags: Tag[]
}

export interface Controls {
  scenario: ScenarioId
  daysToEvent: number
  /** Multiplies every SKU's elasticity: >1 = more price-sensitive buyers. */
  elasticityMult: number
  /** Demand multiplier for the period (festive boost or slump). */
  seasonality: number
  /** Competitors' price move, −0.3 to +0.2. */
  competitorPrice: number
  feeLevel: FeeLevel
  /** Share of lift that is only pulled forward from future weeks, 0–0.4. */
  pullForward: number
  stockMult: number
  /** Minimum gross margin % allowed at promo price. */
  marginFloor: number
  goal: Goal
}

export interface SimInput {
  discount: number
  weeks: number
  channel: ChannelOrBlend
}

export interface SimResult extends SimInput {
  price: number
  promoPrice: number
  baseUnits: number
  promoUnits: number
  lift: number
  cannibalized: number
  pulledForward: number
  incremental: number
  /** ₹ discount handed to buyers who would have bought anyway. */
  subsidyCost: number
  dealFees: number
  cannibalCost: number
  pullForwardCost: number
  liftProfit: number
  haloProfit: number
  writeOffSaved: number
  /** Left pan of the Scale. */
  given: number
  /** Right pan of the Scale. */
  earned: number
  net: number
  revenue: number
  stockClearedPct: number
  grossMarginPct: number
}

export interface CurvePoint {
  d: number
  net: number
  allowed: boolean
}

export interface Recommendation {
  sku: Sku
  health: Health
  mechanic: string
  discount: number
  weeks: number
  result: SimResult
  why: string
  short: string
  floorMaxDiscount: number
  cliff: number | null
}
