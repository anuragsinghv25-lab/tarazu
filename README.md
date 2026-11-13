# Tarazu · तराज़ू

**Weigh every discount.** A promotion-intelligence prototype for small and mid-size Indian sellers.

Tarazu (Hindi-Urdu for a balance scale) weighs what a promotion *costs* against what it truly *earns*, after
platform fees, discounts handed to buyers who would have paid full price, sales stolen from the seller's own products,
and demand that was only pulled forward. It then recommends which offers to run, on which channel, and which products
to leave at full price.

> Prototype by Anurag Singh, built to explore promotion engines as a techno-functional business analyst.
> All sellers, products and numbers are fictional; platform fees are illustrative, not official rate cards.

![Overview](docs/screenshots/overview.png)

## Release 1 · "The Scale"

Meera — a fictional Ayurvedic skincare brand in Jaipur selling on Amazon, Flipkart,
Nykaa and her own website — has 140 SKUs and three weeks until Big Billion Days.

| Screen | What it shows |
| --- | --- |
| **Overview** | The opportunity card: money stuck in risky stock, money leaked in last Diwali's blanket sale, and the projected gain from Tarazu's plan; ranked actions with a reason each. |
| **Stock Pulse** | Every SKU as a tile coloured by health; risky tiles breathe faster. Weeks of supply, ageing and expiry in an inspector. |
| **The Scale** | Drag a discount and watch a balance tilt: *given away* vs *earned*, with the profit curve, sweet spot, profit cliff and margin floor. |
| **Truth Lens** | Last Diwali's headline sales spike peeled into what would have sold anyway, what was cannibalized, what was pulled forward and what was truly new — then the money walk to a net loss. |
| **Platform compare** | The same deal priced on Amazon, Flipkart, Nykaa and the own website with each channel's share, commission, deal fee and shipping. |

Two prototype layers sit on top of every screen:

- **Control Room** (`C`) — scenario presets (Big Billion Days, monsoon slump, competitor price war, overstock crisis) and
  10 controls. Widgets a control affects glow when it changes, and an impact log records what it did to the plan.
- **BA Lens** (`B`) — switches on hand-drawn annotations. Hover any marked element to see the pain point, user story,
  business rule, KPI, design decision and MoSCoW scope behind it, plus which controls change it.

`⌘K` opens a command palette to jump to any screen, product or scenario.

| The Scale | BA Lens |
| --- | --- |
| ![The Scale](docs/screenshots/the-scale.png) | ![BA Lens](docs/screenshots/ba-lens.png) |
| **Truth Lens** | **Control Room** |
| ![Truth Lens](docs/screenshots/truth-lens.png) | ![Control Room](docs/screenshots/control-room.png) |

## Release 2 · "The Market"

Four demo sellers, each chosen to own a slice of the promotion vocabulary. Switch between them from the top bar,
take the 4-question quiz ("Which seller are you?"), or open a link with `?seller=farhan`.

| Seller | Business | What their story demonstrates |
| --- | --- | --- |
| **Meera** · Saanjh Botanicals, Jaipur | Ayurvedic skincare on Amazon, Flipkart, Nykaa, own site | Expiry-driven clearance, coupons, a leaked code, points and referrals |
| **Farhan** · Rangreza Weaves, Surat | Ethnic wear on Meesho, Flipkart, Amazon | Hi-Lo habit, promo fatigue, seasonal markdown ladders, bundles; why loyalty isn't for him |
| **Kabir** · VoltLane, Delhi | Phone accessories, launching a new charger | Bank offers, no-cost EMI, stacking, an old model to clear, win-back |
| **Anaya** · Malwa Bites, Indore | Snacks and chai through distributors and retailers | Brand mode: trade spend, gross-to-net, forward buying, deductions |

| Screen | What it shows |
| --- | --- |
| **Campaign builder** | Rules as blocks read top to bottom: WHO (segment) → IF (cart, product, payment) → THEN (percent, flat, BOGO, gift, bundle, tiered, points) → LIMITS (caps, budget) → STACK (exclusive, stackable, always, priority). A plain-English sentence, budget burn-down and a conflict check. |
| **Cart Sandbox** | Drag products into a cart and watch every campaign pass or fail each gate. Leaks are flagged with a one-click fix; the receipt shows who funds each line. |
| **Season plan** | Campaigns on the sale-event calendar, a week-by-week clearance ladder, and a Hi-Lo vs everyday-low-price duel. |
| **Bundles** | Slow movers matched to bestsellers the same buyers already pick up, priced so the bundle clears stock without giving away the bestseller's margin. Turn any bundle into a campaign. |
| **Loyalty** | Programme economics and points liability, win-back offers, referral fraud checks; a reasoned "not for you" for sellers it wouldn't pay for. |
| **Brand mode** | Gross-to-net waterfall, every trade deal scored by ROI, a trade-promotion-optimisation slider, sell-in vs sell-out, and a deductions ledger with disputes. |
| **Demo sellers** | The four sellers side by side, plus a coverage matrix of which seller demonstrates which concept. |

