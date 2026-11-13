/* R5 · The Reach: scripted creator, affiliate and referral data for the four demo sellers.
   Every person and handle here is invented. Numbers are illustrative but internally consistent. */
import type { SellerId } from './sellers/types'

export type Platform = 'Instagram' | 'YouTube' | 'WhatsApp' | 'ShareChat'
export type Tier = 'nano' | 'micro' | 'macro' | 'celebrity'

export interface Creator {
  id: string
  name: string
  handle: string
  platform: Platform
  tier: Tier
  followers: number
  /** Engaged share of followers per post. */
  engagement: number
  /** How closely the audience matches the seller's buyers (0–1). */
  match: number
  /** Estimated share of fake or inactive followers. */
  fakeRisk: number
  /** Share of a past code's uses that came from outside the creator's audience. */
  leakHistory: number
  /** Typical flat fee for one post, ₹. */
  rate: number
  niche: string
  language: string
  /** Days left on the right to reuse their content in ads (0 = none). */
  rightsDays: number
}

export interface Affiliate { id: string; name: string; kind: 'Content site' | 'Coupon site' | 'Cashback app' | 'Deal channel'; ordersPerWeek: number; firstTouch: number; selfReferral: number; blocked?: boolean }

/** One customer journey: the touchpoints before an order, in order. */
export interface Journey { id: string; order: number; touches: string[] }

export interface ReferralEvent { id: string; referrer: string; friend: string; signals: ('same-device' | 'same-address' | 'same-payment' | 'velocity')[]; value: number; daysAgo: number }

export interface ReachData {
  adsCac: number
  creators: Creator[]
  affiliates: Affiliate[]
  journeys: Journey[]
  referrals: ReferralEvent[]
  community: number
  resellers?: { count: number; ordersPerWeek: number; avgMargin: number }
}

const C = (id: string, name: string, handle: string, platform: Platform, tier: Tier, followers: number, engagement: number, match: number, fakeRisk: number, leakHistory: number, rate: number, niche: string, language: string, rightsDays = 0): Creator =>
  ({ id, name, handle, platform, tier, followers, engagement, match, fakeRisk, leakHistory, rate, niche, language, rightsDays })

