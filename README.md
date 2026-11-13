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

## Release 6 · "The Edge"

The techniques that separate a good promotion team from a great one. Each still lands on the Scale: money given away against money earned.

| Screen | What it does |
| --- | --- |
| **Uplift targeting** | Customers sorted into persuadables, sure things, lost causes and sleeping dogs. Sending to everyone, to the most likely buyers, and to the most persuadable are compared on net; the uplift curve shows where to stop. One click drafts the targeted offer into the Launch flow. |
| **Ads vs discount** | One monthly budget split between paid ads (cost per buyer rises with spend) and discounts (the extra-order share falls as reach widens). Finds the most profitable mix and shows what each rupee buys. |
| **ONDC channel** | One order's fees on ONDC against the seller's main marketplace, with buyer-app and seller-app fees, network-funded discounts and pass-through pricing as settings. Products ranked by extra margin kept. |
| **Subscribe and save** | A month's subscribers followed for a year against what the same buyers would order anyway. Honest about fit: not offered for sarees. |
| **Pre-orders** | An early-bird window before a launch (Kabir's 65W): confirmed pre-orders narrow the demand forecast, cut stock at risk and bring cash in early. |
| **Price-drop protection** | "If our price drops within N days, we refund the difference": buyers who stop waiting vs claims when a sale lands inside the window. |
| **Experiments** | Sample size and days for a test, alternate-week tests where marketplaces can't split traffic, the peeking problem shown on two identical offers, and a readout on profit per visitor as well as conversion. |

ONDC fees, incentives and volumes are illustrative, not quoted rates. Customer groups and their offer effects are invented.

| Uplift targeting | Ads vs discount |
| --- | --- |
| ![Uplift targeting](docs/screenshots/uplift.png) | ![Ads vs discount](docs/screenshots/ads-vs-discount.png) |
| **ONDC channel** | **Experiments** |
| ![ONDC](docs/screenshots/ondc.png) | ![Experiments](docs/screenshots/experiments.png) |
| **Pre-orders** | |
| ![Pre-orders](docs/screenshots/pre-orders.png) | |

## Release 5 · "The Reach"

Promotion beyond the discount: creators, affiliates, referring customers, resellers and a seller's own community.
Every one of them earns a cut, so Tarazu asks the same question it asks of a discount: how much of this would have sold anyway?

| Screen | What it does |
| --- | --- |
| **Creator hub** | Creators ranked by expected net, not followers, with fit, fake-follower risk and code-leak history. One celebrity vs ten micro creators for the same budget. A deal designer for flat fee, commission, seeding or hybrid, with single-use codes and a **true ROI peel**: orders minus fans who'd have bought anyway and leaked codes, cost per new buyer against the seller's ads CAC. One click drafts the creator campaign into the Launch flow. |
| **Disclosure and rights** | Each caption checked against the ASCI influencer guidelines (a clear label, up front). A seeding tracker and content calendar with usage-rights expiry. |
| **Affiliates** | Commission by category, higher where stock is at risk. Last-click vs first-click vs linear attribution on the same orders. A ledger that holds commission until the return window closes and pauses self-referring cashback apps and coupon sites. |
| **Referral 2.0** | Two-sided and tiered rewards shared on WhatsApp, with net and cost per new buyer. A fraud queue flags the same device, address or payment, and sign-up bursts. |
| **Resellers** | A reseller margin vs a sitewide sale, on weekly net (Farhan's 30% habit vs 340 WhatsApp resellers). |
| **Community** | WhatsApp drop planner with a members-first window and a 48-hour sell-through forecast. Group buys: the smallest group that still makes money. Review rewards that never depend on the rating (BIS IS 19000:2022). |

Creators, affiliates and handles are invented. Ads CAC, engagement and leak rates are illustrative.

| Creator hub | Affiliates and attribution |
| --- | --- |
| ![Creator hub](docs/screenshots/creator-hub.png) | ![Affiliates](docs/screenshots/affiliates.png) |
| **Referral fraud queue** | **Community** |
| ![Referrals](docs/screenshots/referrals.png) | ![Community](docs/screenshots/community.png) |

## Release 4 · "The Launch"

The builder half of a promotion engine: the journey of creating, checking, approving, launching and controlling an offer,
and what the shopper sees. Competitors build first and find out later whether it paid; Tarazu weighs while you build.

| Screen | What it does |
| --- | --- |
| **Launch flow** | 13 steps from a goal ("clear old stock", "win back lapsed buyers", "beat a rival's price"…) to a live offer: audience, conditions, reward, codes, limits, schedule, channels, stacking, pre-flight, shopper preview, approval, publish. A mini-Scale beside every step shows given away vs earned. |
| **Audience builder** | New, repeat, lapsed N days, members, average order above, city, app, uploaded list; live audience size and the share who'd buy anyway. |
| **Channel format mapping** | One offer translated into each channel's format (Amazon coupon / Lightning Deal, Flipkart Deal of the Day / Buy more save more, Meesho product discount, own site), marked as built, adapted or can't run. Illustrative, not official rules. |
| **Pre-flight check** | Margin floor, profit cliff, never above MRP, empty audience, offers it would stack or compete with, the worst stacked cart, leak-prone codes, budget run-out, unsupported channels, fake-urgency countdowns, sale-event overlap. Blockers stop publishing; most come with a one-click fix. |
| **Lifecycle** | Kanban board (Draft → In review → Approved → Scheduled → Live → Paused → Ended → Archived) with drag-and-drop that only allows legal moves, an audit log and version diffs per campaign. |
| **Approvals** | Maker-checker: offers above the policy (discount, budget, code count, loss leaders, pre-flight warnings; trade promotions always) go to review. Switch to the approver role to approve, or reject with a reason. |
| **Guardrails** | Live offers auto-pause on a margin breach, redemption spike or budget hit, and auto-cap when a code shows up on a coupon site. Simulate each event and watch it act. |
| **Code studio** | Thousands of single-use codes: random, non-sequential, collision-checked, no 0/O or 1/I. Track status, block a code, export CSV. |
| **Shopper preview** | Listing badge, product page, cart nudge, checkout breakdown and coupon wallet in the seller's own brand, priced by the same engine as the Cart Sandbox. |
| **Edge-case lab** | 49 edge cases in 10 areas, each with its rule. 11 run live: change the inputs and compare "without the rule" against "with Tarazu's rule". |

| Launch flow | Pre-flight check |
| --- | --- |
| ![Launch flow](docs/screenshots/launch-flow.png) | ![Pre-flight check](docs/screenshots/preflight.png) |
| **Channel format mapping** | **Lifecycle board** |
| ![Channel mapping](docs/screenshots/channel-mapping.png) | ![Lifecycle](docs/screenshots/lifecycle.png) |
| **Shopper preview** | **Edge-case lab** |
| ![Shopper preview](docs/screenshots/shopper-preview.png) | ![Edge-case lab](docs/screenshots/edge-case-lab.png) |

## Release 3 · "The Mind"

An AI layer on top of the engine, with one rule: **the engine computes every number; the AI only chooses which numbers
answer the question and says them in plain words.** In this prototype the AI is scripted (no model calls), so every answer is
reproducible and every figure is traceable. Answers recompute live when the Control Room changes.

| Feature | What it does |
| --- | --- |
| **Ask Tarazu** | A copilot in English, Hindi or Hinglish ("Big Billion Days mein kya daalun?"). Answers come with numbers, tappable rows that open the exact screen with the element highlighted, and a "how I worked this out" trace. `⌘K` also asks. |
| **Brief to plan** | Write a goal ("clear ₹2 L of old stock, keep margin above 20%, don't touch face serums"). Tarazu shows how it read the brief as chips, sets the engine to match, builds the plan from its own recommendations, says honestly when the target can't be met, and adds the offers as drafts. |
| **Watchtower** | A proactive agent: aged stock, a rival's price cut, leaking codes (found by running test carts), budgets burning early, offers nobody uses, promo fatigue, over-claimed deductions. Each alert has the money at stake and one action. |
| **Autonomy dial + guardrails** | Suggest only → Ask before acting → Act within guardrails (max markdown, max spend per action, protect bestsellers). Auto-actions are listed with an undo. |
| **Sale debrief** | The Truth Lens as a morning-after report: headline, what made money, what only looked good, profit by category, and what to change next time. Copy or print. |
| **Offer copy studio** | Deal title, banner, WhatsApp broadcast, SMS and caption in four tones and three languages (English, Hinglish, हिंदी), built from the offer's facts and checked: length, real end date, no unprovable claims, T&C, opt-out, `#ad` on creator posts. |

Also in this release:

- **Story mode:** a guided 8-step walk through the product on the current seller's data (problem → see it → the trap → decide → where → plan → watch → outcome), pointing at each element. Arrow keys work.
- **Case Study hub:** problem sizing across four sellers, a clickable journey map, an animated as-is/to-be process, a living traceability matrix (every BA Lens note → story → screen → KPI; click to open it), a gap map, a MoSCoW scope board, assumptions tied to Control Room settings, KPIs and the roadmap.
- **Night market mode:** a dark theme. Every chart and the Scale read the same colour tokens, so they switch too.
- **Mobile:** every screen checked at 390 px with no sideways scroll; story mode and the AI screens work on a phone.

| Ask Tarazu | Watchtower |
| --- | --- |
| ![Ask Tarazu](docs/screenshots/ask-tarazu.png) | ![Watchtower](docs/screenshots/watchtower.png) |
| **Brief to plan** | **Sale debrief** |
| ![Brief to plan](docs/screenshots/brief-to-plan.png) | ![Sale debrief](docs/screenshots/sale-debrief.png) |
| **Offer copy studio** | **Case Study** |
| ![Offer copy studio](docs/screenshots/offer-copy.png) | ![Case Study](docs/screenshots/case-study.png) |
| **Story mode** | **Night market mode** |
| ![Story mode](docs/screenshots/story-mode.png) | ![Night market mode](docs/screenshots/night-mode.png) |

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
| **2 · The Market** (done) | Campaign builder, Cart Sandbox, season plan, bundles, loyalty; demo sellers Farhan, Kabir and Anaya with a CPG "Brand mode" |
| **3 · The Mind** (done) | Six AI features, story mode, Case Study hub, night mode, mobile |
| **4 · The Launch** (done) | The builder journey: goal to live offer, codes, segments, schedules, marketplace format mapping, approvals, lifecycle, guardrails and edge cases |
| **5 · The Reach** (done) | Creator hub with a true ROI peel, affiliates and attribution, referral 2.0 with fraud signals, reseller mode, community drops, group buys and review rewards |
| **6 · The Edge** (this) | Uplift targeting, ads vs discount, ONDC as a channel, subscribe and save, pre-orders and price-drop protection, proper experiments |

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
