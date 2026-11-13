/* Edge cases a promotion builder must survive. Each has a rule; the starred ones run here as
   small, pure scenarios that compare "without the rule" against "with Tarazu's rule". */
import { normaliseCode, orderQualifies } from './launch'

export interface EdgeCase { id: string; group: string; title: string; example: string; rule: string; demo?: string }

export const GROUPS = ['Eligibility and identity', 'Conditions and cart', 'Rewards and pricing', 'Stacking and priority', 'Codes', 'Budget, limits and timing', 'Payments', 'Returns and refunds', 'Channels', 'Shopper protection'] as const

export const CASES: EdgeCase[] = [
  { id: 'guest-new', group: GROUPS[0], title: 'Guest checkout on a "new customer" offer', example: 'Same phone, new email', rule: '"New" is decided by phone + address + payment fingerprint, not email alone', demo: 'identity' },
  { id: 'segment-change', group: GROUPS[0], title: 'Customer changes segment mid-session', example: 'Joins the loyalty club with the cart open', rule: 'Segment is re-checked at checkout, not at add-to-cart' },
  { id: 'household', group: GROUPS[0], title: 'Many accounts, one household', example: 'Five first-order codes to one address', rule: 'Per-customer limits also count per address and device' },
  { id: 'b2b', group: GROUPS[0], title: 'Reseller on a consumer offer', example: '40 units at a 1-per-customer price', rule: 'Quantity cap per product; carts with a business GSTIN can be excluded' },
  { id: 'empty-segment', group: GROUPS[0], title: 'Audience of zero', example: '"Lapsed members in Indore"', rule: 'Pre-flight blocks an empty audience' },
  { id: 'free-threshold', group: GROUPS[1], title: 'Threshold met only because of the free item', example: 'A free gift pushes the cart over ₹999', rule: 'Thresholds count paid items only, after other discounts', demo: 'threshold' },
  { id: 'remove-after', group: GROUPS[1], title: 'Cart drops below the threshold after a removal', example: 'Item removed after the code applied', rule: 'Re-evaluate on every cart change; remove the reward with a message' },
  { id: 'double-count', group: GROUPS[1], title: 'One unit counted twice', example: 'A serum meets "buy a serum" and "buy 2 skincare"', rule: 'A unit satisfies one condition per offer, in a documented order' },
  { id: 'bogo-variants', group: GROUPS[1], title: 'Mixed variants on buy-one-get-one', example: 'Buy the 50 ml, get the 30 ml', rule: 'The cheapest qualifying unit is the free one' },
  { id: 'bundle-oos', group: GROUPS[1], title: 'Bundle with a part out of stock', example: 'Saree in stock, matching blouse not', rule: 'Bundle hidden; never sold half-priced' },
  { id: 'price-raise', group: GROUPS[1], title: 'Price raised just before the sale', example: 'Base price up the day before', rule: 'Discount on the order-time price; a raise within 30 days is flagged' },
  { id: 'below-cost', group: GROUPS[2], title: 'Discount below cost', example: '60% off a 32% margin product', rule: 'Margin floor blocks unless marked a loss leader with a reason', demo: 'floor' },
  { id: 'above-mrp', group: GROUPS[2], title: 'Bundle priced above MRP', example: 'Bundle costs more than the items', rule: 'Never above MRP; pre-flight blocks' },
  { id: 'rounding', group: GROUPS[2], title: 'Rounding', example: '15% of ₹449 = ₹67.35', rule: 'Round per line; totals reconcile to the paisa' },
  { id: 'free-cost', group: GROUPS[2], title: '"Free" item has a cost', example: 'Free lip balm still costs ₹55', rule: 'Free items are costed on the Scale; tax treatment flagged' },
  { id: 'cap-small', group: GROUPS[2], title: 'Percentage on a tiny cart', example: '50% with a ₹500 cap on ₹200', rule: 'Cap and percentage both shown; the lower wins' },
  { id: 'tier-edge', group: GROUPS[2], title: 'Tier boundaries', example: 'Cart exactly ₹1,999', rule: 'Inclusive at the lower bound; tested at, under and over' },
  { id: 'two-exclusive', group: GROUPS[3], title: 'Two exclusive offers both qualify', example: 'Influencer code and win-back', rule: 'Best for the customer by default, or priority if the seller says so; explicit either way', demo: 'exclusive' },
  { id: 'stack-floor', group: GROUPS[3], title: 'Stacked total breaks the floor', example: 'Code + tier + bank offer = 41%', rule: 'A per-order maximum caps the stack', demo: 'stack' },
  { id: 'order-apply', group: GROUPS[3], title: 'Order of application', example: 'Percent then flat, or flat then percent', rule: 'Item-level, then cart-level, then payment-level; shown on the receipt' },
  { id: 'always-on', group: GROUPS[3], title: '"Always" offer meets a new exclusive', example: 'Bank offer + exclusive flash deal', rule: '"Always" stacks by definition; flagged if it breaks the floor' },
  { id: 'leak', group: GROUPS[4], title: 'Code leaked to a coupon site', example: 'GLOW15 used by 400 non-followers', rule: 'Spike detector pauses or caps; one-click fix', demo: 'spike' },
  { id: 'case', group: GROUPS[4], title: 'Case and spaces', example: '"glow15 ", "GLOW 15"', rule: 'Codes are trimmed and case-insensitive; look-alike codes can\'t be created', demo: 'normalise' },
  { id: 'collision', group: GROUPS[4], title: 'Bulk code collisions', example: '10,000 codes with prefix TZ', rule: 'Random, non-sequential, collision-checked, no 0/O or 1/I' },
  { id: 'cancel-release', group: GROUPS[4], title: 'Single-use code on a cancelled order', example: 'Cancelled before dispatch', rule: 'The code is released back' },
  { id: 'expired', group: GROUPS[4], title: 'Expired code entered', example: 'Ended yesterday', rule: 'Clear message, plus the next best live offer' },
  { id: 'budget-race', group: GROUPS[5], title: 'Budget runs out mid-checkout', example: '3 carts open, ₹500 left', rule: 'Budget reserved at checkout start for 10 minutes; released if abandoned', demo: 'reserve' },
  { id: 'flash-stock', group: GROUPS[5], title: 'Concurrency on a flash deal', example: '300 units, 2,000 buyers in a minute', rule: 'Stock reserved per cart; first payment wins' },
  { id: 'midnight', group: GROUPS[5], title: 'Ordered at 23:59, paid at 00:02', example: 'Offer ended at midnight', rule: 'Order time decides; a grace window covers slow payments', demo: 'midnight' },
  { id: 'timezone', group: GROUPS[5], title: 'Time zone', example: 'Seller sets 9 pm while travelling', rule: 'All schedules in IST, shown with the zone' },
  { id: 'edit-live', group: GROUPS[5], title: 'Editing a live campaign', example: 'Discount lowered mid-sale', rule: 'New version from now; open carts keep old terms; logged' },
  { id: 'delisted', group: GROUPS[5], title: 'Product delisted mid-campaign', example: 'SKU removed', rule: 'Campaign stays valid for the rest; warning on the board' },
  { id: 'bank-fail', group: GROUPS[6], title: 'Bank offer fails at payment', example: 'Card not eligible after all', rule: 'Total recalculates before the final pay button' },
  { id: 'split-pay', group: GROUPS[6], title: 'Split payment', example: 'Wallet + card on a card-only offer', rule: 'Applies only if the qualifying method pays at least the threshold' },
  { id: 'cod', group: GROUPS[6], title: 'Cash on delivery', example: 'Prepaid-only offer, COD chosen', rule: 'Offer removed with a message; a prepaid nudge instead' },
  { id: 'emi', group: GROUPS[6], title: 'No-cost EMI', example: 'Interest paid by the seller', rule: 'Costed as a seller-funded discount on the Scale' },
  { id: 'bogo-return', group: GROUPS[7], title: 'Return one item of a buy-one-get-one', example: 'Kept the free one, returned the paid one', rule: 'Refund = paid price − value of the free item kept', demo: 'bogo' },
  { id: 'tier-return', group: GROUPS[7], title: 'Return drops the cart below the tier', example: '₹300 off a ₹1,999 cart; one item back', rule: 'Tier discount recalculated; refund reduced, stated in the policy up front' },
  { id: 'points-return', group: GROUPS[7], title: 'Points on a returned order', example: '200 points earned, order returned', rule: 'Points pending until the return window closes' },
  { id: 'exchange', group: GROUPS[7], title: 'Exchange instead of return', example: 'Size swap on a discounted kurta', rule: 'Keeps the original promotion price' },
  { id: 'referral-return', group: GROUPS[7], title: 'Referral reward, friend returns', example: 'First order refunded', rule: 'Reward released after the return window' },
  { id: 'channel-cant', group: GROUPS[8], title: 'A channel can\'t express the rule', example: 'Tiered spend on Meesho', rule: 'Format mapping says so and suggests the nearest format' },
  { id: 'parity', group: GROUPS[8], title: 'Different prices per channel', example: 'Own site cheaper than Amazon', rule: 'Price-parity warning; the seller decides' },
  { id: 'cofund', group: GROUPS[8], title: 'Marketplace co-funding withdrawn', example: 'Platform share drops to zero', rule: 'Re-run the Scale and show the new net impact' },
  { id: 'shared-stock', group: GROUPS[8], title: 'One stock, three channels', example: 'A flash deal empties shared stock', rule: 'Stock reserved per channel for the window' },
  { id: 'fake-urgency', group: GROUPS[9], title: 'Fake urgency', example: 'A countdown that resets on reload', rule: 'Countdowns are real end times only; false urgency is a listed dark pattern (CCPA 2023)', demo: 'urgency' },
  { id: 'drip', group: GROUPS[9], title: 'Drip pricing', example: 'Fee added only at checkout', rule: 'Mandatory charges shown on the product page and cart' },
  { id: 'reference', group: GROUPS[9], title: 'Inflated "was" price', example: '"Was ₹1,999", never charged', rule: 'Reference price is the actual recent selling price' },
  { id: 'colour-only', group: GROUPS[9], title: 'Offer shown by colour only', example: 'A red badge with no text', rule: 'Offer text is always written' },
]

