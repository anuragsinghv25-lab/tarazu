import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { AlertTriangle, Network } from 'lucide-react'
import { Card, Eyebrow, Money, PageHeader, Slider } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { FRONTIER } from '@/data/frontier'
import { ondcFit, ondcWeek, ONDC_DEFAULT, type OndcSettings } from '@/engine/frontier'
import { useControls, useSeller } from '@/state/hooks'
import { inrShort, pct, units } from '@/lib/format'
import { cn } from '@/lib/cn'

export function Ondc() {
  const seller = useSeller(), c = useControls()
  const O = FRONTIER[seller.id].ondc
  const [set, setSet] = useState<OndcSettings>(ONDC_DEFAULT)
  const w = useMemo(() => ondcWeek(seller, c, O, set), [seller, c, O, set])
  const fit = useMemo(() => ondcFit(seller, c, O, set), [seller, c, O, set])
  const cost = w.price - w.mktNet - w.mktFees
  const cols = [
    { label: w.label, price: w.price, fees: w.mktFees - O.logistics, ship: O.logistics, net: w.mktNet },
    { label: 'ONDC', price: w.ondcPrice, fees: w.ondcFees - O.logistics, ship: O.logistics, net: w.ondcNet },
  ]
  const top = Math.max(...cols.map((x) => x.price))
  const S = (k: keyof OndcSettings) => (v: number) => setSet({ ...set, [k]: v })
  return (
    <div>
      <PageHeader eyebrow="ONDC as a channel" title={<>An open network,<br /><span className="text-ink-3">with thinner fees.</span></>} aside={
        <div className="max-w-[280px] rounded-xl border border-rule bg-card p-3 text-[12px] text-ink-2">
          <div className="mb-1 flex items-center gap-1.5 text-ink-3"><Network size={13} /> How ONDC works</div>
          The seller lists once through a seller app. Any buyer app on the network (Paytm, Magicpin and others) can show and sell it. Each app takes a small fee instead of one marketplace's commission.
        </div>
      }>
        ONDC, the Open Network for Digital Commerce, lets buyer apps sell a seller's catalogue without the seller joining each one.
        For promotions, two things change: fees are lower, so the same discount costs less margin, and buyer apps sometimes fund discounts of their own.
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Spot id="ondc-order">
          <Card className="h-full p-5">
            <Eyebrow>One {inrShort(w.price)} order</Eyebrow>
            <h3 className="display mt-1 text-[19px] text-ink">{w.ondcNet >= w.mktNet ? <>ONDC keeps {inrShort(w.ondcNet - w.mktNet)} more per order than {w.label}</> : <>{w.label} keeps {inrShort(w.mktNet - w.ondcNet)} more per order</>}</h3>
            <div className="mt-5 space-y-4">
              {cols.map((x, i) => (
                <div key={x.label}>
                  <div className="mb-1 flex justify-between text-[12.5px]"><span className="text-ink">{x.label}{i === 1 && w.cut > 0 ? <span className="text-ink-3"> · price {inrShort(x.price)}</span> : null}</span><Money value={x.net} className="font-semibold text-ink" /></div>
                  <div className="flex h-7 overflow-hidden rounded-lg bg-paper-2 text-[11px]" style={{ width: `${(x.price / top) * 100}%` }}>
                    {[{ v: cost, tone: 'bg-ink-3/60', l: 'Product cost' }, { v: x.fees, tone: 'bg-loss/75', l: 'Fees' }, { v: x.ship, tone: 'bg-warn/80', l: 'Shipping' }, { v: x.net, tone: 'bg-gain', l: 'You keep' }].map((p) => (
                      <motion.span key={p.l} title={`${p.l}: ${inrShort(p.v)}`} className={cn('flex items-center justify-center overflow-hidden whitespace-nowrap text-white', p.tone)} animate={{ width: `${(Math.max(0, p.v) / x.price) * 100}%` }}>{p.v / x.price > 0.12 ? inrShort(p.v) : ''}</motion.span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[11.5px] text-ink-3">{[['bg-ink-3/60', 'Product cost'], ['bg-loss/75', 'Platform and app fees'], ['bg-warn/80', 'Shipping'], ['bg-gain', 'You keep']].map(([t, l]) => <span key={l} className="flex items-center gap-1.5"><span className={cn('h-2 w-2 rounded-full', t)} />{l}</span>)}</div>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-1 border-t border-dashed border-rule pt-3 text-[12.5px] sm:grid-cols-4">
              <div><dt className="text-ink-3">ONDC orders a week</dt><dd className="num text-[16px] font-semibold text-ink">{units(w.orders)}</dd></div>
              <div><dt className="text-ink-3">Net a week</dt><dd><Money value={w.net} className="text-[16px] font-semibold text-gain" /></dd></div>
              <div><dt className="text-ink-3">Fees per order</dt><dd className="num text-[16px] font-semibold text-ink">{inrShort(w.ondcFees - O.logistics)} <span className="text-[12px] font-normal text-ink-3">vs {inrShort(w.mktFees - O.logistics)}</span></dd></div>
              <div><dt className="text-ink-3">A 10% discount costs</dt><dd className="num text-[16px] font-semibold text-ink">{pct(w.price * 0.1 / Math.max(1, w.ondcNet))} <span className="text-[12px] font-normal text-ink-3">of margin vs {pct(w.price * 0.1 / Math.max(1, w.mktNet))}</span></dd></div>
            </dl>
            <p className="mt-3 text-[11.5px] text-ink-3">{O.fit} Order volume is an estimate; fee rates vary by buyer app and seller app and are illustrative, not quoted.</p>
          </Card>
        </Spot>
        <Spot id="ondc-settings">
          <Card className="h-fit p-5">
            <Eyebrow>Network settings</Eyebrow>
            <div className="mt-3 space-y-4 text-[12.5px]">
              <div><div className="flex justify-between"><span className="text-ink-2">Buyer app fee</span><span className="num font-semibold text-ink">{pct(set.buyerFee, 1)}</span></div><Slider label="Buyer app fee" min={0} max={0.08} step={0.005} value={set.buyerFee} onChange={S('buyerFee')} className="mt-1.5" /></div>
              <div><div className="flex justify-between"><span className="text-ink-2">Seller app fee</span><span className="num font-semibold text-ink">{pct(set.sellerFee, 1)}</span></div><Slider label="Seller app fee" min={0} max={0.06} step={0.005} value={set.sellerFee} onChange={S('sellerFee')} className="mt-1.5" /></div>
              <div><div className="flex justify-between"><span className="text-ink-2">Network-funded discount</span><span className="num font-semibold text-ink">{inrShort(set.incentive)}</span></div><Slider label="Network incentive" min={0} max={100} step={10} value={set.incentive} onChange={S('incentive')} className="mt-1.5" /></div>
              <div><div className="flex justify-between"><span className="text-ink-2">Pass fee savings to buyers</span><span className="num font-semibold text-ink">{pct(set.passThrough)}</span></div><Slider label="Pass-through" min={0} max={1} step={0.05} value={set.passThrough} onChange={S('passThrough')} className="mt-1.5" /></div>
            </div>
            {set.passThrough > 0 && <p className="mt-3 flex gap-1.5 rounded-lg bg-warn-soft/60 p-2.5 text-[12px] text-brass-ink"><AlertTriangle size={13} className="mt-0.5 shrink-0" /> Marketplaces watch prices elsewhere. A lower ONDC price can cost the featured offer on a marketplace listing.</p>}
            <p className="mt-3 text-[11.5px] leading-snug text-ink-3">Network and buyer-app incentives change often and have been capped per order. The government's MSME TEAM scheme pays seller apps to onboard small sellers until 31 March 2027.</p>
          </Card>
        </Spot>

        <Spot id="ondc-fit" className="xl:col-span-2">
          <Card className="p-5">
            <Eyebrow>Where ONDC helps most</Eyebrow>
            <h3 className="display mt-1 text-[19px] text-ink">Products that keep the most extra margin</h3>
            {fit.length === 0 && <p className="mt-3 text-[12.5px] text-ink-3">No single product makes money on its own once shipping is paid. ONDC only works here for multi-item orders.</p>}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[620px] text-[12.5px]">
                <thead className="text-left text-ink-3"><tr className="border-b border-rule"><th className="py-2 pr-2 font-medium">Product</th><th className="px-2 py-2 text-right font-medium">Price</th><th className="px-2 py-2 text-right font-medium">Keep on {w.label}</th><th className="px-2 py-2 text-right font-medium">Keep on ONDC</th><th className="py-2 pl-2 text-right font-medium">Extra per unit</th></tr></thead>
                <tbody>
                  {fit.map((f) => (
                    <tr key={f.sku.id} className="border-b border-rule-2">
                      <td className="py-2 pr-2 text-ink">{f.sku.line} {f.sku.variant}<span className="block text-[11px] text-ink-3">{f.sku.category}</span></td>
                      <td className="num px-2 py-2 text-right text-ink-2">{inrShort(f.sku.price)}</td>
                      <td className={cn('num px-2 py-2 text-right', f.mktNet < 0 ? 'text-loss' : 'text-ink-2')}>{inrShort(f.mktNet)}</td>
                      <td className="num px-2 py-2 text-right text-ink">{inrShort(f.ondcNet)}</td>
                      <td className="num py-2 pl-2 text-right font-semibold text-gain">+{inrShort(f.gain)} <span className="font-normal text-ink-3">({pct(f.gainPct)})</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11.5px] text-ink-3">Single-unit orders. Shipping is assumed the same on both channels; on ONDC the seller books it through the seller app or a logistics partner on the network.</p>
          </Card>
        </Spot>
      </div>
    </div>
  )
}
