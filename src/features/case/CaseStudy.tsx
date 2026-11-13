import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Check, Play, PlayCircle, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { Card, Chip, Eyebrow, PageHeader, Switch } from '@/components/ui'
import { LENS } from '@/content/lens'
import { SELLERS, controlsFor } from '@/data/sellers'
import { portfolio, truthLens } from '@/engine/engine'
import { SellerMark } from '@/brand/sellers'
import { useMind } from '@/state/mind'
import { useStore } from '@/state/store'
import { useControls, usePortfolio, useSeller, useTruth } from '@/state/hooks'
import { dependency } from '@/ai/context'
import { useCtx, useGo } from '@/features/mind/shared'
import { inrShort, pct } from '@/lib/format'
import { cn } from '@/lib/cn'
import { needsSeller, routeOf, screenName } from './spots'

const SECTIONS = [
  ['problem', 'Problem'], ['journey', 'Journey map'], ['flow', 'Process'], ['trace', 'Traceability'], ['gap', 'Gap map'],
  ['scope', 'Scope'], ['assume', 'Assumptions'], ['kpi', 'KPIs & roadmap'],
] as const

export function CaseStudy() {
  const startStory = useMind((s) => s.startStory)
  return (
    <div>
      <PageHeader eyebrow="Case Study · how Tarazu was thought through" title={<>Every pixel traces back<br /><span className="text-ink-3">to a need, a rule and a metric.</span></>}
        aside={<button onClick={startStory} className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-paper"><PlayCircle size={15} className="text-brass-2" /> Play the 3-minute story</button>}>
        The business analysis behind the prototype, built as working pieces of the app: click a pain point, a requirement or a
        feature and the app opens the screen that answers it, with that element highlighted. Switch on the BA Lens (B) anywhere for the same notes in place.
      </PageHeader>
      <nav aria-label="Case study sections" className="sticky top-[57px] z-20 -mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-rule bg-paper/90 px-4 py-2 backdrop-blur md:-mx-8 md:px-8">
        {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`} className="shrink-0 rounded-full px-3 py-1 text-[12.5px] text-ink-2 hover:bg-paper-2 hover:text-ink">{label}</a>)}
      </nav>
      <div className="space-y-12">
        <Problem />
        <Journey />
        <Flow />
        <Trace />
        <Gap />
        <Scope />
        <Assumptions />
        <Kpis />
      </div>
    </div>
  )
}

function H({ id, n, title, children }: { id: string; n: number; title: string; children?: React.ReactNode }) {
  return (
    <div id={id} className="mb-4 scroll-mt-28">
      <Eyebrow>{String(n).padStart(2, '0')} · {SECTIONS[n - 1][1]}</Eyebrow>
      <h2 className="display mt-1 text-[26px] leading-tight text-ink">{title}</h2>
      {children && <p className="mt-1.5 max-w-3xl text-[14px] leading-relaxed text-ink-2">{children}</p>}
    </div>
  )
}

/* 01 · Problem and opportunity, measured on all four sellers */
function Problem() {
  const rows = useMemo(() => SELLERS.map((s) => {
    const c = controlsFor(s)
    const p = portfolio(s.skus, c), t = truthLens(s.skus, c, s.history)
    return { s, stuck: p.stuck, last: t.net, plan: t.planNet }
  }), [])
  const tot = rows.reduce((a, r) => ({ stuck: a.stuck + r.stuck, gap: a.gap + (r.plan - r.last) }), { stuck: 0, gap: 0 })
  return (
    <section>
      <H id="problem" n={1} title="Small sellers discount by gut, and lose money they can't see">
        Enterprise retailers have price-and-promotion optimisation tools. A seller with 40 to 200 products has a spreadsheet and the
        marketplace's own dashboard, which only sees one store. Across the four demo businesses, that gap is measurable.
      </H>
      <div className="grid gap-3 md:grid-cols-[1.1fr_1fr_1fr]">
        <Card className="border-beam p-5"><Eyebrow>Across four sellers</Eyebrow><div className="num mt-2 text-[30px] font-semibold text-loss">{inrShort(tot.stuck)}</div><div className="text-[12.5px] text-ink-3">stuck in stock that won't sell in time</div><div className="num mt-3 text-[30px] font-semibold text-gain">+{inrShort(tot.gap)}</div><div className="text-[12.5px] text-ink-3">left on the table at the last festival, vs a targeted plan</div></Card>
        <Card className="p-5 md:col-span-2">
          <Eyebrow>Last festival sale, by seller</Eyebrow>
          <ul className="mt-3 divide-y divide-rule-2">
            {rows.map((r) => (
              <li key={r.s.id} className="grid grid-cols-[1fr_80px_80px_80px] items-center gap-2 py-2 text-[12.5px]">
                <span className="flex min-w-0 items-center gap-2"><SellerMark id={r.s.id} size={22} /><span className="truncate text-ink">{r.s.brand}</span></span>
                <span className="num text-right text-loss">{inrShort(r.stuck)}</span>
                <span className={cn('num text-right', r.last < 0 ? 'text-loss' : 'text-ink')}>{inrShort(r.last)}</span>
                <span className="num text-right text-gain">{inrShort(r.plan)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-1 grid grid-cols-[1fr_80px_80px_80px] gap-2 text-right text-[10.5px] tracking-wider text-ink-3 uppercase"><span /><span>Stuck</span><span>Sale made</span><span>Plan</span></div>
        </Card>
      </div>
    </section>
  )
}

/* 02 · Journey map: today vs with Tarazu, each fix one click away */
function Journey() {
  const s = useSeller()
  const go = useGo()
  const hero = `/sku/${s.heroSkuId}`
  const stages = [
    { stage: 'Notice', today: 'Finds stuck stock when the godown is full', pain: 0.7, fix: 'Stock Pulse shows risk on every product', to: '/pulse', spot: 'pulse-grid' },
    { stage: 'Decide depth', today: "Copies the rival's 40% off", pain: 0.9, fix: 'The Scale finds the sweet spot and the cliff', to: hero, spot: 'scale' },
    { stage: 'Pick channel', today: 'Runs it on every channel', pain: 0.6, fix: 'Platform compare counts every fee', to: '/compare', spot: 'compare-cards' },
    { stage: 'Set up', today: 'Codes leak; offers stack by mistake', pain: 0.8, fix: 'Rule blocks, test carts, one-click leak fix', to: '/sandbox', spot: 'pipeline' },
    { stage: 'Run', today: 'Watches revenue, not profit', pain: 0.65, fix: 'Watchtower alerts with one action each', to: '/watchtower', spot: 'alerts' },
    { stage: 'Review', today: 'Celebrates the sales spike', pain: 0.85, fix: 'Debrief: what made money, what only looked good', to: '/debrief', spot: 'debrief-headline' },
  ]
  const W = 600, Hh = 90
  const x = (i: number) => ((i + 0.5) * W) / stages.length
  const y = (pain: number) => 10 + pain * 70
  const line = (k: 'today' | 'tz') => stages.map((st, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(k === 'today' ? st.pain : 0.12 + (i % 2) * 0.06)}`).join(' ')
  return (
    <section>
      <H id="journey" n={2} title={`${s.name}'s promotion journey, today and with Tarazu`}>The lines show how the seller feels at each stage: higher is calmer. Click any fix to open it in the app.</H>
      <Card className="overflow-x-auto p-5">
        <div className="min-w-[760px]">
          <svg viewBox={`0 0 ${W} ${Hh}`} preserveAspectRatio="none" className="h-[96px] w-full" aria-hidden>
            <path d={line('today')} fill="none" stroke="var(--color-loss)" strokeWidth="2" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
            <path d={line('tz')} fill="none" stroke="var(--color-gain)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="mb-2 flex justify-between text-[10.5px] tracking-wider text-ink-3 uppercase"><span>↑ Calm</span><span>Stressed ↓</span></div>
          <div className="grid grid-cols-6 gap-3">
            {stages.map((st) => (
              <div key={st.stage} className="text-[12px]">
                <div className="text-[11px] font-semibold tracking-wider text-ink uppercase">{st.stage}</div>
                <div className="mt-1.5 rounded-lg border border-loss/20 bg-loss-soft/60 p-2 leading-snug text-loss">{st.today}</div>
                <button onClick={() => go(st.to, st.spot)} className="group mt-1.5 w-full rounded-lg border border-gain/25 bg-gain-soft/70 p-2 text-left leading-snug text-gain hover:border-gain/60">
                  {st.fix} <ArrowRight size={11} className="inline transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-[11px] text-ink-3"><span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed border-loss" /> Today</span><span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-gain" /> With Tarazu</span></div>
        </div>
      </Card>
    </section>
  )
}

/* 03 · As-is vs to-be process, animated */
function Flow() {
  const asis = ['See a rival\'s sale', 'Pick a % by gut', 'Discount everything', 'Run on every channel', 'Count revenue']
  const tobe = ['Spot risky stock', 'Weigh each discount', 'Pick the channel', 'Build and test the rule', 'Watch and adjust', 'Debrief on profit']
  const [i, setI] = useState(-1)
  useEffect(() => {
    if (i < 0 || i >= asis.length + tobe.length) return
    const t = setTimeout(() => setI((v) => v + 1), 650)
    return () => clearTimeout(t)
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
  const done = i >= asis.length + tobe.length
  return (
    <section>
      <H id="flow" n={3} title="The decision process, before and after">Five steps of habit become six steps of evidence. Press play to walk both.</H>
      <Card className="p-5">
        <button onClick={() => setI(0)} className="mb-4 flex items-center gap-1.5 rounded-full border border-rule px-3 py-1.5 text-[12.5px] text-ink-2 hover:text-ink">{done ? <RotateCcw size={13} /> : <Play size={13} />} {done ? 'Replay' : 'Play'}</button>
        {[{ label: 'As-is', steps: asis, off: 0, tone: 'loss' }, { label: 'To-be', steps: tobe, off: asis.length, tone: 'gain' }].map((row) => (
          <div key={row.label} className="mb-4 last:mb-0">
            <div className={cn('mb-2 text-[11px] font-semibold tracking-wider uppercase', row.tone === 'loss' ? 'text-loss' : 'text-gain')}>{row.label}</div>
            <ol className="flex flex-wrap items-center gap-1.5">
              {row.steps.map((st, k) => {
                const lit = i >= row.off + k
                const faded = row.tone === 'loss' && i >= asis.length
                return (
                  <li key={st} className="flex items-center gap-1.5">
                    <motion.span animate={{ opacity: faded ? 0.35 : 1, scale: lit && i === row.off + k ? 1.05 : 1 }}
                      className={cn('rounded-lg border px-3 py-2 text-[12.5px] transition-colors', lit ? (row.tone === 'loss' ? 'border-loss/40 bg-loss-soft text-loss' : 'border-gain/40 bg-gain-soft text-gain') : 'border-rule bg-card text-ink-3', faded && 'line-through')}>
                      {st}
                    </motion.span>
                    {k < row.steps.length - 1 && <ArrowRight size={13} className="text-ink-3" />}
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
      </Card>
    </section>
  )
}

/* 04 · Living traceability matrix */
function Trace() {
  const s = useSeller()
  const { setSeller } = useStore()
  const go = useGo()
  const [q, setQ] = useState('')
  const rows = Object.entries(LENS).map(([id, n]) => ({ id, n, route: routeOf(id, s) })).filter((r) => r.route)
    .filter((r) => !q || `${r.n.title} ${r.n.story} ${r.n.kpi}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.n.story.match(/US-(\d+)/)?.[1] ?? '99').localeCompare(b.n.story.match(/US-(\d+)/)?.[1] ?? '99', undefined, { numeric: true }))
  const open = (id: string, route: string) => {
    const need = needsSeller(id)
    if (need === 'anaya' && s.id !== 'anaya') setSeller('anaya')
    if (need === 'own' && !s.loyalty) setSeller('meera')
    go(route, id)
  }
  return (
    <section>
      <H id="trace" n={4} title="Requirement → user story → screen → KPI">Every annotated element in the app, with its story and the metric it moves. Click a row to open that screen with the element highlighted.</H>
      <Card className="p-0">
        <div className="border-b border-rule p-3"><label className="sr-only" htmlFor="trace-q">Filter</label><input id="trace-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Filter ${Object.keys(LENS).length} requirements…`} className="w-full rounded-lg border border-rule bg-paper px-3 py-2 text-[13px] text-ink outline-none focus:border-brass/60" /></div>
        <div className="max-h-[440px] overflow-auto">
          <table className="w-full min-w-[760px] text-[12.5px]">
            <thead className="sticky top-0 bg-card text-left text-ink-3"><tr className="border-b border-rule"><th className="px-3 py-2 font-medium">Story</th><th className="px-3 py-2 font-medium">Requirement</th><th className="px-3 py-2 font-medium">Screen</th><th className="px-3 py-2 font-medium">KPI</th><th className="px-3 py-2 font-medium">Scope</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => open(r.id, r.route!)} className="cursor-pointer border-b border-rule-2 hover:bg-paper-2/70">
                  <td className="num px-3 py-2 text-ink-3">{r.n.story.match(/US-\d+/)?.[0] ?? '—'}</td>
                  <td className="px-3 py-2"><div className="text-ink">{r.n.title}</div><div className="line-clamp-1 text-[11.5px] text-ink-3">{r.n.story.replace(/^US-\d+ · /, '')}</div></td>
                  <td className="px-3 py-2 whitespace-nowrap text-brass">{screenName(r.route!)} →</td>
                  <td className="px-3 py-2 text-ink-2">{r.n.kpi}</td>
                  <td className="px-3 py-2"><Chip tone={r.n.scope === 'Must' ? 'ink' : r.n.scope === 'Should' ? 'brass' : 'quiet'}>{r.n.scope}</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  )
}

/* 05 · Gap map: where Tarazu sits */
function Gap() {
  const dots = [
    { n: 'Promotion engines (rule builders)', x: 0.22, y: 0.42, lack: 'Run any promotion brilliantly; don\'t tell you whether to run it, or what it really earned.' },
    { n: 'Enterprise price & promo optimisation', x: 0.12, y: 0.86, lack: 'The right maths, priced and built for large retail chains.' },
    { n: 'CPG trade promotion suites', x: 0.3, y: 0.74, lack: 'For big brands with a finance team; months to roll out.' },
    { n: 'Marketplace seller dashboards', x: 0.72, y: 0.34, lack: 'Free and familiar, but see one store only, and will never suggest a rival channel.' },
    { n: 'Spreadsheets and gut feel', x: 0.86, y: 0.12, lack: 'No fees, cannibalisation or pulled-forward demand. Revenue looks like profit.' },
    { n: 'Tarazu', x: 0.82, y: 0.84, lack: 'Decision-grade maths for a 40-to-200-product seller, across every channel, explained in plain words.', me: true },
  ]
  const [hover, setHover] = useState(5)
  return (
    <section>
      <H id="gap" n={5} title="The gap: decision intelligence for the small seller">Hover a dot for what each option is missing.</H>
      <div className="grid gap-4 md:grid-cols-[1fr_300px]">
        <Card className="relative aspect-[16/10] p-0">
          <div className="absolute inset-0 m-8 border-b border-l border-ink-3/40">
            <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-rule" /><div className="absolute top-0 left-1/2 h-full border-l border-dashed border-rule" />
            {dots.map((d, i) => (
              <button key={d.n} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} style={{ left: `${d.x * 100}%`, bottom: `${d.y * 100}%` }}
                className={cn('absolute -translate-x-1/2 translate-y-1/2 rounded-full transition-transform', d.me ? 'h-5 w-5 bg-brass-2 ring-4 ring-brass-2/25' : 'h-3.5 w-3.5 bg-ink-3', hover === i && 'scale-125')} aria-label={d.n} />
            ))}
            {dots.map((d) => <span key={d.n + 'l'} style={{ left: `${d.x * 100}%`, bottom: `${d.y * 100}%` }} className={cn('pointer-events-none absolute translate-y-1/2 text-[11px] whitespace-nowrap max-sm:hidden', d.x > 0.55 ? '-translate-x-[calc(100%+12px)]' : 'translate-x-3', d.me ? 'font-semibold text-brass' : 'text-ink-3')}>{d.n}</span>)}
          </div>
          <span className="absolute bottom-2 left-8 text-[10.5px] tracking-wider text-ink-3 uppercase">Built for enterprises</span>
          <span className="absolute right-4 bottom-2 text-[10.5px] tracking-wider text-ink-3 uppercase">Built for small sellers →</span>
          <span className="absolute top-8 left-1 origin-top-left -rotate-90 text-[10.5px] tracking-wider whitespace-nowrap text-ink-3 uppercase">↑ Decision intelligence</span>
        </Card>
        <Card className="p-5">
          <Eyebrow>{dots[hover].me ? 'What Tarazu adds' : 'What it lacks'}</Eyebrow>
          <div className="display mt-1 text-[20px] text-ink">{dots[hover].n}</div>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{dots[hover].lack}</p>
        </Card>
      </div>
    </section>
  )
}

/* 06 · Scope board (MoSCoW) */
function Scope() {
  const [must, setMust] = useState(false)
  const cols: ('Must' | 'Should' | 'Could')[] = ['Must', 'Should', 'Could']
  const entries = Object.entries(LENS)
  return (
    <section>
      <H id="scope" n={6} title="Scope, prioritised">Every annotated feature, by MoSCoW priority. Toggle to see the smallest product that still solves the problem.</H>
      <label className="mb-3 flex items-center gap-2 text-[12.5px] text-ink-2"><Switch checked={must} onChange={setMust} label="Must-haves only" /> Show only the Must-haves (the MVP)</label>
      <div className="grid gap-3 md:grid-cols-3">
        {cols.map((col) => {
          const items = entries.filter(([, n]) => n.scope === col)
          return (
            <Card key={col} className={cn('p-4 transition-opacity', must && col !== 'Must' && 'opacity-25')}>
              <div className="flex items-center justify-between"><Eyebrow>{col} have</Eyebrow><span className="num text-[12px] text-ink-3">{items.length}</span></div>
              <ul className="mt-2 flex flex-wrap gap-1.5">{items.map(([id, n]) => <li key={id} title={n.story} className="rounded-md border border-rule bg-paper px-2 py-1 text-[11.5px] text-ink-2">{n.title}</li>)}</ul>
            </Card>
          )
        })}
      </div>
      <p className="mt-2 text-[12px] text-ink-3">Won't have (this prototype): real marketplace APIs, payments, live creator data, production dynamic pricing, real multi-user approvals.</p>
    </section>
  )
}

/* 07 · Assumptions and risks, each tied to the control that tests it */
function Assumptions() {
  const c = useControls()
  const s = useSeller()
  const { setRoom } = useStore()
  const hero = s.skus.find((k) => k.id === s.heroSkuId)!
  const list = [
    { a: `Buyers of ${hero.category.toLowerCase()} respond to price at elasticity ${(hero.elasticity * c.elasticityMult).toFixed(1)}`, k: 'Price sensitivity', v: `×${c.elasticityMult.toFixed(2)}` },
    { a: `Sale-day demand is ${c.seasonality.toFixed(2)}× a normal week`, k: 'Seasonal demand', v: `${c.seasonality.toFixed(2)}×` },
    { a: `${pct(c.pullForward)} of promo sales are next month's sales pulled forward`, k: 'Pull-forward', v: pct(c.pullForward) },
    { a: 'Platform fees match today\'s rate cards (they are illustrative)', k: 'Platform fees', v: String(c.feeLevel) },
    { a: 'Rivals keep their prices', k: 'Competitor price', v: c.competitorPrice ? `−${pct(c.competitorPrice)}` : 'unchanged' },
    { a: 'Sales data is complete and clean', k: 'Data quality', v: c.dataQuality },
  ]
  const risks = [
    { r: 'Sellers don\'t trust a number they didn\'t calculate', m: 'Every recommendation shows its working (the Scale), a confidence level and the cliff' },
    { r: 'Messy or missing sales data', m: 'Data-quality control lowers confidence and widens caution; never hides the uncertainty' },
    { r: 'Marketplaces limit data access', m: 'Start from seller exports (CSV); APIs later' },
    { r: 'AI says something the numbers don\'t support', m: 'The engine computes every figure; the AI only picks and phrases them' },
  ]
  return (
    <section>
      <H id="assume" n={7} title="Assumptions you can test, risks with a mitigation">Each assumption is a Control Room setting, so a viewer can change it and watch every screen respond.</H>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <Eyebrow>Assumptions</Eyebrow>
          <ul className="mt-2 divide-y divide-rule-2">
            {list.map((x) => (
              <li key={x.k} className="flex items-center gap-3 py-2.5 text-[13px]">
                <span className="min-w-0 flex-1 text-ink-2">{x.a}</span>
                <button onClick={() => setRoom(true)} className="flex shrink-0 items-center gap-1.5 rounded-full border border-rule px-2.5 py-1 text-[11.5px] text-ink-2 hover:border-brass/50 hover:text-ink"><SlidersHorizontal size={11} /> {x.k}: <span className="num font-semibold">{x.v}</span></button>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <Eyebrow>Risks</Eyebrow>
          <ul className="mt-2 space-y-3">
            {risks.map((x) => <li key={x.r} className="text-[13px]"><div className="font-medium text-ink">{x.r}</div><div className="mt-0.5 flex gap-1.5 text-ink-2"><Check size={13} className="mt-0.5 shrink-0 text-gain" />{x.m}</div></li>)}
          </ul>
        </Card>
      </div>
    </section>
  )
}

/* 08 · KPIs, roadmap and the one-line summary */
function Kpis() {
  const p = usePortfolio(), t = useTruth(), x = useCtx(), s = useSeller()
  const kpis = [
    { k: 'Promotion profit', v: `+${inrShort(p.gain)}`, d: 'Net impact of the recommended offers, after every cost' },
    { k: 'Margin protected', v: inrShort(t.planNet - t.net), d: 'Targeted plan vs last festival\'s blanket sale' },
    { k: 'Cash freed', v: inrShort(p.freed), d: 'Stock turned into cash for new buying' },
    { k: 'Promo dependency', v: pct(dependency(x)), d: 'Share of units that only sell on discount (lower is healthier)' },
  ]
  const roadmap = [
    ['R1 · The Scale', 'Engine, Overview, Stock Pulse, the Scale, Truth Lens, Platform compare, Control Room, BA Lens', 'Shipped'],
    ['R2 · The Market', 'Four sellers, Campaign builder, Cart Sandbox, Season plan, Bundles, Loyalty, Brand mode', 'Shipped'],
    ['R3 · The Mind', 'Six scripted AI features, story mode, this Case Study, dark mode, mobile', 'Shipped'],
    ['R4 · The Launch', 'The builder journey: goal to live offer, codes, channel formats, pre-flight, approvals, lifecycle, guardrails, edge cases', 'Shipped'],
    ['R5 · The Reach', 'Creator hub with true ROI, affiliates and attribution, referral 2.0 with a fraud queue, reseller mode, community drops, group buys and review rewards', 'Shipped'],
    ['R6 · The Edge', 'Uplift targeting, ads vs discount, ONDC as a channel, subscribe and save, pre-orders, price-drop protection, experiments', 'This release'],
  ]
  return (
    <section>
      <H id="kpi" n={8} title={`What success looks like, measured for ${s.name}`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <Card key={k.k} className="p-4"><Eyebrow>{k.k}</Eyebrow><div className="num mt-1.5 text-[24px] font-semibold text-ink">{k.v}</div><div className="mt-1 text-[11.5px] leading-snug text-ink-3">{k.d}</div></Card>)}
      </div>
      <Card className="mt-4 p-5">
        <Eyebrow>Roadmap</Eyebrow>
        <ol className="mt-3 space-y-2">
          {roadmap.map(([r, d, st]) => (
            <li key={r} className="grid grid-cols-[130px_1fr_auto] items-start gap-3 text-[13px]">
              <span className="font-semibold text-ink">{r}</span><span className="text-ink-2">{d}</span>
              <Chip tone={st === 'Shipped' ? 'gain' : st === 'This release' ? 'brass' : 'quiet'}>{st}</Chip>
            </li>
          ))}
        </ol>
      </Card>
      <Card className="mt-4 border-transparent bg-hero p-6 text-hero-ink">
        <div className="text-[11px] tracking-[0.14em] uppercase opacity-70">In one line</div>
        <p className="display mt-2 text-[20px] leading-snug">Conceived and designed Tarazu, a promotion-intelligence SaaS concept for Indian marketplace sellers: ran the domain research, defined personas, scope, business rules and KPIs, and delivered a working prototype with an engine-backed AI layer.</p>
        <p className="mt-3 text-[12.5px] opacity-75">Prototype by Anurag Singh · React, TypeScript, a tested pricing engine and no backend.</p>
      </Card>
    </section>
  )
}
