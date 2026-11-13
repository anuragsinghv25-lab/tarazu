/* R6 · The Edge: the inputs behind uplift targeting, ads vs discount, ONDC, subscriptions, pre-orders,
   price-drop protection and experiments. All figures are invented but sized to each seller's business. */
import type { SellerId } from './sellers/types'

/** A group of customers, with how likely they are to buy without and with an offer (at 15% off). */
export interface Segment {
  id: string
  name: string
  size: number
  /** Chance of ordering in the next 30 days with no offer. */
  p0: number
  /** Change in that chance when sent a 15% offer. Negative = the offer puts them off or trains them to wait. */
  u15: number
  /** How "likely to buy" a propensity model scores them (what most tools target on). */
  score: number
  note: string
}

export interface Launch { name: string; price: number; cost: number; weeksOut: number; demand: number; note: string }

export interface Subscription {
  fit: 'strong' | 'some' | 'none'
  why: string
  /** Where it would run. */
  where: string
  category?: string
  cycleDays?: number
  /** Share of buyers who reorder each cycle without a subscription. */
  repeat?: number
  buyersPerMonth?: number
}

export interface Ondc {
  /** Orders a week ONDC buyer apps could bring at par pricing (tier-2/3 reach). */
  ordersPerWeek: number
  /** The marketplace channel ONDC is compared with. */
  versus: string
  logistics: number
  fit: string
}

export interface Experiments {
  /** Sessions a day on the channel where tests run. */
  traffic: number
  conversion: number
  method: 'ab' | 'weeks'
  where: string
}

export interface FrontierData {
  segments: Segment[]
  launch: Launch
  subscription: Subscription
  ondc: Ondc
  experiments: Experiments
  /** Monthly growth budget the seller splits between ads and discounts. */
  budget: number
  /** New buyers from ads come back this many more times in a year. */
  adsRepeat: number
}

const S = (id: string, name: string, size: number, p0: number, u15: number, score: number, note: string): Segment => ({ id, name, size, p0, u15, score, note })

