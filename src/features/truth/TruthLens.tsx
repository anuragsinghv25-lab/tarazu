import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, RotateCcw, TrendingUp } from 'lucide-react'
import { Card, Eyebrow, Money, PageHeader } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { useSeller, useTruth } from '@/state/hooks'
import { inrShort, pct, units } from '@/lib/format'
import { cn } from '@/lib/cn'

const LAYERS = [
  { key: 'subsidized', label: 'Would have sold anyway', sub: 'Full-price buyers who got the discount for free', color: '#b9ae98', text: '#4a453d' },
  { key: 'cannibalized', label: 'Stolen from your own products', sub: 'Bought this instead of your other SKUs', color: '#e7a487', text: '#8f2f12' },
  { key: 'pulledForward', label: 'Only bought earlier', sub: 'Pantry-loaded; next month\'s sales will dip', color: '#e9c77a', text: '#7a5414' },
  { key: 'incremental', label: 'Truly new sales', sub: 'The only part the sale actually created', color: '#2e7a57', text: '#ffffff' },
] as const

export function TruthLens() {
  const t = useTruth()
  const seller = useSeller()
  const [when, what] = t.label.split(' · ')
  const [params] = useSearchParams()
  // ?peel=5 opens fully peeled — handy for demos and story mode
  const [stage, setStage] = useState(() => Math.min(5, Number(params.get('peel')) || 0))
  const total = t.promoUnits
  const values: Record<(typeof LAYERS)[number]['key'], number> = {
    subsidized: t.subsidized, cannibalized: t.cannibalized, pulledForward: t.pulledForward, incremental: t.incremental,
  }
  const liftPct = t.promoUnits / t.baseUnits - 1
  const steps = [...t.steps].sort((a, b) => b.value - a.value)
  const maxAbs = Math.max(...steps.map((s) => Math.abs(s.value)), Math.abs(t.net))

  return (
    <div>
      <PageHeader eyebrow="Truth Lens" title={<>Most promotions look better<br />than they are.</>}>
        {when}: {seller.name} ran {what} for {seller.history.weeks} weeks. Here is the headline the dashboard showed, and what was underneath it.
      </PageHeader>

      <Spot id="truth-headline">
        <Card className="relative overflow-hidden bg-ink p-6 text-paper md:p-8">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brass-2/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[11px] font-medium tracking-[0.14em] text-paper/55 uppercase">{t.label}</div>
              <div className="mt-3 flex items-center gap-3">
                <TrendingUp className="text-brass-2" size={30} />
                <div className="display text-[44px] leading-none md:text-[56px]">Sales up {pct(liftPct)}</div>
              </div>
              <div className="num mt-3 text-[15px] text-paper/70">{units(t.promoUnits)} units sold vs {units(t.baseUnits)} expected · revenue +{inrShort(t.headlineRevenueGain)}</div>
            </div>
            {stage === 0 ? (
              <motion.button whileHover={{ y: 2 }} onClick={() => setStage(1)} className="flex items-center gap-2 self-start rounded-full bg-brass-2 px-5 py-2.5 text-[14px] font-semibold text-ink md:self-auto">
                Peel it apart <ChevronDown size={16} />
              </motion.button>
            ) : (
              <button onClick={() => setStage(0)} className="flex items-center gap-1.5 self-start text-[12.5px] text-paper/60 hover:text-paper md:self-auto"><RotateCcw size={13} /> Put the headline back</button>
            )}
          </div>
        </Card>
      </Spot>

      <AnimatePresence>
        {stage > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
            <Spot id="truth-peel" className="mt-6">
              <Card className="p-5 md:p-6">
                <Eyebrow>Layer by layer · {units(total)} promo units</Eyebrow>
                <div className="mt-4 flex h-16 overflow-hidden rounded-xl bg-paper-2">
                  {LAYERS.map((l, i) => (
                    <motion.div key={l.key} className="relative flex h-full items-center justify-center overflow-hidden"
                      style={{ background: l.color }}
                      initial={{ width: 0 }} animate={{ width: stage > i ? `${(values[l.key] / total) * 100}%` : 0 }}
                      transition={{ type: 'spring', stiffness: 90, damping: 18 }}>
                      <span className="num truncate px-1 text-[13px] font-semibold" style={{ color: l.text }}>{pct(values[l.key] / total)}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {LAYERS.map((l, i) => (
                    <motion.div key={l.key} animate={{ opacity: stage > i ? 1 : 0.28 }} className="rounded-xl border border-rule bg-card p-3">
                      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded" style={{ background: l.color }} /><span className="text-[12.5px] font-medium text-ink">{l.label}</span></div>
                      <div className="num mt-1.5 text-[22px] font-semibold text-ink">{units(values[l.key])}</div>
                      <div className="text-[11.5px] leading-snug text-ink-3">{l.sub}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className={cn('display text-[20px] leading-snug transition-opacity md:text-[24px]', stage >= 4 ? 'text-ink' : 'text-ink-3/40')}>
                    Only {units(t.incremental)} of {units(total)} units ({pct(t.incremental / total)}) were sales the discount actually created.
                  </p>
                  {stage < 5 && (
                    <button onClick={() => setStage((s) => Math.min(5, s + 1))} className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-paper">
                      {stage < 4 ? `Peel layer ${stage + 1} of 4` : 'Show me the money'} <ChevronDown size={15} />
                    </button>
                  )}
                </div>
              </Card>
            </Spot>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {stage >= 5 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <Spot id="truth-money">
                <Card className="p-5 md:p-6">
                  <Eyebrow>Where the money went</Eyebrow>
                  <ul className="mt-4 space-y-3">
                    {steps.map((s, i) => (
                      <li key={s.key} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 md:grid-cols-[230px_1fr_88px]">
                        <span className="text-[12.5px] text-ink-2">{s.label}</span>
                        <span className="num text-right text-[13px] font-semibold md:order-3" style={{ color: s.value >= 0 ? '#2e7a57' : '#c2421c' }}>{s.value >= 0 ? '+' : ''}{inrShort(s.value)}</span>
                        <div className="col-span-2 h-3 rounded-full bg-paper-2 md:order-2 md:col-span-1">
                          <motion.div className="h-full rounded-full" style={{ background: s.value >= 0 ? '#2e7a57' : '#c2421c' }}
                            initial={{ width: 0 }} animate={{ width: `${(Math.abs(s.value) / maxAbs) * 100}%` }} transition={{ delay: 0.15 + i * 0.12, type: 'spring', stiffness: 80, damping: 18 }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex items-end justify-between border-t border-ink pt-4">
                    <span className="display text-[20px] text-ink">Net result of the sale</span>
                    <Money value={t.net} signed className={cn('text-[34px] leading-none font-semibold', t.net >= 0 ? 'text-gain' : 'text-loss')} />
                  </div>
                </Card>
              </Spot>

              <Card className="border-beam flex flex-col p-5 md:p-6">
                <Eyebrow>Same festival, weighed by Tarazu</Eyebrow>
                <div className="display mt-2 text-[24px] leading-tight text-ink">Targeted offers on the stock that needed them. Full price on everything else.</div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-loss-soft p-3"><div className="text-[11px] text-loss">{what}</div><Money value={t.net} signed className="text-[22px] font-semibold text-loss" /></div>
                  <div className="rounded-xl bg-gain-soft p-3"><div className="text-[11px] text-gain">Tarazu's plan</div><Money value={t.planNet} signed className="text-[22px] font-semibold text-gain" /></div>
                </div>
                <p className="mt-auto pt-5 text-[13px] leading-relaxed text-ink-2">
                  That's <span className="num font-semibold text-ink">{inrShort(t.planNet - t.net)}</span> better, mostly by not discounting products people were buying anyway. Try raising pull-forward or price sensitivity in the Control Room.
                </p>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
