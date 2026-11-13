import type { Campaign, Knobs, Market, Sku } from '@/engine/types'
import type { History } from '@/engine/engine'

export type SellerId = 'meera' | 'farhan' | 'kabir' | 'anaya'

export interface Preset { id: string; label: string; blurb: string; controls: Partial<Knobs> }

export interface LoyaltyData {
  program: string
  members: number
  activeShare: number
  /** Orders per year: members vs non-members. */
  ordersMember: number
  ordersNonMember: number
  aov: number
  marginPct: number
  pointsOutstanding: number
  earnPct: number
  breakage: number
  referral: { give: number; get: number; invites: number; clicks: number; firstOrders: number; paidCac: number }
  fraud: { id: string; who: string; signal: string; amount: number }[]
  lapsed: number
}

export interface TradeLine {
  id: string
  account: string
  mechanism: 'off-invoice' | 'scan-based' | 'bill-back' | 'free-goods' | 'slotting' | 'co-op' | 'visibility'
  label: string
  spend: number
  /** Incremental gross profit the line generated (from post-event analysis). */
  incGP: number
}

export interface TradeAccount { id: string; name: string; kind: string; gross: number; color: string }

export interface Deduction {
  id: string
  account: string
  promo: string
  accrued: number
  claimed: number
  daysOpen: number
  status: 'matched' | 'over-claim' | 'unmatched' | 'pending'
}

export interface TradeData {
  quarter: string
  accounts: TradeAccount[]
  lines: TradeLine[]
  distributorMargin: number
  returnsDamages: number
  deductions: Deduction[]
  /** Weekly cases: what the distributor bought vs what shoppers bought. */
  sellIn: number[]
  sellOut: number[]
  schemeWeeks: [number, number]
}

export interface SellerDef {
  id: SellerId
  name: string
  brand: string
  city: string
  category: string
  avatar: string
  channels: string[]
  problem: string
  pitch: string
  event: string
  /** Other dates worth showing on the season calendar, in days from today. */
  calendar: { label: string; day: number; length: number; kind: 'event' | 'quiet' | 'season' }[]
  market: Market
  skus: Sku[]
  heroSkuId: string
  story: { id: string; label: string }[]
  comparePicks: { id: string; label: string }[]
  knobs: Knobs
  presets: Preset[]
  history: History
  ownChannel: boolean
  untapped: { label: string; to?: string }[]
  /** Share of units sold on discount in each of the last 12 weeks. */
  promoShare: number[]
  campaigns: Campaign[]
  shelf: string[]
  affinity: Record<string, { category: string; rate: number }[]>
  loyalty?: LoyaltyData
  trade?: TradeData
  shippingFee: number
  courierCost: number
  avgOrder: number
}
