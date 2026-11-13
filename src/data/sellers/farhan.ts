import type { SellerDef } from './types'
import { generate, type CatSpec, type Patch } from '../generate'
import { day } from './util'

/* Farhan — Rangreza Weaves, Surat (fictional brand).
   Marketplace-only saree and kurti seller: thin margins, high returns,
   a price war, and buyers trained by constant sales (Hi-Lo). */

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'].map((label, i) => ({ label, priceMult: 1, rateMult: [0.7, 1.15, 1.2, 0.9, 0.45][i] }))
const COLOURS = (labels: string[]) => labels.map((label, i) => ({ label, priceMult: 1, rateMult: [1.15, 0.9, 0.65][i] ?? 0.6 }))

const CATS: CatSpec[] = [
  { category: 'Cotton sarees', lines: ['Kota Doria Saree', 'Bagru Print Saree', 'Mangalgiri Saree', 'Handloom Tant Saree', 'Chanderi Cotton Saree', 'Ikat Cotton Saree', 'Kalamkari Saree', 'Linen Blend Saree', 'Jamdani Cotton Saree', 'Ajrakh Saree'], variants: COLOURS(['indigo', 'mustard', 'maroon']), price: [449, 699], costRatio: [0.48, 0.58], rate: [10, 32], elasticity: -2.4, cannibal: 0.3, halo: 0.12, window: 10, returnRate: 0.16 },
  { category: 'Georgette sarees', lines: ['Bandhani Georgette Saree', 'Floral Georgette Saree', 'Leheriya Georgette Saree', 'Sequin Border Saree', 'Ombre Georgette Saree', 'Digital Print Saree', 'Mirror Work Saree', 'Zari Border Saree', 'Pastel Georgette Saree', 'Foil Print Saree'], variants: COLOURS(['rani', 'teal', 'peach']), price: [399, 649], costRatio: [0.46, 0.56], rate: [12, 40], elasticity: -2.7, cannibal: 0.34, halo: 0.12, window: 10, returnRate: 0.2 },
  { category: 'Chiffon sarees', lines: ['Plain Chiffon Saree', 'Printed Chiffon Saree', 'Lace Border Chiffon', 'Shaded Chiffon Saree', 'Stone Work Chiffon', 'Polka Chiffon Saree'], variants: COLOURS(['black', 'wine']), price: [349, 549], costRatio: [0.48, 0.58], rate: [8, 24], elasticity: -2.6, cannibal: 0.3, halo: 0.1, window: 10, returnRate: 0.18 },
  { category: 'Kurtis', lines: ['Anarkali Kurti', 'A-line Cotton Kurti', 'Straight Rayon Kurti', 'Kalamkari Cotton Kurti', 'Angrakha Kurti', 'Chikankari Kurti', 'Block Print Kurti', 'Tiered Kurti', 'Shirt Collar Kurti', 'Kaftan Kurti'], variants: SIZES, price: [349, 599], costRatio: [0.45, 0.55], rate: [6, 20], elasticity: -2.5, cannibal: 0.22, halo: 0.18, window: 12, returnRate: 0.24 },
  { category: 'Kurta sets', lines: ['Cotton Kurta Set', 'Rayon Palazzo Set', 'Sharara Set', 'Co-ord Set', 'Dhoti Pant Set', 'Festive Kurta Set'], variants: SIZES.slice(0, 4), price: [649, 999], costRatio: [0.46, 0.56], rate: [5, 15], elasticity: -2.3, cannibal: 0.22, halo: 0.15, window: 12, returnRate: 0.22 },
  { category: 'Dupattas', lines: ['Bandhani Dupatta', 'Phulkari Dupatta', 'Chanderi Dupatta', 'Mul Cotton Dupatta', 'Leheriya Dupatta', 'Gota Patti Dupatta', 'Banarasi Dupatta', 'Kota Dupatta'], variants: COLOURS(['red', 'green']), price: [199, 349], costRatio: [0.42, 0.52], rate: [6, 22], elasticity: -2.4, cannibal: 0.2, halo: 0.2, window: 12, returnRate: 0.1 },
  { category: 'Lehengas', lines: ['Navratri Chaniya Choli', 'Mirror Work Lehenga', 'Bandhani Lehenga', 'Festive Net Lehenga', 'Kutchi Lehenga', 'Garba Skirt Set'], variants: [{ label: 'free size', priceMult: 1, rateMult: 1 }], price: [999, 1599], costRatio: [0.5, 0.6], rate: [3, 10], elasticity: -2.8, cannibal: 0.15, halo: 0.1, window: 6, returnRate: 0.2 },
  { category: 'Blouses', lines: ['Readymade Cotton Blouse', 'Brocade Blouse', 'Sleeveless Blouse', 'Puff Sleeve Blouse', 'Mirror Work Blouse', 'Boat Neck Blouse'], variants: SIZES.slice(1, 4), price: [249, 399], costRatio: [0.44, 0.54], rate: [5, 16], elasticity: -2.2, cannibal: 0.18, halo: 0.15, window: 12, returnRate: 0.18 },
]

