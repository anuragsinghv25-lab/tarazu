import type { SellerDef } from './types'
import { generate, type CatSpec, type Patch } from '../generate'
import { day } from './util'

/* Meera — Saanjh Botanicals, Jaipur (fictional brand).
   Omnichannel: marketplaces plus her own website and a WhatsApp community,
   so she can run every consumer mechanic, including loyalty and referrals. */

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


/* The story SKUs, hand-set so Meera's demo always tells the same story. */
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


const skus = generate(2509, CATS, STORY)

export const meera: SellerDef = {
  id: 'meera',
  name: 'Meera',
  brand: 'Saanjh Botanicals',
  city: 'Jaipur',
  category: 'Ayurvedic skincare & wellness',
  avatar: '#eef4e2',
  channels: ['Amazon', 'Flipkart', 'Nykaa', 'Own website', 'WhatsApp community'],
  problem: 'Overstocked lip balm, expiring serum batches and leftover Diwali gift sets, three weeks before a sale.',
  pitch: 'Sells everywhere, including her own site, so she can use every consumer mechanic from loyalty to referrals.',
  event: 'Big Billion Days',
  calendar: [
    { label: 'Christmas gifting', day: 38, length: 6, kind: 'season' },
    { label: 'New Year sale', day: 47, length: 4, kind: 'event' },
  ],
  market: {
    blendDealPerDay: 150,
    channels: {
      amazon: { label: 'Amazon', commission: 0.14, payment: 0, shipSubsidy: 0, dealPerDay: 350, share: 0.38, boost: 1.9, note: 'Referral fee + Lightning Deal placement', funding: 'Seller-funded' },
      flipkart: { label: 'Flipkart', commission: 0.11, payment: 0, shipSubsidy: 0, dealPerDay: 200, share: 0.27, boost: 1.5, note: 'Commission + deal slot during sale events', funding: 'Seller or co-funded' },
      nykaa: { label: 'Nykaa', commission: 0.22, payment: 0, shipSubsidy: 0, dealPerDay: 0, share: 0.2, boost: 1, note: 'Higher commission, no deal fee', funding: 'Often co-funded' },
      website: { label: 'Own website', commission: 0, payment: 0.02, shipSubsidy: 55, dealPerDay: 0, share: 0.15, boost: 1, note: 'Payment gateway + free shipping you fund', funding: 'Seller-funded' },
    },
  },
  skus,
  heroSkuId: 'vitamin-c-saffron-serum-30-ml',
  story: [
    { id: 'kumkumadi-glow-serum-30-ml', label: 'Bestselling serum' },
    { id: 'vitamin-c-saffron-serum-30-ml', label: 'Expiring serum' },
    { id: 'beetroot-lip-balm-regular', label: 'Overstocked lip balm' },
    { id: 'diwali-glow-box-set', label: 'Leftover gift sets' },
    { id: 'mineral-sunscreen-spf-50-50-g', label: 'Sunscreen' },
    { id: 'rose-toner-200-ml', label: 'Slow toner' },
  ],
  comparePicks: [
    { id: 'mineral-sunscreen-spf-50-50-g', label: 'Sunscreen' },
    { id: 'beetroot-lip-balm-regular', label: 'Lip balm' },
    { id: 'vitamin-c-saffron-serum-30-ml', label: 'Vitamin C serum' },
    { id: 'diwali-glow-box-set', label: 'Diwali gift box' },
    { id: 'kumkumadi-glow-serum-30-ml', label: 'Bestselling serum' },
  ],
  knobs: {
    scenario: 'bbd', daysToEvent: 21, elasticityMult: 1, seasonality: 1.15, competitorPrice: 0, feeLevel: 'current',
    pullForward: 0.15, stockMult: 1, marginFloor: 0.2, goal: 'clear', strategy: 'balanced', dataQuality: 'clean',
  },
  presets: [
    { id: 'normal', label: 'Normal week', blurb: 'No event, steady demand.', controls: { daysToEvent: 60, seasonality: 1, competitorPrice: 0, elasticityMult: 1, pullForward: 0.12, stockMult: 1, feeLevel: 'current', goal: 'margin' } },
    { id: 'bbd', label: 'Big Billion Days', blurb: 'Festive demand spike in 3 weeks; buyers hunt deals.', controls: { daysToEvent: 21, seasonality: 1.15, competitorPrice: 0, elasticityMult: 1, pullForward: 0.15, stockMult: 1, feeLevel: 'current', goal: 'clear' } },
    { id: 'monsoon', label: 'Monsoon slump', blurb: 'Footfall down, sunscreen stalls, stock piles up.', controls: { daysToEvent: 45, seasonality: 0.75, competitorPrice: -0.05, elasticityMult: 1.1, pullForward: 0.1, stockMult: 1.2, feeLevel: 'current', goal: 'clear' } },
    { id: 'price-war', label: 'Competitor price war', blurb: 'Rivals cut prices 18%; buyers compare harder.', controls: { daysToEvent: 21, seasonality: 1.05, competitorPrice: -0.18, elasticityMult: 1.35, pullForward: 0.18, stockMult: 1, feeLevel: 'current', goal: 'grow' } },
    { id: 'overstock', label: 'Overstock crisis', blurb: 'A bulk reorder landed: 1.8× stock everywhere.', controls: { daysToEvent: 30, seasonality: 1, competitorPrice: 0, elasticityMult: 1, pullForward: 0.12, stockMult: 1.8, feeLevel: 'current', goal: 'clear' } },
  ],
  history: { label: 'Diwali 2025 · 40% off everything', discount: 0.4, weeks: 2, seasonality: 1.7 },
  ownChannel: true,
  untapped: [
    { label: 'Bundles: slow toners with bestselling serums', to: '/bundles' },
    { label: 'Referral program for her WhatsApp community', to: '/loyalty' },
    { label: 'Win-back offers for 1,900 lapsed buyers', to: '/loyalty' },
  ],
  promoShare: [0.18, 0.2, 0.22, 0.19, 0.24, 0.26, 0.62, 0.58, 0.3, 0.24, 0.22, 0.21],
  shelf: [
    'kumkumadi-glow-serum-30-ml', 'vitamin-c-saffron-serum-30-ml', 'ubtan-face-wash-100-ml', 'rose-toner-200-ml',
    'aloe-day-moisturiser-50-g', 'beetroot-lip-balm-regular', 'neem-soap-single', 'mineral-sunscreen-spf-50-50-g',
    'diwali-glow-box-set', 'bhringraj-hair-oil-100-ml', 'mini-hair-oil-travel', 'kokum-body-butter-regular',
  ],
  affinity: {
    'Toners & mists': [{ category: 'Face serums', rate: 0.3 }, { category: 'Cleansers', rate: 0.22 }],
    'Lip care': [{ category: 'Cleansers', rate: 0.26 }, { category: 'Face serums', rate: 0.18 }],
    'Masks': [{ category: 'Face serums', rate: 0.24 }, { category: 'Cleansers', rate: 0.2 }],
    'Gift sets': [{ category: 'Face serums', rate: 0.16 }],
    'Body': [{ category: 'Soaps', rate: 0.24 }, { category: 'Hair care', rate: 0.18 }],
    'Travel minis': [{ category: 'Sun care', rate: 0.3 }, { category: 'Face serums', rate: 0.2 }],
    'Attars': [{ category: 'Body', rate: 0.2 }],
    'Tools': [{ category: 'Face serums', rate: 0.28 }, { category: 'Moisturisers', rate: 0.22 }],
    'Kajal & kohl': [{ category: 'Lip care', rate: 0.25 }],
    'Hair care': [{ category: 'Hair care', rate: 0.3 }],
    'Moisturisers': [{ category: 'Cleansers', rate: 0.28 }],
    'Soaps': [{ category: 'Body', rate: 0.2 }],
    'Cleansers': [{ category: 'Moisturisers', rate: 0.26 }],
    'Face serums': [{ category: 'Moisturisers', rate: 0.24 }],
    'Sun care': [{ category: 'Moisturisers', rate: 0.2 }],
  },
  campaigns: [
    { id: 'glow15', name: 'Influencer code GLOW15', mechanic: 'Influencer coupon', status: 'live', channel: 'website', startDay: day(-6), endDay: day(24), budget: 60000, spent: 21400, segment: 'all', match: 'all', conditions: [{ kind: 'code', value: 'GLOW15' }], reward: { kind: 'pctOff', value: 0.15, target: 'cart' }, maxDiscount: 300, perCustomer: 1, redeemed: 96, stacking: 'stackable', priority: 1, funding: 'seller', dailyRedemptions: 14, note: 'Set as stackable by mistake: it combines with the spend tiers.' },
    { id: 'winback', name: 'Win-back: 20% for lapsed buyers', mechanic: 'Personalised offer', status: 'live', channel: 'website', startDay: day(-3), endDay: day(27), budget: 40000, spent: 6200, segment: 'lapsed', match: 'all', conditions: [{ kind: 'cartMin', value: 499 }], reward: { kind: 'pctOff', value: 0.2, target: 'cart' }, maxDiscount: 400, perCustomer: 1, redeemed: 21, stacking: 'exclusive', priority: 2, funding: 'seller', dailyRedemptions: 6 },
    { id: 'first150', name: 'First order: ₹150 off', mechanic: 'Fixed amount off', status: 'live', channel: 'website', startDay: day(-30), endDay: day(60), budget: 90000, spent: 47250, segment: 'new', match: 'all', conditions: [{ kind: 'cartMin', value: 499 }], reward: { kind: 'amountOff', value: 150 }, perCustomer: 1, redeemed: 315, stacking: 'stackable', priority: 3, funding: 'seller', dailyRedemptions: 11 },
    { id: 'face-wash-balm', name: 'Buy a face wash, get a lip balm free', mechanic: 'Buy X get Y', status: 'live', channel: 'website', startDay: day(-2), endDay: day(19), budget: 35000, spent: 2600, segment: 'all', match: 'all', conditions: [{ kind: 'hasCategory', value: 'Cleansers' }], reward: { kind: 'freeItem', sku: 'beetroot-lip-balm-regular' }, perCustomer: 2, totalRedemptions: 600, redeemed: 47, stacking: 'stackable', priority: 4, funding: 'seller', dailyRedemptions: 22, note: 'Clears the lip balm overstock without discounting bestsellers.' },
    { id: 'neem3', name: '3 neem soaps for ₹449', mechanic: 'Multi-buy', status: 'live', channel: 'all', startDay: day(-10), endDay: day(30), budget: 30000, spent: 11800, segment: 'all', match: 'all', conditions: [{ kind: 'qtyMin', value: 3, sku: 'neem-soap-single' }], reward: { kind: 'multiBuy', qty: 3, price: 449, ref: 'neem-soap-single', refKind: 'sku' }, redeemed: 118, stacking: 'stackable', priority: 5, funding: 'seller', dailyRedemptions: 9 },
    { id: 'glow-tier', name: 'Glow tiers: ₹100 off ₹999, ₹300 off ₹1,999', mechanic: 'Tiered spend', status: 'live', channel: 'website', startDay: day(-4), endDay: day(28), budget: 80000, spent: 14300, segment: 'all', match: 'all', conditions: [{ kind: 'cartMin', value: 999 }], reward: { kind: 'tiered', tiers: [{ min: 999, off: 100 }, { min: 1999, off: 300 }] }, redeemed: 88, stacking: 'stackable', priority: 6, funding: 'seller', dailyRedemptions: 18 },
    { id: 'gwp-oil', name: 'Free travel hair oil above ₹1,499', mechanic: 'Gift with purchase', status: 'live', channel: 'website', startDay: day(-4), endDay: day(28), budget: 25000, spent: 3900, segment: 'all', match: 'all', conditions: [{ kind: 'cartMin', value: 1499 }], reward: { kind: 'freeItem', sku: 'mini-hair-oil-travel' }, perCustomer: 1, totalRedemptions: 400, redeemed: 61, stacking: 'stackable', priority: 7, funding: 'seller', dailyRedemptions: 8 },
    { id: 'upi-cb', name: 'UPI cashback 5% up to ₹100', mechanic: 'Cashback', status: 'live', channel: 'website', startDay: day(-8), endDay: day(22), budget: 20000, spent: 7400, segment: 'all', match: 'all', conditions: [{ kind: 'payment', value: 'upi' }], reward: { kind: 'cashback', pct: 0.05, max: 100 }, redeemed: 140, stacking: 'always', priority: 8, funding: 'partner', partnerShare: 1, dailyRedemptions: 20, note: 'Funded by the payments partner, not by Meera.' },
    { id: 'gold2x', name: 'Gold members earn 2× Saanjh Points', mechanic: 'Loyalty points', status: 'live', channel: 'website', startDay: day(-1), endDay: day(29), budget: 50000, spent: 1800, segment: 'gold', match: 'all', conditions: [], reward: { kind: 'points', multiplier: 2 }, redeemed: 34, stacking: 'always', priority: 9, funding: 'seller', dailyRedemptions: 25 },
    { id: 'free-ship', name: 'Free shipping above ₹599', mechanic: 'Free shipping', status: 'live', channel: 'website', startDay: day(-90), endDay: day(90), budget: 120000, spent: 71500, segment: 'all', match: 'all', conditions: [{ kind: 'cartMin', value: 599 }], reward: { kind: 'freeShipping' }, redeemed: 1300, stacking: 'always', priority: 10, funding: 'seller', dailyRedemptions: 40 },
    { id: 'regimen', name: 'Glow regimen: toner + bestselling serum', mechanic: 'Bundle', status: 'scheduled', channel: 'website', startDay: day(3), endDay: day(30), budget: 30000, spent: 0, segment: 'all', match: 'all', conditions: [{ kind: 'hasSku', value: 'rose-toner-200-ml' }, { kind: 'hasSku', value: 'kumkumadi-glow-serum-30-ml' }], reward: { kind: 'bundlePrice', skus: ['rose-toner-200-ml', 'kumkumadi-glow-serum-30-ml'], price: 1199 }, redeemed: 0, stacking: 'stackable', priority: 4, funding: 'seller', dailyRedemptions: 7 },
  ],
  loyalty: {
    program: 'Saanjh Points',
    members: 8400, activeShare: 0.46, ordersMember: 4.1, ordersNonMember: 1.7, aov: 1180, marginPct: 0.52,
    pointsOutstanding: 612000, earnPct: 0.05, breakage: 0.32,
    referral: { give: 200, get: 200, invites: 3100, clicks: 1240, firstOrders: 296, paidCac: 640 },
    fraud: [
      { id: 'f1', who: 'priya.s… → 4 new accounts', signal: 'Same device and delivery pin code', amount: 800 },
      { id: 'f2', who: 'rk_beauty… → 3 new accounts', signal: 'Same UPI handle on every first order', amount: 600 },
      { id: 'f3', who: 'anjali.m… → 2 new accounts', signal: 'Accounts created 4 minutes apart', amount: 400 },
    ],
    lapsed: 1900,
  },
  shippingFee: 79,
  courierCost: 55,
  avgOrder: 1180,
}
