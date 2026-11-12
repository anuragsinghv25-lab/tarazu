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

The first of three releases. Meera — a fictional Ayurvedic skincare brand in Jaipur selling on Amazon, Flipkart,
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

Recommendations pick the discount with the highest net impact inside the margin floor, hold full price when the best
deal isn't worth training customers to wait, and switch to Buy 1 Get 1 for overstock that needs a deep cut.

## Roadmap

| Release | Scope |
| --- | --- |
| **1 · The Scale** (this) | Design system, engine, Meera's data, five decision screens, Control Room, BA Lens |
| **2 · The Market** | Campaign builder (visual rules, caps, budgets), Cart Sandbox (stacking and leakage), season plan, bundles, loyalty; demo sellers Farhan, Kabir and Anaya with a CPG "Brand mode" |
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
