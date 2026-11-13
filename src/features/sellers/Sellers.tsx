import { useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { ArrowRight, Wand2 } from 'lucide-react'
import { Card, Chip, Eyebrow, PageHeader } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { Avatar } from '@/layout/AppShell'
import { useStore } from '@/state/store'
import { SELLERS, controlsFor, type SellerDef, type SellerId } from '@/data/sellers'
import { portfolio, truthLens } from '@/engine/engine'
import { inrShort } from '@/lib/format'
import { cn } from '@/lib/cn'
import { ChannelLabel, channelFromLabel } from '@/brand/channels'
import { SELLER_BRANDS, SellerLogo } from '@/brand/sellers'

/** ● = featured in that seller's story, ○ = available in their data, — = not applicable. */
const COVERAGE: { concept: string; to: string; cells: Record<SellerId, '●' | '○' | '—'> }[] = [
  { concept: 'Discounts: % off, fixed ₹ off, TPR', to: '/campaigns', cells: { meera: '●', farhan: '●', kabir: '●', anaya: '●' } },
  { concept: 'Quantity mechanics: BOGO, multi-buy, tiered', to: '/sandbox', cells: { meera: '●', farhan: '●', kabir: '○', anaya: '●' } },
  { concept: 'Bundles and gift with purchase', to: '/bundles', cells: { meera: '●', farhan: '○', kabir: '●', anaya: '●' } },
  { concept: 'Coupons, influencer and leaked codes', to: '/sandbox', cells: { meera: '●', farhan: '○', kabir: '●', anaya: '○' } },
  { concept: 'Loyalty, referral, win-back', to: '/loyalty', cells: { meera: '●', farhan: '—', kabir: '○', anaya: '—' } },
  { concept: 'Cashback, bank offers, no-cost EMI', to: '/sandbox', cells: { meera: '○', farhan: '—', kabir: '●', anaya: '—' } },
  { concept: 'Flash and Lightning deals, platform fees', to: '/compare', cells: { meera: '○', farhan: '●', kabir: '●', anaya: '○' } },
  { concept: 'Funding: seller, platform, co-funded, trade', to: '/campaigns', cells: { meera: '○', farhan: '●', kabir: '●', anaya: '●' } },
  { concept: 'Markdowns: season end, expiry, model change', to: '/plan', cells: { meera: '●', farhan: '●', kabir: '●', anaya: '○' } },
  { concept: 'Campaigns, caps, budgets, stacking', to: '/campaigns', cells: { meera: '●', farhan: '○', kabir: '●', anaya: '○' } },
  { concept: 'Lift, cannibalization, halo, pull-forward', to: '/truth', cells: { meera: '●', farhan: '●', kabir: '●', anaya: '●' } },
  { concept: 'Stock health: sell-through, cover, ageing', to: '/pulse', cells: { meera: '●', farhan: '●', kabir: '●', anaya: '○' } },
  { concept: 'Promo fatigue, Hi-Lo vs EDLP', to: '/plan', cells: { meera: '○', farhan: '●', kabir: '○', anaya: '○' } },
  { concept: 'Returns eating promo profit', to: '/compare', cells: { meera: '—', farhan: '●', kabir: '●', anaya: '—' } },
  { concept: 'Trade terms: off-invoice, scan-based, slotting, deductions, gross-to-net', to: '/brand', cells: { meera: '—', farhan: '—', kabir: '—', anaya: '●' } },
]

export function Sellers() {
  const { setSeller, setQuiz } = useStore()
  const nav = useNavigate()
  const stats = useMemo(() => Object.fromEntries(SELLERS.map((s) => {
    const c = controlsFor(s)
    const p = portfolio(s.skus, c)
    return [s.id, { stuck: p.stuck, gain: p.gain, leaked: truthLens(s.skus, c, s.history).net }]
  })), [])
  const open = (id: SellerId, to = '/') => { setSeller(id); nav(to) }

  return (
    <div>
      <PageHeader eyebrow="Demo sellers" title={<>Four businesses.<br /><span className="text-ink-3">One engine weighing every offer.</span></>}
        aside={<button onClick={() => setQuiz(true)} className="flex items-center gap-2 self-start rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-paper md:self-auto"><Wand2 size={14} className="text-brass-2" /> Which seller are you?</button>}>
        Each seller has a different business model, so together they use every promotion concept Tarazu covers. Open any of them to see the same screens tell a different story.
      </PageHeader>

      <div className="grid gap-5 md:grid-cols-2">
        {SELLERS.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <TiltCard seller={s} stats={stats[s.id]} onOpen={() => open(s.id)} />
          </motion.div>
        ))}
      </div>

      <Spot id="coverage" className="mt-8">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-2 p-5 pb-3">
            <div>
              <Eyebrow>Coverage map</Eyebrow>
              <h2 className="display mt-1 text-[22px] text-ink">Every promotion concept, carried by at least one seller</h2>
            </div>
            <div className="text-[12px] text-ink-3">● featured in their story · ○ available in their data · — doesn't apply. Click a dot to open it.</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-y border-rule bg-paper-2/50 text-left">
                  <th className="px-5 py-2.5 font-medium text-ink-3">Concept group</th>
                  {SELLERS.map((s) => (
                    <th key={s.id} className="px-3 py-2.5 text-center font-medium text-ink"><span className="inline-flex items-center gap-1.5"><Avatar s={s} size={20} />{s.name}</span></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COVERAGE.map((r) => (
                  <tr key={r.concept} className="border-b border-rule-2 last:border-0 hover:bg-paper-2/40">
                    <td className="px-5 py-2.5 text-ink-2">{r.concept}</td>
                    {SELLERS.map((s) => {
                      const v = r.cells[s.id]
                      return (
                        <td key={s.id} className="px-3 py-2.5 text-center">
                          {v === '—' ? <span className="text-ink-3/60">—</span> : (
                            <button onClick={() => open(s.id, r.to)} title={`Open ${r.concept} as ${s.name}`}
                              className={cn('grid h-7 w-7 place-items-center rounded-full text-[15px] transition-all hover:scale-110 mx-auto', v === '●' ? 'text-brass hover:bg-brass-soft' : 'text-ink-3 hover:bg-paper-2')}>{v}</button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Spot>
    </div>
  )
}

function TiltCard({ seller: s, stats, onOpen }: { seller: SellerDef; stats: { stuck: number; gain: number; leaked: number }; onOpen: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0.5), my = useMotionValue(0.5)
  const rx = useSpring(useTransform(my, [0, 1], [5, -5]), { stiffness: 200, damping: 20 })
  const ry = useSpring(useTransform(mx, [0, 1], [-6, 6]), { stiffness: 200, damping: 20 })
  const glowX = useTransform(mx, (v) => `${v * 100}%`)
  const glowY = useTransform(my, (v) => `${v * 100}%`)
  const glow = useTransform([glowX, glowY] as never, ([x, y]: string[]) => `radial-gradient(420px circle at ${x} ${y}, rgba(245,158,11,0.16), transparent 55%)`)
  const b = SELLER_BRANDS[s.id]
  return (
    <motion.div ref={ref} style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width); my.set((e.clientY - r.top) / r.height) }}
      onMouseLeave={() => { mx.set(0.5); my.set(0.5) }}
      className="relative h-full overflow-hidden rounded-[var(--radius-card)] border border-rule bg-card p-6 shadow-[var(--shadow-card)]">
      <motion.div className="pointer-events-none absolute inset-0" style={{ background: glow }} />
      <div className="relative -mx-6 -mt-6 mb-1 border-b px-6 pt-6 pb-5" style={{ background: `linear-gradient(160deg, ${b.color.soft}, ${b.color.tint} 65%)`, borderColor: `${b.color.primary}1a` }}>
        <SellerLogo id={s.id} size="lg" descriptor />
        <div className="mt-3.5 text-[13px] text-ink-2">Run by <span className="font-semibold text-ink">{s.name}</span> · {s.city}</div>
      </div>
      <div className="relative mt-4 flex flex-wrap gap-1.5">{s.channels.map((c) => <Chip key={c}><ChannelLabel id={channelFromLabel(c) ?? ""} label={c} size={14} /></Chip>)}</div>
      <p className="relative mt-4 text-[13.5px] leading-relaxed text-ink">{s.problem}</p>
      <p className="relative mt-2 text-[12.5px] leading-relaxed text-ink-3">{s.pitch}</p>
      <div className="relative mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-paper-2/60 p-3 text-center">
        <div><div className="text-[10.5px] tracking-wider text-ink-3 uppercase">Stuck</div><div className="num mt-0.5 text-[16px] font-semibold text-loss">{inrShort(stats.stuck)}</div></div>
        <div><div className="text-[10.5px] tracking-wider text-ink-3 uppercase">Last sale</div><div className="num mt-0.5 text-[16px] font-semibold text-loss">{inrShort(stats.leaked)}</div></div>
        <div><div className="text-[10.5px] tracking-wider text-ink-3 uppercase">Tarazu gain</div><div className="num mt-0.5 text-[16px] font-semibold text-gain">+{inrShort(stats.gain)}</div></div>
      </div>
      <button onClick={onOpen} className="group relative mt-5 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-paper">
        View as {s.name} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </button>
    </motion.div>
  )
}
