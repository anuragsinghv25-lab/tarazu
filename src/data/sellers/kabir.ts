import type { SellerDef } from './types'
import { generate, type CatSpec, type Patch } from '../generate'
import { day } from './util'

/* Kabir — VoltLane, Delhi (fictional brand).
   Mobile accessories on Amazon, Flipkart, his own website and quick commerce.
   A new 65W charger launches in six weeks, so the old 33W stock must clear first. */

const CATS: CatSpec[] = [
  { category: 'Chargers', lines: ['ChargeMax 20W', 'ChargeMax 33W', 'ChargeMax 45W', 'Dual Port 30W', 'GaN Mini 35W'], variants: [{ label: 'charger', priceMult: 1, rateMult: 1 }], price: [599, 1499], costRatio: [0.42, 0.52], rate: [20, 70], elasticity: -2.1, cannibal: 0.42, halo: 0.35, window: 10, returnRate: 0.05 },
  { category: 'Cables', lines: ['Braided Type-C Cable', 'Type-C to Lightning Cable', 'Magnetic Cable', '3-in-1 Cable'], variants: [{ label: '1 m', priceMult: 1, rateMult: 1 }, { label: '2 m', priceMult: 1.35, rateMult: 0.45 }], price: [249, 499], costRatio: [0.3, 0.4], rate: [30, 90], elasticity: -2.3, cannibal: 0.3, halo: 0.2, window: 20, returnRate: 0.03 },
  { category: 'Power banks', lines: ['PowerCube', 'SlimCharge', 'MagPack Wireless'], variants: [{ label: '10000 mAh', priceMult: 1, rateMult: 1 }, { label: '20000 mAh', priceMult: 1.5, rateMult: 0.5 }], price: [999, 1999], costRatio: [0.5, 0.6], rate: [10, 35], elasticity: -2.2, cannibal: 0.35, halo: 0.15, window: 14, returnRate: 0.06 },
  { category: 'Earbuds', lines: ['AirPulse TWS', 'BassPods TWS', 'NeckBeat Wireless', 'SportBuds'], variants: [{ label: 'black', priceMult: 1, rateMult: 1 }, { label: 'white', priceMult: 1, rateMult: 0.6 }], price: [999, 2499], costRatio: [0.48, 0.58], rate: [8, 30], elasticity: -2.4, cannibal: 0.3, halo: 0.1, window: 12, returnRate: 0.11 },
  { category: 'Cases', lines: ['Clear Armour Case', 'Silicone Grip Case', 'Leather Folio', 'MagSafe Clear Case'], variants: [{ label: 'iPhone 16', priceMult: 1, rateMult: 1 }, { label: 'iPhone 15', priceMult: 1, rateMult: 0.55 }, { label: 'Galaxy S25', priceMult: 1, rateMult: 0.7 }], price: [299, 799], costRatio: [0.22, 0.32], rate: [8, 30], elasticity: -1.9, cannibal: 0.2, halo: 0.25, window: 16, returnRate: 0.05 },
  { category: 'Screen guards', lines: ['Tempered Glass', 'Privacy Glass', 'Matte Guard'], variants: [{ label: 'iPhone 16', priceMult: 1, rateMult: 1 }, { label: 'iPhone 15', priceMult: 1, rateMult: 0.55 }, { label: 'Galaxy S25', priceMult: 1, rateMult: 0.7 }], price: [199, 449], costRatio: [0.15, 0.25], rate: [10, 40], elasticity: -1.8, cannibal: 0.2, halo: 0.2, window: 16, returnRate: 0.04 },
  { category: 'Car accessories', lines: ['Car Charger 38W', 'Magnetic Car Mount', 'Vent Mount', 'Wireless Car Charger'], variants: [{ label: 'standard', priceMult: 1, rateMult: 1 }], price: [399, 1499], costRatio: [0.38, 0.48], rate: [5, 20], elasticity: -2, cannibal: 0.15, halo: 0.15, window: 16, returnRate: 0.04 },
  { category: 'Smartwatch straps', lines: ['Silicone Strap', 'Milanese Loop', 'Nylon Sport Loop'], variants: [{ label: '42 mm', priceMult: 1, rateMult: 1 }, { label: '46 mm', priceMult: 1, rateMult: 0.8 }], price: [299, 799], costRatio: [0.2, 0.3], rate: [4, 15], elasticity: -2.1, cannibal: 0.2, halo: 0.1, window: 16, returnRate: 0.04 },
]