const STORY: Record<string, Patch> = {
  // The bestseller a rival undercuts by ₹60 every other day.
  'bandhani-georgette-saree-rani': { price: 549, cost: 268, stock: 640, weeklySales: [62, 66, 64, 70, 68, 72, 75, 61, 58, 55, 52, 50], ageWeeks: 4, elasticity: -3, cannibalRate: 0.36, tags: ['bestseller'] },
  // Broken sizes left after the season: only XXL and S remain of a good kurti.
  'kalamkari-cotton-kurti-xxl': { price: 449, cost: 210, stock: 260, weeklySales: [7, 6, 6, 5, 5, 4, 5, 4, 3, 4, 3, 3], ageWeeks: 24, sellWindowWeeks: 8, tags: ['broken-sizes'] },
  'kalamkari-cotton-kurti-s': { price: 449, cost: 210, stock: 180, weeklySales: [9, 8, 7, 7, 6, 6, 5, 5, 5, 4, 4, 4], ageWeeks: 24, sellWindowWeeks: 8, tags: ['broken-sizes'] },
  // Navratri is over and 300 chaniya cholis are still in the godown.
  'navratri-chaniya-choli-free-size': { price: 1299, cost: 690, stock: 300, weeklySales: [6, 9, 14, 24, 42, 66, 58, 21, 8, 5, 4, 4], ageWeeks: 14, sellWindowWeeks: 5, elasticity: -3.1, tags: ['seasonal'] },
  'bandhani-dupatta-red': { price: 299, cost: 128, stock: 900, weeklySales: [20, 19, 18, 18, 17, 16, 17, 15, 16, 15, 14, 15], ageWeeks: 20, elasticity: -2.6, tags: ['overstock'] },
  'readymade-cotton-blouse-m': { price: 299, cost: 140, stock: 520, weeklySales: [34, 36, 35, 38, 37, 39, 36, 38, 40, 37, 39, 41], ageWeeks: 3, tags: ['bestseller', 'halo'], haloRate: 0.3 },
}

const skus = generate(1407, CATS, STORY, { price9: false })

