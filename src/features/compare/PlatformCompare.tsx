import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Trophy } from 'lucide-react'
import { Card, Chip, Eyebrow, Money, PageHeader, Segmented, Slider } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { useControls } from '@/state/hooks'
import { CHANNELS, simulate, feeFor } from '@/engine/engine'
import { getSku } from '@/data/meera'
import { inrShort, pct, units } from '@/lib/format'
import { cn } from '@/lib/cn'

const PICKS = [
  { id: 'mineral-sunscreen-spf-50-50-g', label: 'Sunscreen' },
  { id: 'beetroot-lip-balm-regular', label: 'Lip balm' },
  { id: 'vitamin-c-saffron-serum-30-ml', label: 'Vitamin C serum' },
  { id: 'diwali-glow-box-set', label: 'Diwali gift box' },
  { id: 'kumkumadi-glow-serum-30-ml', label: 'Bestselling serum' },
]

export function PlatformCompare() {
  const c = useControls()
  const [skuId, setSkuId] = useState(PICKS[0].id)
  const [d, setD] = useState(0.15)
  const [weeks, setWeeks] = useState(1)
  const s = getSku(skuId)!

  const rows = useMemo(() => CHANNELS.map((ch) => {
    const r = simulate(s, c, { discount: d, weeks, channel: ch })
    const f = feeFor(ch, c)
    const commission = r.promoUnits * r.promoPrice * (f.commission + f.payment)
    const shipping = r.promoUnits * f.shipSubsidy
    return { ch, f, r, commission, shipping }
  }), [s, c, d, weeks])
  const best = rows.reduce((a, b) => (b.r.net > a.r.net ? b : a))
  const maxAbs = Math.max(...rows.map((x) => Math.abs(x.r.net)), 1)

  return (
    <div>
      <PageHeader eyebrow="Platform compare" title="Same deal. Four very different profits.">
        A promotion is priced on every channel Meera sells on, with that channel's share of her buyers, its commission, deal fee and shipping. Fees are illustrative, not official rate cards.
      </PageHeader>

      <Card className="mb-6 p-5">
        <div className="grid gap-5 md:grid-cols-[1.2fr_1fr_auto] md:items-end">
          <div>
            <Eyebrow>Product</Eyebrow>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PICKS.map((p) => (
                <button key={p.id} onClick={() => setSkuId(p.id)} className={cn('rounded-full border px-3 py-1 text-[12.5px] transition-colors', skuId === p.id ? 'border-ink bg-ink text-paper' : 'border-rule bg-card text-ink-2 hover:text-ink')}>{p.label}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between"><Eyebrow>Discount</Eyebrow><span className="num text-[15px] font-semibold text-ink">{pct(d)}</span></div>
            <Slider label="Discount" min={0.05} max={0.6} step={0.01} value={d} onChange={setD} className="mt-2" />
          </div>
          <div>
            <Eyebrow>Deal length</Eyebrow>
            <Segmented<number> size="sm" className="mt-2" value={weeks} onChange={setWeeks} options={[{ value: 1, label: '1 wk' }, { value: 2, label: '2 wk' }]} />
          </div>
        </div>
        <div className="num mt-4 text-[12.5px] text-ink-3">{s.name} · ₹{s.price} → ₹{Math.round(s.price * (1 - d))} · cost ₹{s.cost}</div>
      </Card>

      <Spot id="compare-cards">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {rows.map((x, i) => {
            const win = x === best && x.r.net > 0
            return (
              <motion.div key={x.ch} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={cn('flex h-full flex-col p-5', win && 'border-beam border-brass/40')}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="display text-[22px] text-ink">{x.f.label}</div>
                      <div className="text-[11.5px] text-ink-3">{pct(x.f.share)} of Meera's buyers</div>
                    </div>
                    {win ? <Chip tone="brass"><Trophy size={11} /> Run it here</Chip> : x.r.net < 0 ? <Chip tone="loss">Loses money</Chip> : null}
                  </div>
                  <Money value={x.r.net} signed className={cn('mt-4 text-[34px] leading-none font-medium', x.r.net >= 0 ? 'text-gain' : 'text-loss')} />
                  <div className="mt-1 text-[11.5px] text-ink-3">net impact vs no deal</div>
                  <div className="mt-3 h-1.5 rounded-full bg-paper-2">
                    <motion.div className="h-full rounded-full" style={{ background: x.r.net >= 0 ? '#2e7a57' : '#c2421c' }} animate={{ width: `${(Math.abs(x.r.net) / maxAbs) * 100}%` }} />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-y-1.5 text-[12px]">
                    <dt className="text-ink-3">Units sold</dt><dd className="num text-right text-ink">{units(x.r.promoUnits)}</dd>
                    <dt className="text-ink-3">Revenue</dt><dd className="num text-right text-ink">{inrShort(x.r.revenue)}</dd>
                    <dt className="text-ink-3">Commission & payment</dt><dd className="num text-right text-loss">−{inrShort(x.commission)}</dd>
                    <dt className="text-ink-3">Deal fee</dt><dd className="num text-right text-loss">{x.r.dealFees ? `−${inrShort(x.r.dealFees)}` : '—'}</dd>
                    <dt className="text-ink-3">Free shipping you fund</dt><dd className="num text-right text-loss">{x.shipping ? `−${inrShort(x.shipping)}` : '—'}</dd>
                  </dl>
                  <p className="mt-auto pt-4 text-[11.5px] leading-snug text-ink-3">{x.f.note}</p>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </Spot>
      <p className="mt-5 max-w-3xl text-[13px] leading-relaxed text-ink-2">
        {best.r.net > 0
          ? <>Best channel for this deal: <b className="font-semibold text-ink">{best.f.label}</b>, netting {inrShort(best.r.net)}. Platform-run promotions are seller-funded: you pay the discount and the placement fee.</>
          : <>No channel makes this deal profitable at {pct(d)}. Try a shallower discount, or hold the price.</>}
      </p>
    </div>
  )
}
