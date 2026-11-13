import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { ArrowRight, Gift, Sparkles } from 'lucide-react'
import { Card, Chip, Eyebrow, HEALTH_META, Money, PageHeader, Slider } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { useStore } from '@/state/store'
import { useControls, useSeller } from '@/state/hooks'
import { bestBundle, bundleSim, matchBundles, type Pair } from '@/engine/bundles'
import { health, unitsAtRisk } from '@/engine/engine'
import { newCampaign } from '@/features/campaigns/templates'
import { inr, inrShort, pct, units } from '@/lib/format'
import { cn } from '@/lib/cn'

export function Bundles() {
  const seller = useSeller()
  const c = useControls()
  const pairs = useMemo(() => matchBundles(seller.skus, c, seller.affinity), [seller, c])
  const anchors = useMemo(() => [...new Map(pairs.map((p) => [p.anchor.id, p.anchor])).values()], [pairs])
  const [sel, setSel] = useState(0)
  const pair = pairs[Math.min(sel, pairs.length - 1)]

  return (
    <div>
      <PageHeader eyebrow="Bundle Matchmaker" title={<>Pair what's stuck<br /><span className="text-ink-3">with what already sells.</span></>}>
        Instead of discounting a slow mover on its own, Tarazu pairs it with a bestseller that the same buyers already pick up. The
        bestseller carries the traffic; the slow mover rides along. This is the halo effect, used on purpose.
      </PageHeader>
      {pairs.length === 0 ? <Card className="p-10 text-center text-ink-3">No slow movers with a natural partner right now.</Card> : (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <Spot id="bundles"><Matchboard pairs={pairs} anchors={anchors} sel={sel} onSel={setSel} /></Spot>
          <Spot id="bundle-detail" className="xl:sticky xl:top-24 xl:self-start"><Detail key={`${pair.slow.id}-${pair.anchor.id}`} pair={pair} /></Spot>
        </div>
      )}
    </div>
  )
}

function Matchboard({ pairs, anchors, sel, onSel }: { pairs: Pair[]; anchors: Pair['anchor'][]; sel: number; onSel: (i: number) => void }) {
  const c = useControls()
  const wrap = useRef<HTMLDivElement>(null)
  const left = useRef<(HTMLButtonElement | null)[]>([])
  const right = useRef<Record<string, HTMLDivElement | null>>({})
  const [paths, setPaths] = useState<{ d: string; i: number }[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })

  const measure = () => {
    const box = wrap.current?.getBoundingClientRect()
    if (!box) return
    setSize({ w: box.width, h: box.height })
    setPaths(pairs.map((p, i) => {
      const a = left.current[i]?.getBoundingClientRect(), b = right.current[p.anchor.id]?.getBoundingClientRect()
      if (!a || !b) return { d: '', i }
      const x1 = a.right - box.left, y1 = a.top + a.height / 2 - box.top
      const x2 = b.left - box.left, y2 = b.top + b.height / 2 - box.top
      const mx = (x1 + x2) / 2
      return { d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`, i }
    }))
  }
  useLayoutEffect(measure, [pairs, anchors]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const ro = new ResizeObserver(measure); if (wrap.current) ro.observe(wrap.current); return () => ro.disconnect() }, [pairs]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card className="p-5">
      <div className="mb-4 grid grid-cols-2 gap-10 text-[10.5px] font-semibold tracking-[0.14em] text-ink-3 uppercase md:gap-24">
        <span>Stuck: slow movers</span><span className="text-right">Carrying the traffic: bestsellers</span>
      </div>
      <div ref={wrap} className="relative grid grid-cols-2 gap-10 md:gap-24">
        <svg className="pointer-events-none absolute inset-0 overflow-visible" width={size.w} height={size.h} aria-hidden>
          <defs>
            <linearGradient id="beam-g" x1="0" x2="1"><stop offset="0" stopColor="#d97706" /><stop offset="1" stopColor="#1e7b4f" /></linearGradient>
          </defs>
          {paths.map(({ d, i }) => d && (
            <g key={i}>
              <path d={d} fill="none" stroke={i === sel ? 'url(#beam-g)' : '#cbd5d1'} strokeWidth={i === sel ? 2.5 : 1.2} />
              {i === sel && <path d={d} fill="none" stroke="#fff1d2" strokeWidth={3} strokeLinecap="round" strokeDasharray="10 220" className="[animation:dash_2.2s_linear_infinite]" />}
            </g>
          ))}
        </svg>
        <div className="relative space-y-2.5">
          {pairs.map((p, i) => {
            const h = HEALTH_META[health(p.slow, c)]
            return (
              <button key={p.slow.id} ref={(el) => { left.current[i] = el }} onClick={() => onSel(i)}
                className={cn('block w-full rounded-xl border p-3 text-left transition-all', i === sel ? 'border-primary bg-card shadow-[var(--shadow-lift)]' : 'border-rule bg-card/70 hover:bg-card')}>
                <div className="flex items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: h.color }} /><span className="line-clamp-1 text-[13px] font-medium text-ink">{p.slow.name}</span></div>
                <div className="num mt-0.5 pl-4 text-[11px] text-ink-3">{inrShort(unitsAtRisk(p.slow, c) * p.slow.cost)} at risk · {Math.round(p.attach * 100)}% of buyers pair it</div>
              </button>
            )
          })}
        </div>
        <div className="relative flex flex-col justify-around gap-2.5">
          {anchors.map((a) => {
            const active = pairs[sel]?.anchor.id === a.id
            return (
              <div key={a.id} ref={(el) => { right.current[a.id] = el }} className={cn('rounded-xl border p-3 transition-all', active ? 'border-gain/50 bg-gain-soft/50 shadow-[var(--shadow-card)]' : 'border-rule bg-card/70')}>
                <div className="flex items-center gap-2"><Sparkles size={12} className="shrink-0 text-gain" /><span className="line-clamp-1 text-[13px] font-medium text-ink">{a.name}</span></div>
                <div className="num mt-0.5 pl-5 text-[11px] text-ink-3">₹{a.price} · {a.category}</div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

function Detail({ pair }: { pair: Pair }) {
  const seller = useSeller()
  const c = useControls()
  const { saveCampaign } = useStore()
  const nav = useNavigate()
  const best = useMemo(() => bestBundle(pair, c), [pair, c])
  const [d, setD] = useState(best.d || 0.15)
  const r = useMemo(() => bundleSim(pair, c, d), [pair, c, d])
  const create = () => {
    const price = Math.round(r.price / 10) * 10 - 1
    const camp = newCampaign(seller, 'Bundle', {
      name: `${pair.slow.line} + ${pair.anchor.line} for ₹${price}`,
      conditions: [{ kind: 'hasSku', value: pair.slow.id }, { kind: 'hasSku', value: pair.anchor.id }],
      reward: { kind: 'bundlePrice', skus: [pair.slow.id, pair.anchor.id], price },
      dailyRedemptions: Math.max(1, Math.round(r.perWeek / 7)), budget: Math.max(5000, Math.round(r.subsidy * 1.3 / 1000) * 1000), endDay: 29,
    })
    saveCampaign(camp)
    toast('Bundle drafted as a campaign', { description: camp.name })
    nav(`/campaigns?id=${camp.id}`)
  }
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-brass"><Gift size={15} /><Eyebrow className="text-brass">Proposed bundle</Eyebrow></div>
      <h2 className="display mt-2 text-[22px] leading-tight text-ink">{pair.slow.line} <span className="text-ink-3">+</span> {pair.anchor.line}</h2>
      <div className="mt-1 flex flex-wrap gap-1.5"><Chip tone={HEALTH_META[health(pair.slow, c)].tone}>{HEALTH_META[health(pair.slow, c)].label}</Chip><Chip tone="gain">bestseller partner</Chip></div>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <div className="text-[11px] text-ink-3">Bundle price</div>
          <div className="flex items-baseline gap-2"><span className="num text-[30px] leading-none font-semibold text-ink">{inr(r.price)}</span><s className="num text-[14px] text-ink-3">{inr(r.list)}</s></div>
        </div>
        <div className="num text-[22px] font-semibold text-brass">{pct(d)} off</div>
      </div>
      <Slider label="Bundle discount" min={0} max={0.45} step={0.01} value={d} onChange={setD} className="mt-3" />
      <button onClick={() => setD(best.d)} className="mt-2 text-[12px] font-medium text-brass hover:text-ink">Use Tarazu's pick · {pct(best.d)}</button>
      <dl className="mt-4 grid grid-cols-2 gap-y-2 border-t border-dashed border-rule pt-3 text-[12.5px]">
        <dt className="text-ink-3">Bundles a week</dt><dd className="num text-right text-ink">{units(r.perWeek)}</dd>
        <dt className="text-ink-3">Slow units cleared in 4 wks</dt><dd className="num text-right text-ink">{units(r.cleared)} · {pct(r.clearedPct)} of at-risk</dd>
        <dt className="text-ink-3">Margin per bundle</dt><dd className="num text-right text-ink">{inr(r.marginBundle)}</dd>
        <dt className="text-ink-3">vs bestseller alone</dt><dd className="num text-right text-ink">{inr(r.marginAnchor)}</dd>
        <dt className="text-ink-3">Write-off avoided</dt><dd className="num text-right text-gain">{inrShort(r.writeOffSaved)}</dd>
      </dl>
      <div className="mt-4 flex items-end justify-between rounded-xl bg-paper-2/70 p-3">
        <span className="text-[12.5px] text-ink-2">Net impact over 4 weeks</span>
        <Money value={r.net} signed className={cn('text-[24px] font-semibold', r.net >= 0 ? 'text-gain' : 'text-loss')} />
      </div>
      <p className="mt-3 text-[12px] leading-snug text-ink-3">Most bundle buyers would have bought the {pair.anchor.line.toLowerCase()} anyway, so the discount is only worth it while it clears stock that would otherwise be written off.</p>
      <motion.button whileTap={{ scale: 0.98 }} onClick={create} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-[13px] font-medium text-paper">Create this bundle as a campaign <ArrowRight size={14} /></motion.button>
    </Card>
  )
}