export const farhan: SellerDef = {
  id: 'farhan',
  name: 'Farhan',
  brand: 'Rangreza Weaves',
  city: 'Surat',
  category: 'Sarees & ethnic wear · marketplace-only',
  avatar: '#f5dccf',
  channels: ['Meesho', 'Flipkart', 'Amazon'],
  problem: 'A rival undercuts his bestseller every other day, season-end stock is stuck in broken sizes, and buyers only order on sale.',
  pitch: 'Lives on marketplaces with thin margins and high returns: the clearest case for flash deals, fee compare, co-funding and promo fatigue.',
  event: 'Wedding Season Sale',
  calendar: [
    { label: 'Meesho mega sale', day: 34, length: 4, kind: 'event' },
    { label: 'Winter season end', day: 52, length: 10, kind: 'season' },
  ],
  market: {
    blendDealPerDay: 120,
    channels: {
      meesho: { label: 'Meesho', commission: 0, payment: 0, shipSubsidy: 38, dealPerDay: 120, share: 0.48, boost: 1.4, note: 'Zero commission, but you pay forward shipping and absorb return-to-origin', funding: 'Seller-funded' },
      flipkart: { label: 'Flipkart', commission: 0.12, payment: 0, shipSubsidy: 12, dealPerDay: 250, share: 0.32, boost: 1.7, note: 'Commission + fixed fee + deal slot', funding: 'Co-funded in big sale events' },
      amazon: { label: 'Amazon', commission: 0.16, payment: 0, shipSubsidy: 18, dealPerDay: 350, share: 0.2, boost: 1.9, note: 'Referral fee + closing fee + Lightning Deal', funding: 'Seller-funded' },
    },
  },
  skus,
  heroSkuId: 'navratri-chaniya-choli-free-size',
  story: [
    { id: 'bandhani-georgette-saree-rani', label: 'Bestseller under attack' },
    { id: 'navratri-chaniya-choli-free-size', label: 'Post-Navratri lehengas' },
    { id: 'kalamkari-cotton-kurti-xxl', label: 'Broken sizes' },
    { id: 'bandhani-dupatta-red', label: 'Overstocked dupattas' },
    { id: 'readymade-cotton-blouse-m', label: 'Bestselling blouse' },
  ],
  comparePicks: [
    { id: 'bandhani-georgette-saree-rani', label: 'Bandhani saree' },
    { id: 'navratri-chaniya-choli-free-size', label: 'Chaniya choli' },
    { id: 'kalamkari-cotton-kurti-xxl', label: 'Kurti, XXL' },
    { id: 'bandhani-dupatta-red', label: 'Dupatta' },
  ],
  knobs: {
    scenario: 'price-war', daysToEvent: 18, elasticityMult: 1.2, seasonality: 1.05, competitorPrice: -0.12, feeLevel: 'current',
    pullForward: 0.18, stockMult: 1, marginFloor: 0.15, goal: 'grow', strategy: 'hilo', dataQuality: 'clean',
  },
  presets: [
    { id: 'normal', label: 'Normal week', blurb: 'No sale running, rivals at par.', controls: { daysToEvent: 50, seasonality: 1, competitorPrice: 0, elasticityMult: 1.1, pullForward: 0.14, stockMult: 1, goal: 'margin' } },
    { id: 'price-war', label: 'Price war', blurb: 'A rival cuts 12% on lookalike sarees every other day.', controls: { daysToEvent: 18, seasonality: 1.05, competitorPrice: -0.12, elasticityMult: 1.2, pullForward: 0.18, stockMult: 1, goal: 'grow' } },
    { id: 'wedding', label: 'Wedding Season Sale', blurb: 'Demand up 40% for two weeks; deal slots are expensive.', controls: { daysToEvent: 7, seasonality: 1.4, competitorPrice: -0.05, elasticityMult: 1.15, pullForward: 0.2, stockMult: 1, feeLevel: 'high', goal: 'grow' } },
    { id: 'season-end', label: 'Season-end clearance', blurb: 'Festive wear stops selling; broken sizes pile up.', controls: { daysToEvent: 40, seasonality: 0.8, competitorPrice: -0.08, elasticityMult: 1.25, pullForward: 0.1, stockMult: 1.3, goal: 'clear' } },
    { id: 'edlp-test', label: 'What if: go EDLP', blurb: 'Stop constant sales; price fairly every day.', controls: { strategy: 'edlp', pullForward: 0.1, elasticityMult: 1, competitorPrice: -0.08, goal: 'margin' } },
  ],
  history: { label: 'Navratri 2026 · 35% off sitewide', discount: 0.35, weeks: 2, seasonality: 1.6 },
  ownChannel: false,
  untapped: [
    { label: 'An own channel (WhatsApp catalogue or website) to keep repeat buyers', to: '/loyalty' },
    { label: 'Saree + blouse bundles instead of flat discounts', to: '/bundles' },
    { label: 'Size-wise clearance instead of sitewide sales', to: '/plan' },
  ],
  promoShare: [0.55, 0.6, 0.58, 0.62, 0.66, 0.7, 0.82, 0.78, 0.64, 0.61, 0.63, 0.65],
  shelf: [
    'bandhani-georgette-saree-rani', 'floral-georgette-saree-teal', 'kota-doria-saree-indigo', 'navratri-chaniya-choli-free-size',
    'kalamkari-cotton-kurti-xxl', 'anarkali-kurti-m', 'bandhani-dupatta-red', 'readymade-cotton-blouse-m',
    'cotton-kurta-set-l', 'plain-chiffon-saree-black',
  ],
  affinity: {
    'Dupattas': [{ category: 'Kurtis', rate: 0.32 }, { category: 'Kurta sets', rate: 0.2 }],
    'Lehengas': [{ category: 'Dupattas', rate: 0.28 }, { category: 'Blouses', rate: 0.2 }],
    'Kurtis': [{ category: 'Dupattas', rate: 0.26 }],
    'Chiffon sarees': [{ category: 'Blouses', rate: 0.34 }],
    'Cotton sarees': [{ category: 'Blouses', rate: 0.36 }],
    'Georgette sarees': [{ category: 'Blouses', rate: 0.38 }],
    'Kurta sets': [{ category: 'Dupattas', rate: 0.22 }],
    'Blouses': [{ category: 'Georgette sarees', rate: 0.2 }],
  },
  campaigns: [
    { id: 'flash-bandhani', name: 'Flipkart flash deal: Bandhani saree ₹449', mechanic: 'Flash deal', status: 'live', channel: 'flipkart', startDay: day(0), endDay: day(2), budget: 25000, spent: 3100, segment: 'all', match: 'all', conditions: [{ kind: 'hasSku', value: 'bandhani-georgette-saree-rani' }], reward: { kind: 'pctOff', value: 0.18, target: 'sku', ref: 'bandhani-georgette-saree-rani' }, totalRedemptions: 300, redeemed: 31, stacking: 'exclusive', priority: 1, funding: 'seller', dailyRedemptions: 95, note: 'Limited units; deal fee charged per day.' },
    { id: 'co-wedding', name: 'Wedding sale: 10% off, half funded by Flipkart', mechanic: 'Co-funded offer', status: 'scheduled', channel: 'flipkart', startDay: day(18), endDay: day(25), budget: 60000, spent: 0, segment: 'all', match: 'all', conditions: [{ kind: 'cartMin', value: 599 }], reward: { kind: 'pctOff', value: 0.1, target: 'cart' }, maxDiscount: 150, redeemed: 0, stacking: 'stackable', priority: 2, funding: 'co-funded', partnerShare: 0.5, dailyRedemptions: 120 },
    { id: 'saree-blouse', name: 'Saree + matching blouse for ₹749', mechanic: 'Bundle', status: 'draft', channel: 'meesho', startDay: day(2), endDay: day(30), budget: 20000, spent: 0, segment: 'all', match: 'all', conditions: [{ kind: 'hasSku', value: 'bandhani-georgette-saree-rani' }, { kind: 'hasSku', value: 'readymade-cotton-blouse-m' }], reward: { kind: 'bundlePrice', skus: ['bandhani-georgette-saree-rani', 'readymade-cotton-blouse-m'], price: 749 }, redeemed: 0, stacking: 'stackable', priority: 3, funding: 'seller', dailyRedemptions: 30 },
    { id: 'buy2', name: 'Buy any 2 dupattas, get 1 free', mechanic: 'Buy X get Y', status: 'live', channel: 'all', startDay: day(-5), endDay: day(20), budget: 30000, spent: 8800, segment: 'all', match: 'all', conditions: [{ kind: 'qtyMin', value: 3, category: 'Dupattas' }], reward: { kind: 'bxgy', buy: 2, get: 1, getPct: 1, ref: 'Dupattas', refKind: 'category' }, redeemed: 74, stacking: 'stackable', priority: 4, funding: 'seller', dailyRedemptions: 14 },
    { id: 'sitewide', name: 'Sitewide 30% off (habit)', mechanic: 'Percentage off', status: 'live', channel: 'meesho', startDay: day(-20), endDay: day(10), budget: 150000, spent: 118000, segment: 'all', match: 'all', conditions: [], reward: { kind: 'pctOff', value: 0.3, target: 'cart' }, redeemed: 2100, stacking: 'stackable', priority: 5, funding: 'seller', dailyRedemptions: 110, note: 'The habit Tarazu wants to break: 30% off everything, every week.' },
  ],
  shippingFee: 0,
  courierCost: 0,
  avgOrder: 520,
}