Dotted-underlined terms explain themselves on hover, and every new element has a BA Lens note.

| Campaign builder | Cart Sandbox |
| --- | --- |
| ![Campaign builder](docs/screenshots/campaign-builder.png) | ![Cart Sandbox](docs/screenshots/cart-sandbox.png) |
| **Brand mode** | **Bundles** |
| ![Brand mode](docs/screenshots/brand-mode.png) | ![Bundles](docs/screenshots/bundles.png) |
| **Season plan** | **Demo sellers** |
| ![Season plan](docs/screenshots/season-plan.png) | ![Demo sellers](docs/screenshots/sellers.png) |

## Brand

| Loading screen | Demo sellers |
| --- | --- |
| ![Loading screen](docs/screenshots/loading.png) | ![Demo sellers](docs/screenshots/sellers.png) |

- **Mark.** A balance scale with a price tag in one pan and rising bars in the other: the discount, weighed against what it truly
  earns. One geometry ([`src/brand/mark.ts`](src/brand/mark.ts)) drives the in-app logo, the loader and every icon file.
  `node scripts/brand-icons.ts` regenerates the favicon (`.svg`, `.ico`), app icons (light and dark), Apple touch icon,
  maskable icon and web manifest in `public/`.
- **Palette.** Primary `#0B3D2E` · Accent `#F59E0B` · Background `#FFF7E9` · Surface `#E7F3EC` · Border `#CBD5D1` · Text `#1F2937`.
  Amber text uses a darker shade (`#B45309`) to stay readable on cream; gain green and loss vermilion remain for numbers.
- **Loading.** A splash painted straight from `index.html` (before any JavaScript), then driven by the app: it loads every
  screen's code, waits for the fonts and lets the first screen render, with the scale swinging less as each step finishes.
  It plays in full once per session. Screens that are still loading show skeletons shaped like the screen.
- **Demo sellers.** Saanjh Botanicals, Rangreza Weaves, VoltLane and Malwa Bites each have an original mark, wordmark and
  colours ([`src/brand/sellers.tsx`](src/brand/sellers.tsx)), used in the switcher, seller cards, receipts and Brand mode.
- **Marketplace logos.** Amazon, Flipkart, Nykaa and Meesho logos are their owners' trademarks and are never redrawn here.
  Official files go in [`src/assets/marketplaces`](src/assets/marketplaces/README.md) and appear automatically; until then
  the app shows the platform name with a neutral icon.

## How the numbers work

Every figure comes from a small, tested engine in [`src/engine`](src/engine):

```
units with offer   = baseline × (1 − discount) ^ elasticity × placement boost   (capped by stock)
lift               = units with offer − baseline
lift               = cannibalized + pulled forward + truly incremental
given away         = discount to baseline buyers + deal fees + cannibalized margin + pulled-forward margin
earned             = profit on lift + halo on other products + write-off avoided on stock that would expire
net impact         = earned − given away
```

A campaign is checked against a cart in four gates, in order: **WHO** (is this shopper eligible) → **IF** (are the
conditions met) → **STACK** (does it combine with what already applied) → **LIMITS** (caps and budget left). The first
gate that fails is the reason shown.

Recommendations pick the discount with the highest net impact inside the margin floor, hold full price when the best
deal isn't worth training customers to wait, and switch to Buy 1 Get 1 for overstock that needs a deep cut.

## Roadmap

| Release | Scope |
| --- | --- |
| **1 · The Scale** (done) | Design system, engine, Meera's data, five decision screens, Control Room, BA Lens |
| **2 · The Market** (this) | Campaign builder (visual rules, caps, budgets), Cart Sandbox (stacking and leakage), season plan, bundles, loyalty; demo sellers Farhan, Kabir and Anaya with a CPG "Brand mode" |
| **3 · The Mind** | Six AI features (copilot, brief to plan, Watchtower alerts, sale debrief, offer copy, autonomy dial), story mode, interactive case study hub, dark mode |

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # engine tests
npm run build    # static build in dist/
```

Static site, no backend. Deploys as-is to Vercel or Netlify (SPA rewrites included in `vercel.json` and
`public/_redirects`).

## Built with

React, TypeScript, Vite, Tailwind CSS v4, Motion, Zustand, Recharts, Radix UI primitives, cmdk, Sonner, NumberFlow,
Rough Notation, Lucide icons; Fraunces, Geist and Geist Mono via Fontsource. The Scale, Truth Lens peel and Stock Pulse
grid are custom-built with SVG and Motion.
