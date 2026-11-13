import type { SellerDef } from './types'
import { generate, type CatSpec, type Patch } from '../generate'
import { day } from './util'

/* Anaya — Malwa Bites, Indore (fictional brand).
   A snacks and chai brand that sells through distributors to kiranas and
   modern trade, plus quick commerce and Amazon. Her promotions are trade
   promotions: money paid to retailers and distributors. This is Brand mode. */

const PACKS = [{ label: '200 g', priceMult: 1, rateMult: 1 }, { label: '400 g', priceMult: 1.8, rateMult: 0.6 }, { label: '1 kg', priceMult: 4, rateMult: 0.18 }]

const CATS: CatSpec[] = [
  { category: 'Namkeen', lines: ['Indori Sev', 'Ratlami Sev', 'Khatta Meetha Mix', 'Navratan Mixture', 'Bhujia', 'Moong Dal'], variants: PACKS, price: [55, 85], costRatio: [0.48, 0.56], rate: [120, 420], elasticity: -2.2, cannibal: 0.35, halo: 0.12, window: 14, expiry: 18 },
  { category: 'Chai blends', lines: ['Masala Chai', 'Elaichi Chai', 'Adrak Chai', 'Kadak Assam CTC'], variants: [{ label: '250 g', priceMult: 1, rateMult: 1 }, { label: '500 g', priceMult: 1.85, rateMult: 0.55 }], price: [140, 220], costRatio: [0.44, 0.52], rate: [80, 260], elasticity: -1.7, cannibal: 0.3, halo: 0.25, window: 20, expiry: 40 },
  { category: 'Makhana', lines: ['Peri Peri Makhana', 'Cream & Onion Makhana', 'Himalayan Salt Makhana', 'Pudina Makhana'], variants: [{ label: '80 g', priceMult: 1, rateMult: 1 }], price: [99, 149], costRatio: [0.46, 0.54], rate: [60, 180], elasticity: -2.4, cannibal: 0.28, halo: 0.15, window: 12, expiry: 20 },
  { category: 'Cookies', lines: ['Atta Jeera Cookies', 'Nankhatai', 'Ajwain Cookies', 'Coconut Cookies', 'Millet Cookies'], variants: [{ label: '250 g', priceMult: 1, rateMult: 1 }], price: [80, 140], costRatio: [0.46, 0.54], rate: [70, 220], elasticity: -2.1, cannibal: 0.25, halo: 0.2, window: 10, expiry: 14 },
  { category: 'Poha & chivda', lines: ['Indori Poha Chivda', 'Corn Chivda', 'Diet Chivda'], variants: [{ label: '200 g', priceMult: 1, rateMult: 1 }, { label: '400 g', priceMult: 1.8, rateMult: 0.5 }], price: [60, 95], costRatio: [0.48, 0.56], rate: [60, 200], elasticity: -2.2, cannibal: 0.3, halo: 0.12, window: 12, expiry: 16 },
  { category: 'Gift packs', lines: ['Malwa Festive Hamper', 'Chai & Cookies Box', 'Namkeen Trio Box'], variants: [{ label: 'box', priceMult: 1, rateMult: 1 }], price: [399, 799], costRatio: [0.5, 0.58], rate: [10, 40], elasticity: -2.6, cannibal: 0.15, halo: 0.1, window: 5, expiry: 12 },
]

const STORY: Record<string, Patch> = {
  'indori-sev-400-g': { price: 129, cost: 66, stock: 9200, weeklySales: [820, 840, 860, 900, 880, 910, 940, 920, 950, 930, 960, 980], ageWeeks: 3, tags: ['bestseller', 'halo'] },
  'masala-chai-250-g': { price: 169, cost: 78, stock: 6100, weeklySales: [420, 430, 450, 470, 500, 520, 540, 560, 580, 600, 620, 640], ageWeeks: 4, tags: ['bestseller', 'halo'], haloRate: 0.32 },
  'navratan-mixture-1-kg': { price: 299, cost: 162, stock: 2600, weeklySales: [70, 68, 66, 62, 60, 58, 55, 53, 50, 48, 46, 45], ageWeeks: 12, expiryWeeks: 8, sellWindowWeeks: 8, tags: ['expiring'] },
  'malwa-festive-hamper-box': { price: 599, cost: 330, stock: 1800, weeklySales: [20, 30, 60, 120, 260, 420, 380, 90, 40, 30, 26, 24], ageWeeks: 10, sellWindowWeeks: 5, elasticity: -2.8, tags: ['giftset'] },
  'pudina-makhana-80-g': { price: 129, cost: 64, stock: 4200, weeklySales: [140, 132, 126, 120, 116, 110, 104, 100, 96, 92, 88, 85], ageWeeks: 16, tags: ['overstock'] },
}

