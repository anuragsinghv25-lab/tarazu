import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Sparkles, Target, Wand2 } from 'lucide-react'
import { Card, Chip, Eyebrow, HEALTH_META, Money, PageHeader, Segmented, Slider, Count } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { ScaleVisual } from './ScaleVisual'
import { ProfitCurve } from './ProfitCurve'
import { useControls, useRec, useSeller } from '@/state/hooks'
import { simulate, curve, sweetSpot, weeksOfSupply, effStock, mechanicFor } from '@/engine/engine'
import type { ChannelOrBlend, Recommendation } from '@/engine/types'
import { inrShort, pct, units } from '@/lib/format'
import { cn } from '@/lib/cn'

export function SkuDetail() {
  const { id = '' } = useParams()
  const rec = useRec(id)
  if (!rec) return <Navigate to="/" replace />
  return <SkuInner key={id} rec={rec} />
}

function SkuInner({ rec }: { rec: Recommendation }) {
  const s = rec.sku
  const c = useControls()
  const seller = useSeller()
  const [d, setD] = useState(rec.discount)
  const [weeks, setWeeks] = useState(rec.weeks)
  const [channel, setChannel] = useState<ChannelOrBlend>('blended')

  const r = useMemo(() => simulate(s, c, { discount: d, weeks, channel }), [s, c, d, weeks, channel])
  const pts = useMemo(() => curve(s, c, weeks, channel), [s, c, weeks, channel])
  const { best, cliff } = sweetSpot(pts)
  const m = HEALTH_META[rec.health]
  const wos = weeksOfSupply(s, c)
  const belowFloor = d > rec.floorMaxDiscount + 1e-9

  return (
    <div>
      <PageHeader
        eyebrow={`The Scale · ${s.category}`}
        title={s.name}
      >
        <span className="flex flex-wrap items-center gap-2">
          <Chip tone={m.tone}>{m.label}</Chip>
          <span className="num text-[13px]">₹{s.price} · cost ₹{s.cost} · {units(effStock(s, c))} in stock · {wos.toFixed(1)} weeks of cover{s.expiryWeeks ? ` · expires in ${s.expiryWeeks} weeks` : ''}</span>
        </span>
      </PageHeader>
      <div className="-mt-2 mb-6 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11.5px] text-ink-3">{seller.name}'s story products:</span>
            {seller.story.map(({ id: k, label }) => (
              <Link key={k} to={`/sku/${k}`} className={cn('rounded-full border px-2.5 py-1 text-[11.5px] transition-colors', k === s.id ? 'border-primary bg-primary text-paper' : 'border-rule bg-card text-ink-2 hover:border-ink-3/40')}>
                {label}
              </Link>
            ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <Card className="ledger overflow-hidden p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow>Weigh this discount</Eyebrow>
              <div className="mt-1 text-[13px] text-ink-2">{mechanicFor(s, rec.health, d)} at <span className="num font-semibold text-ink">{pct(d)}</span> for {weeks} weeks · ₹{Math.round(r.promoPrice)} each</div>
            </div>
            <div className="text-right">
              <Eyebrow>Net impact</Eyebrow>
              <Money value={r.net} signed className={cn('mt-0.5 text-[34px] leading-none font-medium', r.net >= 0 ? 'text-gain' : 'text-loss')} />
            </div>
          </div>

          <Spot id="scale" className="mt-2">
            <ScaleVisual given={r.given} earned={r.earned} />
            <div className="-mt-3 grid grid-cols-2 gap-4 px-2">
              <PanLedger title="Given away" tone="loss" total={r.given} rows={[
                ['Discount to buyers who\'d pay full price', r.subsidyCost],
                ['Sales stolen from your other products', r.cannibalCost],
                ['Future sales pulled forward', r.pullForwardCost],
                ['Deal fees', r.dealFees],
                ...(r.returnsCost > 1 ? [['Returns on extra orders', r.returnsCost] as [string, number]] : []),
              ]} />
              <PanLedger title="Earned" tone="gain" total={r.earned} align="right" rows={[
                ['Profit on extra units', r.liftProfit],
                ['Halo on other products', r.haloProfit],
                ['Old stock saved from write-off', r.writeOffSaved],
              ]} />
            </div>
          </Spot>

          <Spot id="discount-slider" className="mt-6">
            <div className="rounded-2xl border border-rule bg-card/80 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium text-ink">Discount</span>
                <span className={cn('num text-[20px] font-semibold', belowFloor ? 'text-loss' : 'text-ink')}>{pct(d)}</span>
              </div>
              <Slider label="Discount" min={0} max={0.6} step={0.01} value={d} onChange={setD} className="mt-2" />
              <div className="num mt-1 flex justify-between text-[10.5px] text-ink-3"><span>0%</span><span>30%</span><span>60%</span></div>
              {belowFloor && <div className="mt-2 text-[12px] text-loss">Below your {pct(c.marginFloor)} margin floor: gross margin at this price is {pct(r.grossMarginPct)}.</div>}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Segmented<number> size="sm" value={weeks} onChange={setWeeks} options={[1, 2, 3, 4].map((w) => ({ value: w, label: `${w} wk` }))} />
                <Segmented<ChannelOrBlend> size="sm" value={channel} onChange={setChannel} options={[
                  { value: 'blended', label: 'All' }, ...Object.entries(c.market.channels).map(([k, f]) => ({ value: k, label: f.label.replace('Own website', 'Website').replace('Kiranas via distributor', 'Kiranas') })),
                ]} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => setD(best.d)} className="inline-flex items-center gap-1.5 rounded-full border border-brass/40 bg-brass-soft px-3 py-1.5 text-[12px] font-medium text-[var(--color-brass-ink)] hover:bg-brass-soft/70"><Target size={13} /> Sweet spot · {pct(best.d)}</button>
                <button onClick={() => { setD(rec.discount); setWeeks(rec.weeks); setChannel('blended') }} className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-card px-3 py-1.5 text-[12px] font-medium text-ink-2 hover:text-ink"><Wand2 size={13} /> Tarazu's pick</button>
                <button onClick={() => setD(0.4)} className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-card px-3 py-1.5 text-[12px] text-ink-3 hover:text-ink">Try "40% off"</button>
              </div>
            </div>
          </Spot>
        </Card>

        <div className="space-y-6">
          <Spot id="why">
            <Card className="relative overflow-hidden p-5">
              <div className="flex items-center gap-2 text-brass"><Sparkles size={15} /><Eyebrow className="text-brass">Why this?</Eyebrow></div>
              <div className="display mt-2 text-[22px] leading-tight text-ink">{rec.mechanic}{rec.discount ? ` · ${pct(rec.discount)}` : ''}</div>
              <div className="mt-2 flex items-center gap-2">
                <Chip tone={rec.confidence === 'high' ? 'gain' : rec.confidence === 'medium' ? 'warn' : 'loss'}>{rec.confidence} confidence</Chip>
                <span className="text-[11.5px] text-ink-3">{rec.confidenceWhy}</span>
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{rec.why}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-dashed border-rule pt-3 text-center">
                <Stat label="Sweet spot" value={pct(best.d)} />
                <Stat label="Profit cliff" value={cliff === null ? 'none' : cliff <= 0.01 ? 'any %' : pct(cliff)} tone={cliff !== null ? 'loss' : undefined} />
                <Stat label="Floor cap" value={pct(Math.min(0.6, rec.floorMaxDiscount))} />
              </div>
            </Card>
          </Spot>

          <Card className="p-5">
            <Eyebrow>What happens in {weeks} weeks</Eyebrow>
            <div className="mt-3 space-y-3">
              <UnitsBar label="Would sell anyway" value={r.baseUnits} max={Math.max(r.promoUnits, 1)} color="var(--color-ink-4)" />
              <UnitsBar label="Sell with this offer" value={r.promoUnits} max={Math.max(r.promoUnits, 1)} color="var(--color-primary)" />
              <UnitsBar label="Truly new buyers" value={r.incremental} max={Math.max(r.promoUnits, 1)} color="var(--color-gain)" />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-y-2 border-t border-dashed border-rule pt-3 text-[12.5px]">
              <dt className="text-ink-3">Stock cleared</dt><dd className="num text-right text-ink">{pct(r.stockClearedPct)}</dd>
              <dt className="text-ink-3">Revenue</dt><dd className="num text-right text-ink">{inrShort(r.revenue)}</dd>
              <dt className="text-ink-3">Gross margin at offer price</dt><dd className={cn('num text-right', r.grossMarginPct < c.marginFloor ? 'text-loss' : 'text-ink')}>{pct(r.grossMarginPct)}</dd>
            </dl>
          </Card>
        </div>
      </div>

      <Spot id="curve" className="mt-6">
        <Card className="p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <Eyebrow>Profit curve</Eyebrow>
              <h2 className="display mt-1 text-[20px] text-ink">Net impact at every discount from 0% to 60%</h2>
            </div>
            <span className="text-[12px] text-ink-3">Click anywhere on the curve to set the discount</span>
          </div>
          <ProfitCurve pts={pts} current={d} sweet={best.d} cliff={cliff} floorMax={rec.floorMaxDiscount} onPick={setD} />
        </Card>
      </Spot>
    </div>
  )
}

function PanLedger({ title, tone, total, rows, align }: { title: string; tone: 'gain' | 'loss'; total: number; rows: [string, number][]; align?: 'right' }) {
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <div className={cn('text-[11px] font-semibold tracking-[0.12em] uppercase', tone === 'gain' ? 'text-gain' : 'text-loss')}>{title}</div>
      <Money value={total} className={cn('text-[24px] font-medium', tone === 'gain' ? 'text-gain' : 'text-loss')} />
      <ul className="mt-1.5 space-y-1">
        {rows.map(([k, v]) => (
          <li key={k} className={cn('flex gap-2 text-[11.5px] leading-snug text-ink-3', align === 'right' && 'flex-row-reverse')}>
            <span className="num shrink-0 text-ink-2">{inrShort(v)}</span><span>{k}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'loss' }) {
  return (
    <div>
      <div className="text-[10.5px] tracking-wider text-ink-3 uppercase">{label}</div>
      <div className={cn('num mt-0.5 text-[16px] font-semibold', tone === 'loss' ? 'text-loss' : 'text-ink')}>{value}</div>
    </div>
  )
}

function UnitsBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[12px]"><span className="text-ink-2">{label}</span><Count value={Math.round(value)} suffix=" units" className="text-ink" /></div>
      <div className="mt-1 h-2 rounded-full bg-paper-2">
        <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${(value / max) * 100}%` }} transition={{ type: 'spring', stiffness: 140, damping: 20 }} />
      </div>
    </div>
  )
}