const STORY: Record<string, Patch> = {
  // The old model: 2,400 units, and a 65W successor launches in six weeks.
  'chargemax-33w-charger': { price: 1099, cost: 520, stock: 2400, weeklySales: [210, 205, 198, 190, 184, 176, 170, 162, 151, 144, 138, 130], ageWeeks: 30, sellWindowWeeks: 6, elasticity: -2.4, cannibalRate: 0.46, tags: ['old-model'] },
  'chargemax-45w-charger': { price: 1399, cost: 610, stock: 900, weeklySales: [60, 66, 70, 74, 80, 84, 90, 95, 98, 104, 110, 116], ageWeeks: 8, tags: ['bestseller'] },
  'braided-type-c-cable-1-m': { price: 349, cost: 96, stock: 3200, weeklySales: [260, 255, 270, 262, 268, 275, 280, 271, 284, 290, 286, 292], ageWeeks: 6, haloRate: 0.3, tags: ['bestseller', 'halo'] },
  'airpulse-tws-black': { price: 1799, cost: 940, stock: 1100, weeklySales: [48, 46, 44, 45, 41, 40, 38, 39, 36, 35, 34, 33], ageWeeks: 22, returnRate: 0.14, elasticity: -2.6, tags: ['returns'] },
  'clear-armour-case-iphone-15': { price: 499, cost: 120, stock: 1400, weeklySales: [40, 36, 33, 30, 28, 25, 22, 20, 19, 17, 16, 15], ageWeeks: 40, sellWindowWeeks: 12, elasticity: -2.3, tags: ['old-model'] },
}

const skus = generate(4511, CATS, STORY)

