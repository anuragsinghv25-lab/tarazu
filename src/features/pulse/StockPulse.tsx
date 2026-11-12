import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Card, Chip, Eyebrow, HEALTH_META, PageHeader, Segmented, Money } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { usePortfolio, useControls } from '@/state/hooks'
import { weeksOfSupply, unitsAtRisk, effStock, baselineWeekly } from '@/engine/engine'
import type { Health, Recommendation } from '@/engine/types'
import { units, pct } from '@/lib/format'
import { cn } from '@/lib/cn'

const ORDER: Health[] = ['at-risk', 'slow', 'healthy', 'fast']
type Filter = 'all' | Health

export function StockPulse() {
  const p = usePortfolio()
  const c = useControls()
  const nav = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const [cat, setCat] = useState('All')
  const [hover, setHover] = useState<Recommendation | null>(null)
  const cats = useMemo(() => ['All', ...new Set(p.recs.map((r) => r.sku.category))], [p.recs])

  const sorted = useMemo(() => {
    const rank = (h: Health) => ORDER.indexOf(h)
    return [...p.recs].sort((a, b) => rank(a.health) - rank(b.health) || weeksOfSupply(b.sku, c) - weeksOfSupply(a.sku, c))
  }, [p.recs, c])
  const shown = sorted.filter((r) => (filter === 'all' || r.health === filter) && (cat === 'All' || r.sku.category === cat))
  const value = (h: Health) => p.recs.filter((r) => r.health === h).reduce((a, r) => a + unitsAtRisk(r.sku, c) * r.sku.cost, 0)

  return (
    <div>
      <PageHeader eyebrow="Stock Pulse" title="Every product, one heartbeat.">
        Each tile is a SKU. Colour shows its health; the faster it breathes, the more money is at risk. The number is weeks of stock left at today's pace.
      </PageHeader>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {ORDER.map((h) => {
          const m = HEALTH_META[h]
          const on = filter === h
          return (
            <button key={h} onClick={() => setFilter(on ? 'all' : h)} className={cn('rounded-2xl border p-3.5 text-left transition-all', on ? 'border-ink bg-card shadow-[var(--shadow-card)]' : 'border-rule bg-card/60 hover:bg-card')}>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                <span className="text-[12.5px] font-medium text-ink-2">{m.label}</span>
                <span className="num ml-auto text-[18px] font-semibold text-ink">{p.counts[h]}</span>
              </div>
              <div className="mt-1 text-[11.5px] text-ink-3">
                {h === 'at-risk' || h === 'slow' ? <><Money value={value(h)} className="font-medium text-ink-2" /> won't sell in time</> : h === 'fast' ? 'Under 5 weeks of cover' : 'Selling on plan'}
              </div>
            </button>
          )
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented<Filter> size="sm" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, ...ORDER.map((h) => ({ value: h, label: HEALTH_META[h].label }))]} />
        <div className="flex gap-1 overflow-x-auto">
          {cats.map((k) => (
            <button key={k} onClick={() => setCat(k)} className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11.5px] transition-colors', cat === k ? 'bg-ink text-paper' : 'text-ink-3 hover:text-ink')}>{k}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <Spot id="pulse-grid">
          <Card className="p-4">
            <motion.div layout className="grid grid-cols-[repeat(auto-fill,minmax(78px,1fr))] gap-2">
              <AnimatePresence mode="popLayout">
                {shown.map((r) => {
                  const m = HEALTH_META[r.health]
                  const wos = weeksOfSupply(r.sku, c)
                  const breathe = r.health === 'at-risk' || r.health === 'slow'
                  return (
                    <motion.button
                      layout key={r.sku.id}
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                      onMouseEnter={() => setHover(r)} onFocus={() => setHover(r)}
                      onClick={() => nav(`/sku/${r.sku.id}`)}
                      className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-xl border p-2 text-left transition-shadow hover:z-10 hover:shadow-[var(--shadow-lift)]"
                      style={{ background: m.soft, borderColor: `${m.color}33` }}
                      aria-label={`${r.sku.name}, ${m.label}, ${wos.toFixed(1)} weeks of stock`}
                    >
                      <span className="leading-tight"><span className="line-clamp-2 text-[10px] text-ink-2">{r.sku.line}</span>{r.sku.variant !== 'regular' && r.sku.variant !== 'set' && r.sku.variant !== 'single' && <span className="block truncate text-[9px] text-ink-3">{r.sku.variant}</span>}</span>
                      <span className="flex items-end justify-between">
                        <span className="num text-[17px] leading-none font-semibold" style={{ color: r.health === 'healthy' ? '#4a453d' : m.color }}>{wos >= 99 ? '99+' : wos.toFixed(wos < 10 ? 1 : 0)}</span>
                        {breathe && <span className="mb-0.5 h-2 w-2 animate-breathe rounded-full" style={{ background: m.color, ['--breathe' as string]: m.speed }} />}
                      </span>
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </motion.div>
            {shown.length === 0 && <div className="py-10 text-center text-[13px] text-ink-3">No products in this slice.</div>}
          </Card>
        </Spot>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <Inspector r={hover ?? shown[0] ?? null} />
        </div>
      </div>
    </div>
  )
}

function Inspector({ r }: { r: Recommendation | null }) {
  const c = useControls()
  const nav = useNavigate()
  if (!r) return null
  const m = HEALTH_META[r.health]
  const stock = effStock(r.sku, c)
  const base = baselineWeekly(r.sku, c)
  const wos = weeksOfSupply(r.sku, c)
  const window = r.sku.sellWindowWeeks
  return (
    <Card className="p-4">
      <Eyebrow>Inspector</Eyebrow>
      <div className="display mt-1.5 text-[19px] leading-snug text-ink">{r.sku.name}</div>
      <div className="mt-1 flex flex-wrap gap-1.5"><Chip tone={m.tone}>{m.label}</Chip><Chip>{r.sku.category}</Chip></div>
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-[11.5px] text-ink-3"><span>Stock cover</span><span>Sell window {window} wks</span></div>
        <div className="relative h-2.5 rounded-full bg-paper-2">
          <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: m.color }} animate={{ width: `${Math.min(100, (wos / (window * 2)) * 100)}%` }} />
          <div className="absolute inset-y-[-3px] w-px bg-ink" style={{ left: '50%' }} />
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-y-2.5 text-[12.5px]">
        <dt className="text-ink-3">On hand</dt><dd className="num text-right text-ink">{units(stock)} units</dd>
        <dt className="text-ink-3">Selling</dt><dd className="num text-right text-ink">{base.toFixed(1)} / week</dd>
        <dt className="text-ink-3">Weeks of supply</dt><dd className="num text-right text-ink">{wos.toFixed(1)}</dd>
        <dt className="text-ink-3">Age</dt><dd className="num text-right text-ink">{r.sku.ageWeeks} weeks</dd>
        {r.sku.expiryWeeks && <><dt className="text-ink-3">Expires in</dt><dd className="num text-right text-loss">{r.sku.expiryWeeks} weeks</dd></>}
        <dt className="text-ink-3">Won't sell in time</dt><dd className="num text-right text-ink">{units(unitsAtRisk(r.sku, c))} units</dd>
      </dl>
      <div className="mt-4 rounded-xl bg-paper-2/70 p-3">
        <div className="text-[11px] font-semibold tracking-wider text-ink-3 uppercase">Tarazu suggests</div>
        <div className="mt-1 text-[13px] font-medium text-ink">{r.mechanic}{r.discount ? ` · ${pct(r.discount)}` : ''}</div>
        <div className="mt-1 text-[12px] leading-snug text-ink-2">{r.why}</div>
      </div>
      <button onClick={() => nav(`/sku/${r.sku.id}`)} className="mt-3 w-full rounded-full bg-ink py-2 text-[12.5px] font-medium text-paper hover:bg-ink-2">Weigh it on the Scale</button>
    </Card>
  )
}