const skus = generate(3303, CATS, STORY, { price9: false })

export const anaya: SellerDef = {
  id: 'anaya',
  name: 'Anaya',
  brand: 'Malwa Bites',
  city: 'Indore',
  category: 'Snacks & chai brand · Brand mode',
  avatar: '#fdeedd',
  channels: ['Distributors → kiranas', 'Modern trade', 'Quick commerce', 'Amazon'],
  problem: 'Trade spend is a quarter of gross sales, retailers short-pay invoices, and nobody knows which deals pay back.',
  pitch: 'A brand selling through retailers: trade promotions, off-invoice vs scan-based, slotting, deductions and gross-to-net.',
  event: 'Q4 trade terms review',
  calendar: [
    { label: 'Winter chai season', day: 10, length: 40, kind: 'season' },
    { label: 'Makar Sankranti', day: 63, length: 3, kind: 'event' },
  ],
  market: {
    blendDealPerDay: 300,
    channels: {
      kirana: { label: 'Kiranas via distributor', commission: 0.24, payment: 0, shipSubsidy: 2, dealPerDay: 200, share: 0.5, boost: 1.2, note: 'Distributor 8% + retailer 16% margin; schemes run as free goods', funding: 'Brand-funded' },
      modern: { label: 'Modern trade', commission: 0.22, payment: 0, shipSubsidy: 3, dealPerDay: 600, share: 0.22, boost: 1.6, note: 'Retailer margin + listing and display fees', funding: 'Brand-funded, claimed as deductions' },
      quick: { label: 'Quick commerce', commission: 0.26, payment: 0, shipSubsidy: 0, dealPerDay: 350, share: 0.18, boost: 1.7, note: 'Platform margin + visibility ads', funding: 'Brand-funded' },
      amazon: { label: 'Amazon', commission: 0.15, payment: 0, shipSubsidy: 8, dealPerDay: 300, share: 0.1, boost: 1.8, note: 'Referral fee + coupons', funding: 'Brand-funded' },
    },
  },
  skus,
  heroSkuId: 'navratan-mixture-1-kg',
  story: [
    { id: 'indori-sev-400-g', label: 'Hero SKU: Indori sev' },
    { id: 'masala-chai-250-g', label: 'Masala chai' },
    { id: 'navratan-mixture-1-kg', label: 'Near-expiry mixture' },
    { id: 'malwa-festive-hamper-box', label: 'Leftover hampers' },
    { id: 'pudina-makhana-80-g', label: 'Overstocked makhana' },
  ],
  comparePicks: [
    { id: 'indori-sev-400-g', label: 'Indori sev 400 g' },
    { id: 'masala-chai-250-g', label: 'Masala chai' },
    { id: 'pudina-makhana-80-g', label: 'Makhana' },
    { id: 'malwa-festive-hamper-box', label: 'Hamper' },
  ],
  knobs: {
    scenario: 'renegotiation', daysToEvent: 18, elasticityMult: 1, seasonality: 1.1, competitorPrice: -0.04, feeLevel: 'high',
    pullForward: 0.2, stockMult: 1, marginFloor: 0.12, goal: 'margin', strategy: 'balanced', dataQuality: 'messy',
  },
  presets: [
    { id: 'normal', label: 'Normal quarter', blurb: 'Steady offtake, standard trade terms.', controls: { daysToEvent: 60, seasonality: 1, competitorPrice: 0, feeLevel: 'current', pullForward: 0.15, goal: 'margin' } },
    { id: 'renegotiation', label: 'Retailer renegotiation', blurb: 'Modern trade wants 3 points more margin and new listing fees.', controls: { daysToEvent: 18, seasonality: 1.1, competitorPrice: -0.04, feeLevel: 'high', pullForward: 0.2, goal: 'margin' } },
    { id: 'chai-season', label: 'Winter chai season', blurb: 'Chai and cookies demand up 35%.', controls: { seasonality: 1.35, daysToEvent: 30, feeLevel: 'current', goal: 'grow' } },
    { id: 'tpr-war', label: 'Competitor TPR war', blurb: 'A national brand runs ₹10 off on every sev pack.', controls: { competitorPrice: -0.12, elasticityMult: 1.25, pullForward: 0.22, goal: 'grow' } },
    { id: 'loaded', label: 'Distributor overloaded', blurb: 'Last scheme pushed 1.8× stock into the pipeline.', controls: { stockMult: 1.8, pullForward: 0.25, goal: 'clear' } },
  ],
  history: { label: 'Diwali 2026 · 25% TPR across every account', discount: 0.25, weeks: 3, seasonality: 1.5 },
  ownChannel: false,
  untapped: [
    { label: 'Scan-based deals instead of off-invoice (pay only for what shoppers buy)', to: '/brand' },
    { label: 'Chai + cookies combo packs for winter', to: '/bundles' },
    { label: 'Deduction matching: ₹1.4 L claimed without a matching promotion', to: '/brand' },
  ],
  promoShare: [0.32, 0.34, 0.35, 0.33, 0.38, 0.42, 0.55, 0.52, 0.4, 0.37, 0.36, 0.35],
  shelf: [
    'indori-sev-200-g', 'indori-sev-400-g', 'ratlami-sev-200-g', 'masala-chai-250-g', 'navratan-mixture-1-kg',
    'pudina-makhana-80-g', 'atta-jeera-cookies-250-g', 'nankhatai-250-g', 'malwa-festive-hamper-box', 'indori-poha-chivda-200-g',
  ],
  affinity: {
    'Makhana': [{ category: 'Chai blends', rate: 0.28 }, { category: 'Namkeen', rate: 0.2 }],
    'Cookies': [{ category: 'Chai blends', rate: 0.4 }],
    'Gift packs': [{ category: 'Chai blends', rate: 0.15 }],
    'Namkeen': [{ category: 'Chai blends', rate: 0.3 }, { category: 'Namkeen', rate: 0.22 }],
    'Poha & chivda': [{ category: 'Chai blends', rate: 0.26 }],
    'Chai blends': [{ category: 'Cookies', rate: 0.32 }],
  },
  campaigns: [
    { id: 'sev2', name: 'Indori sev 400 g: 2 for ₹220', mechanic: 'Multi-buy', status: 'live', channel: 'modern', startDay: day(-6), endDay: day(15), budget: 120000, spent: 38000, segment: 'all', match: 'all', conditions: [{ kind: 'qtyMin', value: 2, sku: 'indori-sev-400-g' }], reward: { kind: 'multiBuy', qty: 2, price: 220, ref: 'indori-sev-400-g', refKind: 'sku' }, redeemed: 4100, stacking: 'stackable', priority: 2, funding: 'seller', dailyRedemptions: 380, note: 'Scan-based: Malwa Bites pays only on units scanned at the till.' },
    { id: 'chai-cookie', name: 'Chai time: masala chai + cookies for ₹249', mechanic: 'Bundle', status: 'scheduled', channel: 'quick', startDay: day(5), endDay: day(45), budget: 90000, spent: 0, segment: 'all', match: 'all', conditions: [{ kind: 'hasSku', value: 'masala-chai-250-g' }, { kind: 'hasSku', value: 'atta-jeera-cookies-250-g' }], reward: { kind: 'bundlePrice', skus: ['masala-chai-250-g', 'atta-jeera-cookies-250-g'], price: 249 }, redeemed: 0, stacking: 'stackable', priority: 3, funding: 'seller', dailyRedemptions: 160 },
    { id: 'amz-coupon', name: 'Amazon coupon: 10% off makhana', mechanic: 'Coupon', status: 'live', channel: 'amazon', startDay: day(-3), endDay: day(27), budget: 25000, spent: 4200, segment: 'all', match: 'all', conditions: [{ kind: 'hasCategory', value: 'Makhana' }], reward: { kind: 'pctOff', value: 0.1, target: 'category', ref: 'Makhana' }, redeemed: 320, stacking: 'stackable', priority: 4, funding: 'seller', dailyRedemptions: 60 },
    { id: 'qc20', name: 'Quick commerce: ₹20 off orders with 3 snacks', mechanic: 'Fixed amount off', status: 'live', channel: 'quick', startDay: day(-1), endDay: day(13), budget: 40000, spent: 1300, segment: 'all', match: 'all', conditions: [{ kind: 'qtyMin', value: 3, category: 'Namkeen' }], reward: { kind: 'amountOff', value: 20 }, redeemed: 65, stacking: 'stackable', priority: 5, funding: 'co-funded', partnerShare: 0.3, dailyRedemptions: 140 },
  ],
  trade: {
    quarter: 'Q3 FY27 (Oct–Dec 2026)',
    accounts: [
      { id: 'malwa-dist', name: 'Malwa Distributors', kind: 'Distributor · 2,400 kiranas', gross: 8000000, color: '#b45309' },
      { id: 'bazaar', name: 'Bazaar Mart', kind: 'Modern trade · 120 stores', gross: 4000000, color: '#1e7b4f' },
      { id: 'quick', name: 'Quick commerce', kind: '3 apps · 9 cities', gross: 2700000, color: '#5b6fb5' },
      { id: 'amazon', name: 'Amazon', kind: 'Marketplace', gross: 1200000, color: '#7a8580' },
    ],
    lines: [
      { id: 'd-oi', account: 'malwa-dist', mechanism: 'off-invoice', label: 'Off-invoice 6% on all SKUs', spend: 1104000, incGP: 420000 },
      { id: 'd-fg', account: 'malwa-dist', mechanism: 'free-goods', label: 'Buy 10 cases, get 1 free (Diwali)', spend: 836000, incGP: 300000 },
      { id: 'b-scan', account: 'bazaar', mechanism: 'scan-based', label: 'Scan-based ₹10 off Indori sev 400 g', spend: 472000, incGP: 876000 },
      { id: 'b-slot', account: 'bazaar', mechanism: 'slotting', label: 'Listing fee for 6 new SKUs', spend: 360000, incGP: 192000 },
      { id: 'b-coop', account: 'bazaar', mechanism: 'co-op', label: 'Diwali end-cap display, 40 stores', spend: 280000, incGP: 364000 },
      { id: 'b-bb', account: 'bazaar', mechanism: 'bill-back', label: 'Bill-back 8% on gift hampers', spend: 192000, incGP: 82000 },
      { id: 'q-vis', account: 'quick', mechanism: 'visibility', label: 'Search ads and banners', spend: 420000, incGP: 536000 },
      { id: 'q-scan', account: 'quick', mechanism: 'scan-based', label: 'Funded ₹20 off on 3-snack baskets', spend: 184000, incGP: 242000 },
      { id: 'a-coupon', account: 'amazon', mechanism: 'visibility', label: 'Coupons and sponsored ads', spend: 176000, incGP: 140000 },
    ],
    distributorMargin: 0.08,
    returnsDamages: 0.018,
    deductions: [
      { id: 'dd1', account: 'Bazaar Mart', promo: 'Scan-based ₹10 off sev', accrued: 472000, claimed: 472000, daysOpen: 12, status: 'matched' },
      { id: 'dd2', account: 'Bazaar Mart', promo: 'Diwali end-cap display', accrued: 280000, claimed: 380000, daysOpen: 26, status: 'over-claim' },
      { id: 'dd3', account: 'Bazaar Mart', promo: '— no matching promotion', accrued: 0, claimed: 88000, daysOpen: 41, status: 'unmatched' },
      { id: 'dd4', account: 'Malwa Distributors', promo: 'Buy 10 get 1 free', accrued: 836000, claimed: 836000, daysOpen: 9, status: 'matched' },
      { id: 'dd5', account: 'Malwa Distributors', promo: '"Damaged stock" credit', accrued: 0, claimed: 52000, daysOpen: 33, status: 'unmatched' },
      { id: 'dd6', account: 'Quick commerce', promo: 'Funded ₹20 off', accrued: 184000, claimed: 142000, daysOpen: 5, status: 'pending' },
    ],
    sellIn: [1820, 1790, 1850, 1810, 3420, 3680, 980, 820, 1050, 1390, 1640, 1760],
    sellOut: [1780, 1800, 1820, 1830, 1990, 2060, 1880, 1840, 1800, 1810, 1790, 1800],
    schemeWeeks: [4, 5],
  },
  shippingFee: 0,
  courierCost: 0,
  avgOrder: 340,
}