export const kabir: SellerDef = {
  id: 'kabir',
  name: 'Kabir',
  brand: 'VoltLane',
  city: 'Delhi',
  category: 'Mobile accessories',
  avatar: '#d9ead9',
  channels: ['Amazon', 'Flipkart', 'Own website', 'Quick commerce'],
  problem: 'A new 65W charger launches in six weeks, 2,400 old chargers must clear first, and competitors match prices daily.',
  pitch: 'Electronics with model changes and returns: the case for bank offers, bundles, cannibalization between models and open-to-buy.',
  event: 'ChargeMax 65W launch',
  calendar: [
    { label: 'Republic Day sale', day: 70, length: 4, kind: 'event' },
    { label: 'Old 33W must be gone', day: 38, length: 4, kind: 'quiet' },
  ],
  market: {
    blendDealPerDay: 200,
    channels: {
      amazon: { label: 'Amazon', commission: 0.12, payment: 0, shipSubsidy: 0, dealPerDay: 450, share: 0.42, boost: 2, note: 'Referral fee + Lightning Deal; bank offers co-funded', funding: 'Seller or bank-funded' },
      flipkart: { label: 'Flipkart', commission: 0.1, payment: 0, shipSubsidy: 0, dealPerDay: 300, share: 0.28, boost: 1.6, note: 'Commission + deal slot', funding: 'Seller or bank-funded' },
      website: { label: 'Own website', commission: 0, payment: 0.02, shipSubsidy: 60, dealPerDay: 0, share: 0.18, boost: 1, note: 'Payment gateway + shipping; no-cost EMI interest you absorb', funding: 'Seller-funded' },
      quick: { label: 'Quick commerce', commission: 0.2, payment: 0, shipSubsidy: 0, dealPerDay: 150, share: 0.12, boost: 1.3, note: 'Dark-store margin + visibility fee; impulse buys', funding: 'Seller-funded' },
    },
  },
  skus,
  heroSkuId: 'chargemax-33w-charger',
  story: [
    { id: 'chargemax-33w-charger', label: 'Old 33W charger' },
    { id: 'chargemax-45w-charger', label: 'New 45W bestseller' },
    { id: 'braided-type-c-cable-1-m', label: 'Bestselling cable' },
    { id: 'airpulse-tws-black', label: 'Earbuds with returns' },
    { id: 'clear-armour-case-iphone-15', label: 'Last-gen cases' },
  ],
  comparePicks: [
    { id: 'chargemax-33w-charger', label: '33W charger' },
    { id: 'airpulse-tws-black', label: 'Earbuds' },
    { id: 'clear-armour-case-iphone-15', label: 'iPhone 15 case' },
    { id: 'braided-type-c-cable-1-m', label: 'Cable' },
  ],
  knobs: {
    scenario: 'launch', daysToEvent: 42, elasticityMult: 1, seasonality: 1, competitorPrice: -0.06, feeLevel: 'current',
    pullForward: 0.08, stockMult: 1, marginFloor: 0.18, goal: 'clear', strategy: 'balanced', dataQuality: 'clean',
  },
  presets: [
    { id: 'normal', label: 'Normal week', blurb: 'No launch pressure, rivals at par.', controls: { daysToEvent: 70, seasonality: 1, competitorPrice: 0, elasticityMult: 1, pullForward: 0.08, stockMult: 1, goal: 'margin' } },
    { id: 'launch', label: 'New model launch', blurb: '65W arrives in 6 weeks; the 33W must clear first.', controls: { daysToEvent: 42, seasonality: 1, competitorPrice: -0.06, elasticityMult: 1, pullForward: 0.08, stockMult: 1, goal: 'clear' } },
    { id: 'match', label: 'Daily price matching', blurb: 'Rivals reprice every morning, 10% under you.', controls: { competitorPrice: -0.1, elasticityMult: 1.3, pullForward: 0.1, goal: 'grow' } },
    { id: 'festival', label: 'Great Indian Festival', blurb: 'Demand doubles; bank offers everywhere.', controls: { daysToEvent: 10, seasonality: 1.8, competitorPrice: -0.05, elasticityMult: 1.15, pullForward: 0.15, feeLevel: 'high', goal: 'grow' } },
    { id: 'overstock', label: 'Shipment landed early', blurb: 'A container arrived: 1.6× stock across the range.', controls: { stockMult: 1.6, goal: 'clear' } },
  ],
  history: { label: 'Great Indian Festival 2026 · 35% off everything', discount: 0.35, weeks: 2, seasonality: 1.8 },
  ownChannel: true,
  untapped: [
    { label: 'Charger + cable bundles (cable buyers already add a charger 1 in 3)', to: '/bundles' },
    { label: 'Bank offers and no-cost EMI on his own website', to: '/campaigns' },
    { label: 'Loyalty for upgrade buyers (case → charger → earbuds)', to: '/loyalty' },
  ],
  promoShare: [0.28, 0.3, 0.27, 0.32, 0.35, 0.33, 0.58, 0.61, 0.38, 0.33, 0.31, 0.34],
  shelf: [
    'chargemax-33w-charger', 'chargemax-45w-charger', 'braided-type-c-cable-1-m', 'airpulse-tws-black',
    'clear-armour-case-iphone-15', 'clear-armour-case-iphone-16', 'tempered-glass-iphone-16', 'powercube-10000-mah',
    'car-charger-38w-standard', 'silicone-strap-42-mm',
  ],
  affinity: {
    'Chargers': [{ category: 'Cables', rate: 0.42 }, { category: 'Power banks', rate: 0.12 }],
    'Cases': [{ category: 'Screen guards', rate: 0.45 }, { category: 'Chargers', rate: 0.15 }],
    'Earbuds': [{ category: 'Cables', rate: 0.2 }, { category: 'Chargers', rate: 0.18 }],
    'Power banks': [{ category: 'Cables', rate: 0.38 }],
    'Screen guards': [{ category: 'Cases', rate: 0.4 }],
    'Car accessories': [{ category: 'Cables', rate: 0.3 }],
    'Smartwatch straps': [{ category: 'Chargers', rate: 0.1 }],
    'Cables': [{ category: 'Chargers', rate: 0.33 }],
  },
  campaigns: [
    { id: 'bank10', name: 'Partner bank card: 10% instant off up to ₹500', mechanic: 'Bank offer', status: 'live', channel: 'all', startDay: day(-7), endDay: day(21), budget: 80000, spent: 26400, segment: 'all', match: 'all', conditions: [{ kind: 'payment', value: 'credit-card' }, { kind: 'cartMin', value: 999 }], reward: { kind: 'pctOff', value: 0.1, target: 'cart' }, maxDiscount: 500, redeemed: 260, stacking: 'always', priority: 9, funding: 'bank', partnerShare: 0.6, dailyRedemptions: 34, note: 'Bank funds 60%; Kabir funds 40%.' },
    { id: 'volt20', name: 'Coupon VOLT20: 20% off', mechanic: 'Coupon', status: 'live', channel: 'website', startDay: day(-12), endDay: day(18), budget: 40000, spent: 33900, segment: 'all', match: 'all', conditions: [{ kind: 'code', value: 'VOLT20' }], reward: { kind: 'pctOff', value: 0.2, target: 'cart' }, redeemed: 410, stacking: 'stackable', priority: 2, funding: 'seller', dailyRedemptions: 52, note: 'Leaked to a coupon site 5 days ago: redemptions tripled.' },
    { id: 'charger-cable', name: 'ChargeMax 33W + braided cable for ₹1,199', mechanic: 'Bundle', status: 'live', channel: 'all', startDay: day(-2), endDay: day(40), budget: 90000, spent: 4100, segment: 'all', match: 'all', conditions: [{ kind: 'hasSku', value: 'chargemax-33w-charger' }, { kind: 'hasSku', value: 'braided-type-c-cable-1-m' }], reward: { kind: 'bundlePrice', skus: ['chargemax-33w-charger', 'braided-type-c-cable-1-m'], price: 1199 }, redeemed: 26, stacking: 'stackable', priority: 3, funding: 'seller', dailyRedemptions: 45 },
    { id: 'case-guard', name: 'Case + screen guard: 25% off the guard', mechanic: 'Buy X get Y', status: 'live', channel: 'website', startDay: day(-20), endDay: day(40), budget: 20000, spent: 9400, segment: 'all', match: 'all', conditions: [{ kind: 'hasCategory', value: 'Cases' }, { kind: 'hasCategory', value: 'Screen guards' }], reward: { kind: 'pctOff', value: 0.25, target: 'category', ref: 'Screen guards' }, redeemed: 190, stacking: 'stackable', priority: 4, funding: 'seller', dailyRedemptions: 9 },
    { id: 'emi', name: 'No-cost EMI above ₹2,999', mechanic: 'No-cost EMI', status: 'live', channel: 'website', startDay: day(-30), endDay: day(60), budget: 30000, spent: 12200, segment: 'all', match: 'all', conditions: [{ kind: 'payment', value: 'emi' }, { kind: 'cartMin', value: 2999 }], reward: { kind: 'amountOff', value: 180 }, redeemed: 68, stacking: 'always', priority: 8, funding: 'seller', dailyRedemptions: 3, note: 'Modelled as the EMI interest Kabir pays to the lender (≈6% of order).' },
    { id: 'free-ship', name: 'Free shipping above ₹499', mechanic: 'Free shipping', status: 'live', channel: 'website', startDay: day(-90), endDay: day(90), budget: 60000, spent: 30500, segment: 'all', match: 'all', conditions: [{ kind: 'cartMin', value: 499 }], reward: { kind: 'freeShipping' }, redeemed: 520, stacking: 'always', priority: 10, funding: 'seller', dailyRedemptions: 18 },
  ],
  loyalty: {
    program: 'VoltLane Plus',
    members: 5200, activeShare: 0.38, ordersMember: 2.6, ordersNonMember: 1.3, aov: 1240, marginPct: 0.44,
    pointsOutstanding: 268000, earnPct: 0.03, breakage: 0.4,
    referral: { give: 150, get: 150, invites: 1400, clicks: 520, firstOrders: 118, paidCac: 410 },
    fraud: [
      { id: 'f1', who: 'deal_hunter… → 6 new accounts', signal: 'Same device, VOLT20 on every order', amount: 900 },
    ],
    lapsed: 1300,
  },
  shippingFee: 49,
  courierCost: 60,
  avgOrder: 1240,
}