export const REACH: Record<SellerId, ReachData> = {
  meera: {
    adsCac: 460,
    community: 2400,
    creators: [
      C('m1', 'Ishita Rao', '@ishita.glowdiary', 'Instagram', 'micro', 42000, 0.061, 0.86, 0.06, 0.08, 9000, 'Ayurvedic skincare routines', 'Hindi + English', 45),
      C('m2', 'Pooja Bhandari', '@desiskinlab', 'Instagram', 'micro', 68000, 0.048, 0.81, 0.09, 0.12, 14000, 'Ingredient explainers', 'English', 0),
      C('m3', 'Sana Qureshi', '@sana.beautynotes', 'YouTube', 'micro', 31000, 0.072, 0.78, 0.04, 0.05, 12000, 'Honest reviews', 'Hinglish', 90),
      C('m4', 'Riddhi Parmar', '@riddhi.everyday', 'Instagram', 'nano', 8600, 0.094, 0.9, 0.03, 0.02, 2500, 'Jaipur lifestyle', 'Hindi', 30),
      C('m5', 'Kavya Menon', '@kavya.skin', 'Instagram', 'nano', 12400, 0.083, 0.74, 0.05, 0.04, 3500, 'Minimal skincare', 'English', 0),
      C('m6', 'Aditi Kapoor', '@aditikapoorofficial', 'Instagram', 'celebrity', 1850000, 0.012, 0.42, 0.21, 0.31, 120000, 'Film and fashion', 'Hindi + English', 0),
      C('m7', 'Neha Gill', '@neha.bridalglow', 'Instagram', 'macro', 410000, 0.022, 0.58, 0.14, 0.22, 55000, 'Bridal beauty', 'Hinglish', 0),
      C('m8', 'Tanvi Shah', '@tanvi.morningritual', 'YouTube', 'nano', 6900, 0.11, 0.88, 0.02, 0.01, 2000, 'Wellness rituals', 'Gujarati + Hindi', 60),
    ],
    affiliates: [
      { id: 'ma1', name: 'Glow Guide (blog)', kind: 'Content site', ordersPerWeek: 18, firstTouch: 0.62, selfReferral: 0.02 },
      { id: 'ma2', name: 'CouponKatta', kind: 'Coupon site', ordersPerWeek: 46, firstTouch: 0.06, selfReferral: 0.04 },
      { id: 'ma3', name: 'PaisaWapas', kind: 'Cashback app', ordersPerWeek: 31, firstTouch: 0.1, selfReferral: 0.18 },
      { id: 'ma4', name: 'Beauty Deals Daily (Telegram)', kind: 'Deal channel', ordersPerWeek: 22, firstTouch: 0.28, selfReferral: 0.05 },
    ],
    journeys: [
      { id: 'j1', order: 1180, touches: ['Creator: @ishita.glowdiary', 'Glow Guide (blog)', 'CouponKatta'] },
      { id: 'j2', order: 940, touches: ['Creator: @sana.beautynotes', 'CouponKatta'] },
      { id: 'j3', order: 1460, touches: ['Glow Guide (blog)', 'PaisaWapas'] },
      { id: 'j4', order: 720, touches: ['CouponKatta'] },
      { id: 'j5', order: 1320, touches: ['Creator: @riddhi.everyday', 'Beauty Deals Daily (Telegram)', 'PaisaWapas'] },
      { id: 'j6', order: 860, touches: ['Beauty Deals Daily (Telegram)'] },
    ],
    referrals: [
      { id: 'r1', referrer: 'Anjali S.', friend: 'Megha T.', signals: [], value: 1240, daysAgo: 2 },
      { id: 'r2', referrer: 'Rohit K.', friend: 'Rohit Kumar', signals: ['same-device', 'same-payment'], value: 980, daysAgo: 1 },
      { id: 'r3', referrer: 'Priya M.', friend: 'Swati P.', signals: [], value: 1520, daysAgo: 5 },
      { id: 'r4', referrer: 'Deepak V.', friend: '6 new accounts in 2 hours', signals: ['velocity', 'same-address'], value: 4300, daysAgo: 0 },
      { id: 'r5', referrer: 'Lata J.', friend: 'Nisha J.', signals: ['same-address'], value: 1090, daysAgo: 3 },
    ],
  },
  farhan: {
    adsCac: 230,
    community: 5800,
    resellers: { count: 340, ordersPerWeek: 410, avgMargin: 0.18 },
    creators: [
      C('f1', 'Hetal Desai', '@hetal.drapes', 'Instagram', 'micro', 57000, 0.058, 0.84, 0.07, 0.09, 8000, 'Saree draping reels', 'Gujarati + Hindi', 60),
      C('f2', 'Zoya Ansari', '@zoya.weddingdiaries', 'Instagram', 'macro', 380000, 0.026, 0.71, 0.12, 0.18, 42000, 'Wedding styling', 'Hinglish', 0),
      C('f3', 'Bhavna Solanki', '@bhavna.garba', 'Instagram', 'micro', 24000, 0.081, 0.88, 0.05, 0.04, 5000, 'Navratri looks', 'Gujarati', 30),
      C('f4', 'Rekha Patil', '@rekha.ghar.se', 'ShareChat', 'micro', 96000, 0.044, 0.77, 0.1, 0.06, 6000, 'Home-maker fashion', 'Marathi + Hindi', 0),
      C('f5', 'Simran Kaur', '@simran.ethnicedit', 'YouTube', 'micro', 48000, 0.052, 0.69, 0.08, 0.1, 10000, 'Ethnic haul videos', 'Punjabi + Hindi', 0),
      C('f6', 'Mehak Sharma', '@mehaksharma', 'Instagram', 'celebrity', 2400000, 0.01, 0.36, 0.24, 0.35, 150000, 'TV actor', 'Hindi', 0),
      C('f7', 'Nidhi Joshi', '@nidhi.budgetstyle', 'Instagram', 'nano', 9800, 0.1, 0.86, 0.03, 0.02, 1800, 'Under ₹999 fashion', 'Hindi', 45),
    ],
    affiliates: [
      { id: 'fa1', name: 'Saree Stories (blog)', kind: 'Content site', ordersPerWeek: 12, firstTouch: 0.58, selfReferral: 0.02 },
      { id: 'fa2', name: 'DealDhamaka', kind: 'Coupon site', ordersPerWeek: 64, firstTouch: 0.05, selfReferral: 0.05 },
      { id: 'fa3', name: 'Loot Alerts (Telegram)', kind: 'Deal channel', ordersPerWeek: 38, firstTouch: 0.3, selfReferral: 0.06 },
    ],
    journeys: [
      { id: 'j1', order: 1299, touches: ['Creator: @hetal.drapes', 'DealDhamaka'] },
      { id: 'j2', order: 899, touches: ['Loot Alerts (Telegram)'] },
      { id: 'j3', order: 1599, touches: ['Creator: @bhavna.garba', 'Saree Stories (blog)', 'DealDhamaka'] },
      { id: 'j4', order: 699, touches: ['DealDhamaka'] },
      { id: 'j5', order: 1099, touches: ['Saree Stories (blog)', 'Loot Alerts (Telegram)'] },
    ],
    referrals: [
      { id: 'r1', referrer: 'Kiran P.', friend: 'Hema P.', signals: ['same-address'], value: 1299, daysAgo: 1 },
      { id: 'r2', referrer: 'Reseller #118', friend: '11 accounts, 1 phone', signals: ['same-device', 'velocity'], value: 9800, daysAgo: 0 },
      { id: 'r3', referrer: 'Manju R.', friend: 'Sunita G.', signals: [], value: 899, daysAgo: 4 },
    ],
  },
  kabir: {
    adsCac: 390,
    community: 3100,
    creators: [
      C('k1', 'Arjun Mehta', '@arjuntechbytes', 'YouTube', 'micro', 88000, 0.054, 0.87, 0.05, 0.11, 18000, 'Charger and cable tests', 'Hinglish', 90),
      C('k2', 'Vikram Rawat', '@unboxwithvikram', 'YouTube', 'macro', 620000, 0.031, 0.74, 0.11, 0.2, 75000, 'Unboxings', 'Hindi', 0),
      C('k3', 'Rahul Nair', '@gadgetnair', 'Instagram', 'micro', 34000, 0.067, 0.79, 0.06, 0.07, 7000, 'Budget gadgets', 'English', 30),
      C('k4', 'Imran Shaikh', '@techwithimran', 'YouTube', 'micro', 51000, 0.058, 0.83, 0.04, 0.06, 11000, 'Honest tech reviews', 'Hindi', 60),
      C('k5', 'Dev Malhotra', '@devplays', 'YouTube', 'macro', 1100000, 0.019, 0.38, 0.17, 0.26, 95000, 'Gaming', 'Hinglish', 0),
      C('k6', 'Karan Bedi', '@karan.desksetup', 'Instagram', 'nano', 11200, 0.092, 0.91, 0.03, 0.02, 3000, 'Desk setups', 'English', 45),
    ],
    affiliates: [
      { id: 'ka1', name: 'ChargeGuide (review site)', kind: 'Content site', ordersPerWeek: 26, firstTouch: 0.66, selfReferral: 0.02 },
      { id: 'ka2', name: 'CouponKatta', kind: 'Coupon site', ordersPerWeek: 52, firstTouch: 0.05, selfReferral: 0.04 },
      { id: 'ka3', name: 'PaisaWapas', kind: 'Cashback app', ordersPerWeek: 40, firstTouch: 0.08, selfReferral: 0.22 },
      { id: 'ka4', name: 'TechLoot (Telegram)', kind: 'Deal channel', ordersPerWeek: 35, firstTouch: 0.24, selfReferral: 0.04 },
    ],
    journeys: [
      { id: 'j1', order: 2149, touches: ['Creator: @arjuntechbytes', 'ChargeGuide (review site)', 'PaisaWapas'] },
      { id: 'j2', order: 1799, touches: ['ChargeGuide (review site)', 'CouponKatta'] },
      { id: 'j3', order: 1299, touches: ['TechLoot (Telegram)'] },
      { id: 'j4', order: 2499, touches: ['Creator: @techwithimran', 'CouponKatta'] },
      { id: 'j5', order: 899, touches: ['CouponKatta'] },
    ],
    referrals: [
      { id: 'r1', referrer: 'Sahil T.', friend: 'Aman T.', signals: ['same-address'], value: 2149, daysAgo: 2 },
      { id: 'r2', referrer: 'Nikhil B.', friend: 'Varun S.', signals: [], value: 1799, daysAgo: 1 },
      { id: 'r3', referrer: 'Rohan D.', friend: 'rohan.d.alt', signals: ['same-device', 'same-payment'], value: 2499, daysAgo: 0 },
    ],
  },
  anaya: {
    adsCac: 150,
    community: 0,
    creators: [
      C('a1', 'Shreya Agrawal', '@shreya.cooksindore', 'Instagram', 'micro', 64000, 0.063, 0.82, 0.05, 0.05, 9000, 'Indori recipes', 'Hindi', 60),
      C('a2', 'Mohit Jain', '@chai.with.mohit', 'YouTube', 'micro', 41000, 0.071, 0.78, 0.04, 0.04, 8000, 'Chai and snack pairings', 'Hindi', 30),
      C('a3', 'Ritu Saxena', '@officesnackhacks', 'Instagram', 'nano', 9400, 0.098, 0.85, 0.03, 0.02, 2200, 'Office snacks', 'Hinglish', 30),
      C('a4', 'Chef Anand', '@chefanandeats', 'YouTube', 'macro', 720000, 0.024, 0.55, 0.12, 0.15, 80000, 'Food shows', 'Hindi', 0),
      C('a5', 'Priyanka Dubey', '@priyanka.tiffin', 'Instagram', 'micro', 27000, 0.076, 0.8, 0.06, 0.03, 5000, 'Tiffin and snack ideas', 'Hindi', 0),
    ],
    affiliates: [
      { id: 'aa1', name: 'Snack Reviews India', kind: 'Content site', ordersPerWeek: 9, firstTouch: 0.6, selfReferral: 0.02 },
      { id: 'aa2', name: 'Quick Deals (Telegram)', kind: 'Deal channel', ordersPerWeek: 28, firstTouch: 0.22, selfReferral: 0.05 },
    ],
    journeys: [
      { id: 'j1', order: 398, touches: ['Creator: @shreya.cooksindore', 'Quick Deals (Telegram)'] },
      { id: 'j2', order: 299, touches: ['Quick Deals (Telegram)'] },
      { id: 'j3', order: 549, touches: ['Snack Reviews India', 'Quick Deals (Telegram)'] },
    ],
    referrals: [
      { id: 'r1', referrer: 'Office: Infra Corp', friend: 'Office: Nimbus Labs', signals: [], value: 2400, daysAgo: 3 },
    ],
  },
}