export const FRONTIER: Record<SellerId, FrontierData> = {
  meera: {
    segments: [
      S('loyal', 'Members who buy every month', 2600, 0.62, 0.03, 0.92, 'They buy anyway; an offer just costs margin.'),
      S('recent', 'Bought at full price in the last 30 days', 3400, 0.28, 0.02, 0.71, 'Recently stocked up. A discount now refunds their last order.'),
      S('lapsed', 'Lapsed 60 to 120 days', 5200, 0.06, 0.11, 0.34, 'The classic persuadable: liked the product, drifted away.'),
      S('carts', 'Left a serum in the cart', 1900, 0.18, 0.14, 0.58, 'Close to buying; a small nudge works.'),
      S('hunters', 'Only ever bought on sale', 4100, 0.12, 0.03, 0.49, 'Will buy on the next sale anyway. Each offer trains them further.'),
      S('dormant', 'Lapsed over a year', 7800, 0.01, 0.002, 0.08, 'Lost causes: almost nothing moves them.'),
      S('subs', 'Newsletter-only, never bought', 6100, 0.02, 0.008, 0.12, 'Opens emails, never buys. The offer barely moves them.'),
      S('sensitive', 'Bought once at full price, reviewed 5 stars', 1500, 0.24, -0.04, 0.66, 'Sleeping dogs: a discount makes them wonder what they overpaid.'),
    ],
    launch: { name: 'Saffron SPF 50 Sunscreen', price: 649, cost: 190, weeksOut: 5, demand: 1400, note: 'New for summer; first batch must be ordered in two weeks.' },
    subscription: { fit: 'strong', why: 'Serums and face washes run out every 30 to 45 days.', where: 'Own website', category: 'Face serums', cycleDays: 40, repeat: 0.34, buyersPerMonth: 1800 },
    ondc: { ordersPerWeek: 70, versus: 'nykaa', logistics: 62, fit: 'Tier-2 skincare buyers through Paytm and Magicpin-style buyer apps.' },
    experiments: { traffic: 3200, conversion: 0.021, method: 'ab', where: 'Own website' },
    budget: 120000,
    adsRepeat: 1.4,
  },
  farhan: {
    segments: [
      S('repeat', 'Repeat buyers, bought in the last 60 days', 2100, 0.31, 0.04, 0.83, 'Will be back for the wedding season regardless.'),
      S('hunters', '30%-off regulars', 9200, 0.14, 0.03, 0.61, 'The weekly sitewide sale created them. More discount, little change.'),
      S('wishlist', 'Wishlisted a saree, did not buy', 3600, 0.07, 0.13, 0.42, 'Persuadables: they want a specific saree.'),
      S('lapsed', 'Lapsed after one order', 6400, 0.04, 0.07, 0.26, 'Some come back for the right offer.'),
      S('dormant', 'No order in a year', 11800, 0.01, 0.004, 0.06, 'Lost causes.'),
      S('fullprice', 'Bought silk at full price', 900, 0.22, -0.05, 0.69, 'Sleeping dogs: a discount on silk cheapens it for them.'),
    ],
    launch: { name: 'Wedding Banarasi collection', price: 3499, cost: 1450, weeksOut: 4, demand: 320, note: 'Handloom; the weavers need an order quantity now.' },
    subscription: { fit: 'none', why: 'Sarees are not replenished on a cycle; nobody wants a saree every month.', where: 'Marketplaces only' },
    ondc: { ordersPerWeek: 160, versus: 'meesho', logistics: 58, fit: 'Tier-2 and tier-3 buyers, the same audience as Meesho.' },
    experiments: { traffic: 9000, conversion: 0.012, method: 'weeks', where: 'Marketplace listings (alternate weeks; marketplaces do not allow A/B splits)' },
    budget: 40000,
    adsRepeat: 0.9,
  },
  kabir: {
    segments: [
      S('owners', 'Bought a 33W charger, no cable yet', 4300, 0.05, 0.09, 0.4, 'Persuadables for the cable bundle.'),
      S('loyal', 'Bought two or more times', 2800, 0.33, 0.03, 0.88, 'Sure things.'),
      S('carts', 'Left a charger in the cart', 2200, 0.16, 0.12, 0.6, 'A small nudge closes the sale.'),
      S('hunters', 'Use VOLT20-style codes on every order', 3900, 0.2, 0.02, 0.74, 'Coupon hunters; the leaked code taught them.'),
      S('upgraders', 'Phone upgraded in the last 3 months', 5100, 0.03, 0.08, 0.31, 'New phone, old charger: they need a reason.'),
      S('dormant', 'No order in a year', 9600, 0.008, 0.004, 0.05, 'Lost causes.'),
      S('pre65', 'Signed up for the 65W launch alert', 1600, 0.4, -0.06, 0.9, 'Sleeping dogs: a 33W discount now suggests the 65W will be cheap too.'),
    ],
    launch: { name: 'ChargeMax 65W GaN', price: 2799, cost: 1180, weeksOut: 6, demand: 900, note: 'The launch the 33W has to clear for.' },
    subscription: { fit: 'some', why: 'Cables wear out, but every 9 to 12 months, so a subscription is a reminder, not a habit.', where: 'Own website', category: 'Cables', cycleDays: 300, repeat: 0.18, buyersPerMonth: 700 },
    ondc: { ordersPerWeek: 55, versus: 'amazon', logistics: 70, fit: 'Smaller reach for electronics today; useful for price-sensitive accessories.' },
    experiments: { traffic: 5400, conversion: 0.017, method: 'ab', where: 'Own website' },
    budget: 90000,
    adsRepeat: 0.7,
  },
  anaya: {
    segments: [
      S('kirana', 'Kirana owners reordering weekly', 1800, 0.71, 0.01, 0.95, 'Sure things; trade terms already cover them.'),
      S('offices', 'Office pantry buyers', 900, 0.2, 0.17, 0.55, 'Persuadables: a bulk offer wins the order from a rival brand.'),
      S('qc', 'Quick-commerce one-time buyers', 7400, 0.06, 0.06, 0.33, 'Some come back with a reason.'),
      S('chai', 'Bought chai, never namkeen', 3100, 0.07, 0.1, 0.44, 'Cross-sell persuadables.'),
      S('hunters', 'Only buy on Amazon deals', 4800, 0.17, 0.02, 0.62, 'Buy on the next deal anyway.'),
      S('dormant', 'No order in a year', 8200, 0.01, 0.003, 0.05, 'Lost causes.'),
    ],
    launch: { name: 'Winter Gajak and Chikki box', price: 449, cost: 210, weeksOut: 3, demand: 2600, note: 'Seasonal; unsold boxes after Sankranti are a write-off.' },
    subscription: { fit: 'strong', why: 'Chai and namkeen are bought every two to three weeks.', where: 'Amazon Subscribe & Save', category: 'Chai blends', cycleDays: 21, repeat: 0.41, buyersPerMonth: 2400 },
    ondc: { ordersPerWeek: 220, versus: 'amazon', logistics: 45, fit: 'Grocery and food are ONDC\'s strongest categories.' },
    experiments: { traffic: 7600, conversion: 0.034, method: 'weeks', where: 'Amazon and quick commerce (alternate weeks, by city)' },
    budget: 30000,
    adsRepeat: 1.8,
  },
}