export interface DemoResult { without: string; with: string; detail: string; tone: 'gain' | 'loss' }

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

export const DEMOS: Record<string, { inputs: { key: string; label: string; min: number; max: number; step: number; value: number; unit?: string }[]; run: (v: Record<string, number>) => DemoResult }> = {
  identity: {
    inputs: [{ key: 'orders', label: 'Past orders on this phone number', min: 0, max: 5, step: 1, value: 2 }],
    run: ({ orders }) => ({
      without: orders > 0 ? 'Gets the new-customer discount (new email)' : 'Gets the new-customer discount',
      with: orders > 0 ? `Not new: ${orders} past order${orders > 1 ? 's' : ''} on this phone` : 'Genuinely new: discount applies',
      detail: 'Identity = phone + delivery address + payment fingerprint. Email alone is free to create.',
      tone: orders > 0 ? 'gain' : 'gain',
    }),
  },
  threshold: {
    inputs: [{ key: 'paid', label: 'Paid items in cart (₹)', min: 600, max: 1200, step: 50, value: 900 }, { key: 'gift', label: 'Free gift value (₹)', min: 50, max: 300, step: 25, value: 150 }],
    run: ({ paid, gift }) => {
      const naive = paid + gift >= 999, right = paid >= 999
      return { without: naive ? `₹${paid + gift} counts as over ₹999: discount applies` : 'Below ₹999', with: right ? 'Paid items reach ₹999: discount applies' : `Paid items are ₹${paid}: ₹${999 - paid} short, discount withheld`, detail: 'Free items never count toward a spend threshold.', tone: naive && !right ? 'gain' : 'gain' }
    },
  },
  floor: {
    inputs: [{ key: 'depth', label: 'Discount', min: 0.1, max: 0.7, step: 0.05, value: 0.6, unit: '%' }, { key: 'margin', label: 'Product gross margin', min: 0.2, max: 0.7, step: 0.01, value: 0.32, unit: '%' }],
    run: ({ depth, margin }) => {
      const price = 1000, cost = price * (1 - margin), sell = price * (1 - depth), m = (sell - cost) / sell
      return { without: `Sells at ${inr(sell)}, cost ${inr(cost)}: ${m < 0 ? `loses ${inr(cost - sell)} a unit` : `${Math.round(m * 100)}% margin`}`, with: m < 0.2 ? `Blocked: margin ${Math.round(m * 100)}% is under the 20% floor (unless marked a loss leader)` : 'Allowed: above the floor', detail: 'Margin floor applies to the price after discount and fees.', tone: m < 0.2 ? 'gain' : 'gain' }
    },
  },
  exclusive: {
    inputs: [{ key: 'a', label: 'Influencer code value (₹)', min: 50, max: 400, step: 10, value: 150 }, { key: 'b', label: 'Win-back offer value (₹)', min: 50, max: 400, step: 10, value: 250 }],
    run: ({ a, b }) => ({ without: `Both apply: ${inr(a + b)} off (exclusive ignored)`, with: `Best for the customer: ${inr(Math.max(a, b))} off (${a >= b ? 'influencer code' : 'win-back'}); by priority instead: ${inr(a)}`, detail: 'Exclusive means exactly one applies. Which one is a seller setting, shown on the receipt.', tone: 'gain' }),
  },
  stack: {
    inputs: [{ key: 'code', label: 'Code', min: 0.05, max: 0.25, step: 0.01, value: 0.15, unit: '%' }, { key: 'tier', label: 'Spend tier', min: 0, max: 0.2, step: 0.01, value: 0.12, unit: '%' }, { key: 'bank', label: 'Bank offer', min: 0, max: 0.2, step: 0.01, value: 0.14, unit: '%' }],
    run: ({ code, tier, bank }) => {
      const total = 1 - (1 - code) * (1 - tier) * (1 - bank), cap = 0.3
      return { without: `${Math.round(total * 100)}% off a ₹2,000 cart = ${inr(2000 * total)}`, with: total > cap ? `Capped at ${Math.round(cap * 100)}%: ${inr(2000 * cap)} (saves ${inr(2000 * (total - cap))})` : `${Math.round(total * 100)}%: under the 30% cap`, detail: 'Discounts compound in order (item, cart, payment); the per-order maximum caps the total.', tone: 'gain' }
    },
  },
  spike: {
    inputs: [{ key: 'rate', label: 'Uses in the last hour', min: 2, max: 120, step: 2, value: 48 }, { key: 'plan', label: 'Planned uses per hour', min: 1, max: 20, step: 1, value: 6 }],
    run: ({ rate, plan }) => ({ without: `${rate} uses an hour keep going: about ${inr(rate * 24 * 150)} a day at ₹150 each`, with: rate > plan * 3 ? `Paused at ${Math.round(rate / plan)}× plan; owner alerted with a one-click fix` : 'Within 3× plan: keeps running', detail: 'Spike = uses per hour above 3× the plan. Tightening the rule is always allowed automatically.', tone: 'gain' }),
  },
  normalise: {
    inputs: [{ key: 'variant', label: 'What the shopper typed (1–4)', min: 1, max: 4, step: 1, value: 2 }],
    run: ({ variant }) => {
      const typed = ['GLOW15', 'glow15 ', 'Glow 15', ' gLoW15'][variant - 1]
      return { without: typed === 'GLOW15' ? 'Accepted' : `"${typed}" rejected: "invalid code"`, with: `"${typed}" → ${normaliseCode(typed)}: accepted`, detail: 'Trim spaces, ignore case. Look-alike codes (GLOW15 vs GL0W15) can\'t be created.', tone: 'gain' }
    },
  },
  reserve: {
    inputs: [{ key: 'left', label: 'Budget left (₹)', min: 100, max: 1000, step: 50, value: 500 }, { key: 'carts', label: 'Carts at checkout (₹200 discount each)', min: 1, max: 6, step: 1, value: 3 }],
    run: ({ left, carts }) => {
      const fit = Math.floor(left / 200), over = Math.max(0, carts - fit)
      return { without: over ? `All ${carts} carts get it: overspend ${inr(over * 200 - (left % 200))}` : 'All fit', with: over ? `${fit} reserved at checkout start; ${over} told before paying` : `All ${carts} reserved`, detail: 'Reserve at checkout start, hold 10 minutes, release if abandoned.', tone: 'gain' }
    },
  },
  midnight: {
    inputs: [{ key: 'ordered', label: 'Ordered (minutes before midnight)', min: -10, max: 10, step: 1, value: 1 }, { key: 'paid', label: 'Paid (minutes after midnight)', min: 0, max: 30, step: 1, value: 2 }],
    run: ({ ordered, paid }) => {
      const q = orderQualifies(-ordered, paid, 0, 15)
      return { without: q.byPayment ? 'Gets the price' : 'Loses the price (paid after the end)', with: q.withGrace ? 'Gets the price: ordered in time, paid within the 15-minute grace' : q.byOrder ? 'Ordered in time but paid after the grace window' : 'Ordered after the end', detail: 'Order time decides; a grace window covers slow payments.', tone: 'gain' }
    },
  },
  bogo: {
    inputs: [{ key: 'paid', label: 'Paid item (₹)', min: 299, max: 999, step: 50, value: 699 }, { key: 'free', label: 'Free item kept (₹)', min: 99, max: 699, step: 50, value: 399 }],
    run: ({ paid, free }) => ({ without: `Refund ${inr(paid)}, and the customer keeps a ${inr(free)} item for nothing`, with: `Refund ${inr(Math.max(0, paid - free))} (paid ${inr(paid)} − free item kept ${inr(free)}), or return both for ${inr(paid)}`, detail: 'The free item was only free because of the paid one. The policy says so before purchase.', tone: 'gain' }),
  },
  urgency: {
    inputs: [{ key: 'days', label: 'Offer runs for (days)', min: 1, max: 30, step: 1, value: 14 }],
    run: ({ days }) => ({ without: days > 7 ? 'Countdown "Ends in 23:59:59" that restarts daily' : 'Countdown to the real end', with: days > 7 ? 'No countdown: shows "Ends 28 Nov" instead' : `Countdown allowed: real end in ${days} day${days > 1 ? 's' : ''}`, detail: 'Countdowns must count to the real end.', tone: 'gain' }),
  },
}
