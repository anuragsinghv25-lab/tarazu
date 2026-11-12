/* BA Lens — the thinking behind each element.
   Every entry traces a pixel back to a pain point, a user story, a rule and a metric. */

export interface LensNote {
  title: string
  pain: string
  story: string
  rule?: string
  kpi: string
  design?: string
  scope: 'Must' | 'Should' | 'Could'
}

export const LENS: Record<string, LensNote> = {
  'seller-switcher': {
    title: 'Seller switcher',
    pain: 'One persona cannot honestly use every promotion mechanic.',
    story: 'US-01 · As a presenter, I want to switch between four demo sellers so I can pitch to the seller in front of me.',
    kpi: 'Concept coverage across demos',
    design: 'Meera is live in Release 1; Farhan, Kabir and Anaya arrive in Release 2.',
    scope: 'Must',
  },
  'event-chip': {
    title: 'Event countdown',
    pain: 'Sellers plan sale events at the last minute and copy competitors.',
    story: 'US-02 · As a seller, I want to see how long until the next sale event so I plan promotions in time.',
    rule: 'Driven by "Days to sale event" in the Control Room.',
    kpi: 'Plans made ≥ 14 days before an event',
    scope: 'Should',
  },
  opportunity: {
    title: 'Opportunity card',
    pain: 'Sellers can see sales, but not how much money is stuck, leaked or still on the table.',
    story: 'US-03 · As a seller, I want three numbers that tell me where my money is so I know where to act first.',
    rule: 'Stuck = units that won\'t sell before expiry or season end × cost. Leaked = last festival\'s blanket-sale loss. Gain = sum of positive net impact across recommended promotions.',
    kpi: 'Inventory at risk (₹), promo ROI',
    design: 'Three numbers, not twelve KPI cards. The border beam marks it as the one place to start.',
    scope: 'Must',
  },
  actions: {
    title: 'Top actions',
    pain: 'Recommendations without reasons don\'t get trusted.',
    story: 'US-05 · As a seller, I want a ranked list of actions with a reason each so I can act in minutes.',
    rule: 'Ranked by net impact after subsidy, cannibalization, pull-forward and fees; holds are listed too.',
    kpi: 'Recommendations accepted',
    scope: 'Must',
  },
  'health-bar': {
    title: 'Stock health mix',
    pain: 'Ageing stock hides inside a 140-SKU catalogue.',
    story: 'US-06 · As a seller, I want to see at a glance how much of my catalogue is at risk.',
    rule: 'At risk: >35% of stock won\'t sell in its window, or cover exceeds weeks to expiry. Slow: any units at risk or 20+ weeks old. Fast: under 5 weeks of cover.',
    kpi: 'Share of SKUs at risk',
    scope: 'Should',
  },
  'pulse-grid': {
    title: 'Stock Pulse',
    pain: 'Spreadsheets list stock; they don\'t show danger.',
    story: 'US-07 · As a seller, I want every SKU as a tile coloured by risk so I spot stuck money in one look.',
    rule: 'Colour = health class. Tiles at risk breathe faster. Weeks of supply = stock ÷ weekly run rate.',
    kpi: 'Weeks of supply, sell-through, inventory age',
    design: 'Motion encodes urgency, so the eye goes to the riskiest tiles first.',
    scope: 'Must',
  },
  scale: {
    title: 'The Scale',
    pain: 'Sellers pick discount depth by copying competitors and never see what it costs.',
    story: 'US-04 · As a seller, I want to see profit after fees for any discount so I stop losing money on deals.',
    rule: 'Given = discount to buyers who\'d pay anyway + fees + cannibalization + pull-forward. Earned = profit on extra units + halo + write-off avoided. Tilt = earned − given.',
    kpi: 'Promo ROI, margin protected',
    design: 'A balance beam, not a table: the trade-off is felt, not read. It is also the product\'s name.',
    scope: 'Must',
  },
  'discount-slider': {
    title: 'Discount slider',
    pain: '"40% off everything" is a guess, not a decision.',
    story: 'US-04a · As a seller, I want to drag the discount and watch profit respond instantly.',
    rule: 'Units multiply by (1 − discount)^elasticity, capped by stock on hand.',
    kpi: 'Discount depth vs net profit',
    scope: 'Must',
  },
  curve: {
    title: 'Profit curve',
    pain: 'Deeper discounts feel safer but quietly destroy margin.',
    story: 'US-08 · As a seller, I want to see the sweet spot and the point where discounts start losing money.',
    rule: 'Sweet spot = highest net impact within the margin floor. Profit cliff = first deeper discount where net turns negative.',
    kpi: 'Net impact (₹) per discount level',
    scope: 'Must',
  },
  why: {
    title: '"Why this?" card',
    pain: 'Sellers don\'t act on black-box advice.',
    story: 'US-09 · As a seller, I want every recommendation explained in plain words, like an analyst\'s note.',
    rule: 'Generated from the same numbers as the Scale; no number is invented.',
    kpi: 'Recommendation trust (accept rate)',
    design: 'The AI layer in Release 3 explains; the engine decides the numbers.',
    scope: 'Must',
  },
  'truth-headline': {
    title: 'The flattering headline',
    pain: 'Sales dashboards celebrate units and revenue, so every sale looks like a win.',
    story: 'US-10 · As a seller, I want to see what my last sale really earned, not just what it sold.',
    kpi: 'Headline lift vs true incremental',
    scope: 'Must',
  },
  'truth-peel': {
    title: 'Peeling the lift',
    pain: 'Most extra sales during a promotion were never "extra".',
    story: 'US-10a · As a seller, I want promo sales split into what would have sold anyway, what was stolen from my other products, what was only pulled forward, and what was truly new.',
    rule: 'Promo units = baseline (subsidized) + cannibalized + pulled forward + true incremental.',
    kpi: 'True incremental units',
    design: 'Layers peel off one by one so the reveal is felt.',
    scope: 'Must',
  },
  'truth-money': {
    title: 'Where the money went',
    pain: 'The discount cost is invisible because it is never invoiced.',
    story: 'US-10b · As a seller, I want the sale\'s profit walked from gross gain to net, line by line.',
    rule: 'Net = lift profit + halo + write-off avoided − subsidy − cannibalization − pull-forward − fees.',
    kpi: 'Net promotional profit',
    scope: 'Must',
  },
  'compare-cards': {
    title: 'Platform compare',
    pain: 'The same deal earns very differently on each platform, and sellers can\'t see it.',
    story: 'US-11 · As a seller, I want one promotion priced on every channel with its fees so I pick where to run it.',
    rule: 'Each channel gets its own share of demand, commission, payment fee, deal fee and shipping subsidy (illustrative rates).',
    kpi: 'Net profit by channel',
    design: 'The winner gets the travelling border beam.',
    scope: 'Must',
  },
  'control-room': {
    title: 'Control Room',
    pain: 'A static demo can\'t show how decisions change when the market does.',
    story: 'US-12 · As a presenter, I want to change market conditions and watch every screen react, so the cause and effect is visible.',
    rule: 'Each control feeds the engine; widgets it affects glow; the impact log records the before/after.',
    kpi: 'Demo comprehension',
    scope: 'Must',
  },
}
