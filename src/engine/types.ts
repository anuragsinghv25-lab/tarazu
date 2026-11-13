export type Channel = string
export type ChannelOrBlend = Channel | 'blended'
export type Health = 'fast' | 'healthy' | 'slow' | 'at-risk'
export type Goal = 'clear' | 'grow' | 'margin' | 'launch'
export type ScenarioId = string
export type FeeLevel = 'low' | 'current' | 'high'
export type Strategy = 'edlp' | 'balanced' | 'hilo'
export type DataQuality = 'clean' | 'messy'
export type Tag = 'bestseller' | 'overstock' | 'expiring' | 'giftset' | 'seasonal' | 'halo' | 'broken-sizes' | 'old-model' | 'new-model' | 'returns'

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
  /** Weeks left to sell before expiry, season end or a model change. */
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
  /** Share of units returned (electronics, apparel). */
  returnRate?: number
  tags: Tag[]
}

export interface FeeModel {
  label: string
  /** Platform commission, or retailer/distributor margin in Brand mode. */
  commission: number
  payment: number
  /** ₹ per unit the seller absorbs (free shipping, freight). */
  shipSubsidy: number
  /** ₹ per day for a featured deal placement. */
  dealPerDay: number
  /** Share of demand that comes through this channel. */
  share: number
  /** Extra traffic a featured deal placement brings on top of the price effect. */
  boost: number
  note: string
  /** Who usually funds promotions on this channel. */
  funding?: string
}

export interface Market {
  channels: Record<string, FeeModel>
  /** Campaign placement cost per day when a promotion runs across every channel. */
  blendDealPerDay: number
}

/** The knobs a presenter can turn in the Control Room. */
export interface Knobs {
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
  /** EDLP (few, shallow promos) vs Hi-Lo (frequent deep promos). */
  strategy: Strategy
  /** How trustworthy the seller's sales data is. */
  dataQuality: DataQuality
}

export interface Controls extends Knobs {
  market: Market
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
  returnsCost: number
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

export type Confidence = 'high' | 'medium' | 'low'

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
  confidence: Confidence
  confidenceWhy: string
}

/* ───────── Campaigns and carts (the execution engine) ───────── */

export type Segment = 'all' | 'new' | 'regular' | 'gold' | 'lapsed'
export type Funding = 'seller' | 'platform' | 'co-funded' | 'bank' | 'partner'
export type Stacking = 'exclusive' | 'stackable' | 'always'

export type Condition =
  | { kind: 'cartMin'; value: number }
  | { kind: 'hasCategory'; value: string }
  | { kind: 'hasSku'; value: string }
  | { kind: 'qtyMin'; value: number; category?: string; sku?: string }
  | { kind: 'code'; value: string }
  | { kind: 'payment'; value: string }

export type Reward =
  | { kind: 'pctOff'; value: number; target: 'cart' | 'category' | 'sku'; ref?: string }
  | { kind: 'amountOff'; value: number }
  | { kind: 'tiered'; tiers: { min: number; off: number }[] }
  | { kind: 'bxgy'; buy: number; get: number; getPct: number; ref: string; refKind: 'sku' | 'category' }
  | { kind: 'multiBuy'; qty: number; price: number; ref: string; refKind: 'sku' | 'category' }
  | { kind: 'freeItem'; sku: string }
  | { kind: 'freeShipping' }
  | { kind: 'bundlePrice'; skus: string[]; price: number }
  | { kind: 'points'; multiplier: number }
  | { kind: 'cashback'; pct: number; max: number }

/** Lifecycle: Draft → In review → Approved → Scheduled → Live → Paused → Ended → Archived (Rejected, Expired as exits). */
export type CampaignStatus = 'draft' | 'review' | 'approved' | 'rejected' | 'scheduled' | 'live' | 'paused' | 'ended' | 'archived'

export interface AudienceRule { kind: 'new' | 'repeat' | 'lapsed' | 'member' | 'aov' | 'city' | 'app' | 'list'; value?: number; values?: string[] }

/** Builder-only settings (R4). Optional so older campaigns keep working. */
export interface LaunchSettings {
  goal?: string
  audience?: AudienceRule[]
  codes?: { mode: 'auto' | 'public' | 'bulk'; prefix?: string; count?: number }
  recurring?: 'none' | 'weekends' | 'evenings' | 'flash'
  flashSlots?: { day: number; from: number; to: number }[]
  countdown?: boolean
  graceMinutes?: number
  channels?: string[]
  maxOrderPct?: number
  reservedStock?: number
  lossLeader?: boolean
  version?: number
  owner?: string
}

export interface Campaign {
  id: string
  name: string
  mechanic: string
  status: CampaignStatus
  channel: string
  /** Day offsets from today. */
  startDay: number
  endDay: number
  budget: number
  spent: number
  segment: Segment
  match: 'all' | 'any'
  conditions: Condition[]
  reward: Reward
  maxDiscount?: number
  perCustomer?: number
  totalRedemptions?: number
  redeemed: number
  stacking: Stacking
  priority: number
  funding: Funding
  /** Share of the discount the platform or partner pays, for co-funded offers. */
  partnerShare?: number
  /** Expected redemptions per day, for budget burn-down. */
  dailyRedemptions: number
  note?: string
  launch?: LaunchSettings
}

export interface CartLine { skuId: string; qty: number }
export interface Cart {
  lines: CartLine[]
  segment: Exclude<Segment, 'all'>
  code: string
  payment: string
  channel: string
  /** Times this customer has already used each campaign. */
  usedBefore?: Record<string, number>
}
