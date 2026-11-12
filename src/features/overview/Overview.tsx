import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, ArrowUpRight, ScanSearch, Store } from 'lucide-react'
import { Card, Chip, Eyebrow, HEALTH_META, Money, PageHeader, Count } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { usePortfolio, useTruth } from '@/state/hooks'
import { seller } from '@/data/meera'
import { inrShort, pct } from '@/lib/format'
import type { Health } from '@/engine/types'

const ORDER: Health[] = ['at-risk', 'slow', 'healthy', 'fast']

export function Overview() {
  const p = usePortfolio()
  const t = useTruth()
  const actions = [...p.promos].sort((a, b) => b.result.net - a.result.net).slice(0, 6)
  const holds = p.recs.filter((r) => r.discount === 0 && r.sku.tags.includes('bestseller')).slice(0, 1)
  const riskCount = p.counts['at-risk'] + p.counts.slow

  return (
    <div>
      <PageHeader
        eyebrow={`Overview · ${seller.brand}, ${seller.city}`}
        title={<>Namaste, Meera.<br /><span className="text-ink-3">{inrShort(p.stuck)} is waiting in your godown.</span></>}
      >
        Here's where your money is before {seller.event}, and the few promotions worth running. Everything below is weighed after
        discounts, platform fees and the sales a deal only steals from your other products.
      </PageHeader>

      <Spot id="opportunity" className="mb-8">
        <Card className="border-beam overflow-hidden">
          <div className="grid divide-y divide-rule md:grid-cols-3 md:divide-x md:divide-y-0">
            <Kpi label="Stuck in risky stock" tone="loss" value={p.stuck} sub={`${riskCount} SKUs won't sell out in time at today's pace`} link={{ to: '/pulse', text: 'See Stock Pulse' }} />
            <Kpi label="Leaked last Diwali" tone="loss" value={t.net} sub={`"40% off everything" sold ${pct(t.promoUnits / t.baseUnits - 1)} more, then lost money`} link={{ to: '/truth', text: 'Open Truth Lens' }} />
            <Kpi label="Projected gain this season" tone="gain" value={p.gain} signed sub={`From ${p.promos.length} targeted promotions; ${p.holds} products stay at full price`} link={{ to: `/sku/${actions[0]?.sku.id ?? ''}`, text: 'Weigh the top deal' }} />
          </div>
        </Card>
      </Spot>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <Spot id="actions">
          <Card className="p-5">
            <div className="flex items-baseline justify-between">
              <div>
                <Eyebrow>Do these first</Eyebrow>
                <h2 className="display mt-1 text-[22px] text-ink">Top actions for {seller.event}</h2>
              </div>
              <Chip tone="brass">{p.promos.length} worth running</Chip>
            </div>
            <ul className="mt-4 divide-y divide-rule-2">
              {[...actions, ...holds].map((r, i) => {
                const m = HEALTH_META[r.health]
                return (
                  <motion.li key={r.sku.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Link to={`/sku/${r.sku.id}`} className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-paper-2/70">
                      <span className="num w-5 text-[12px] text-ink-3">{String(i + 1).padStart(2, '0')}</span>
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: m.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-[14px] font-medium text-ink">{r.sku.name}</span>
                          <Chip tone={r.discount === 0 ? 'gain' : 'ink'}>{r.mechanic}</Chip>
                        </div>
                        <div className="mt-0.5 line-clamp-1 text-[12.5px] text-ink-3">{r.why}</div>
                      </div>
                      <div className="text-right">
                        {r.discount === 0 ? <div className="text-[12.5px] font-medium text-gain">Protects margin</div> : <Money value={r.result.net} signed className="text-[15px] font-semibold text-gain" />}
                        <div className="num text-[11px] text-ink-3">{r.discount ? `${pct(r.discount)} · ${r.weeks} wks` : 'full price'}</div>
                      </div>
                      <ArrowUpRight size={15} className="text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </motion.li>
                )
              })}
            </ul>
          </Card>
        </Spot>

        <div className="space-y-6">
          <Spot id="health-bar">
            <Card className="p-5">
              <Eyebrow>Catalogue health · {p.recs.length} SKUs</Eyebrow>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full">
                {ORDER.map((h) => (
                  <motion.div key={h} layout className="h-full" style={{ background: HEALTH_META[h].color, opacity: h === 'healthy' ? 0.45 : 1 }} animate={{ width: `${(p.counts[h] / p.recs.length) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {ORDER.map((h) => (
                  <div key={h} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: HEALTH_META[h].color, opacity: h === 'healthy' ? 0.45 : 1 }} />
                    <span className="text-[12.5px] text-ink-2">{HEALTH_META[h].label}</span>
                    <Count value={p.counts[h]} className="ml-auto text-[13px] font-semibold text-ink" />
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-dashed border-rule pt-3 text-[12px] text-ink-3">
                Stock on hand at cost: <span className="num font-medium text-ink-2">{inrShort(p.stockValue)}</span>
              </div>
            </Card>
          </Spot>

          <TeaserCard to="/truth" icon={<ScanSearch size={18} />} eyebrow="Truth Lens" title="What last Diwali really earned" body={`The dashboard said +${pct(t.promoUnits / t.baseUnits - 1)} sales. Peel it and only ${pct(t.incremental / t.promoUnits)} of those units were truly new.`} />
          <TeaserCard to="/compare" icon={<Store size={18} />} eyebrow="Platform compare" title="Same deal, four very different profits" body="See which channel turns a sunscreen Lightning Deal into profit after commission and deal fees." />
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, tone, signed, link }: { label: string; value: number; sub: string; tone: 'gain' | 'loss'; signed?: boolean; link: { to: string; text: string } }) {
  return (
    <div className="flex flex-col p-6">
      <Eyebrow>{label}</Eyebrow>
      <Money value={value} signed={signed} className={`mt-2 text-[44px] leading-none font-medium tracking-[-0.03em] ${tone === 'gain' ? 'text-gain' : 'text-loss'}`} />
      <p className="mt-3 text-[13px] leading-snug text-ink-2">{sub}</p>
      <Link to={link.to} className="mt-auto inline-flex items-center gap-1 pt-4 text-[12.5px] font-medium text-ink hover:text-brass">{link.text} <ArrowRight size={13} /></Link>
    </div>
  )
}

function TeaserCard({ to, icon, eyebrow, title, body }: { to: string; icon: React.ReactNode; eyebrow: string; title: string; body: string }) {
  return (
    <Link to={to} className="group block">
      <Card className="p-5 transition-all group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-lift)]">
        <div className="flex items-center gap-2 text-brass">{icon}<Eyebrow className="text-brass">{eyebrow}</Eyebrow></div>
        <div className="display mt-2 text-[19px] leading-snug text-ink">{title}</div>
        <p className="mt-1.5 text-[13px] leading-snug text-ink-2">{body}</p>
      </Card>
    </Link>
  )
}
