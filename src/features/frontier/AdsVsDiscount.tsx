import { useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Megaphone, Percent, Sparkles } from 'lucide-react'
import { Card, Eyebrow, Money, PageHeader, Slider } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { FRONTIER } from '@/data/frontier'
import { REACH } from '@/data/reach'
import { splitBudget, splitCurve } from '@/engine/frontier'
import { useSeller } from '@/state/hooks'
import { inrShort, pct, units } from '@/lib/format'
import { cn } from '@/lib/cn'

export function AdsVsDiscount() {
  const seller = useSeller()
  const F = FRONTIER[seller.id]
  const cac = REACH[seller.id].adsCac
  const [budget, setBudget] = useState(F.budget)
  const [depth, setDepth] = useState(0.15)
  const [share, setShare] = useState(0.5)
  const { pts, best } = useMemo(() => splitCurve(seller, F, cac, depth, budget), [seller, F, cac, depth, budget])
  const r = splitBudget(seller, F, cac, share, depth, budget)
  const data = pts.map((p) => ({ share: Math.round(p.share * 100), net: Math.round(p.net), ads: Math.round(p.adsNet), disc: Math.round(p.discNet) }))
  return (
    <div>
      <PageHeader eyebrow="Ads vs discount" title={<>The same rupee, spent<br /><span className="text-ink-3">two different ways.</span></>} aside={
        <div className="rounded-xl border border-rule bg-card p-3 text-[12.5px]">
          <div className="text-ink-3">Paid ads today</div>
          <div className="num text-[20px] font-semibold text-ink">{inrShort(cac)}</div>
          <div className="text-[11.5px] text-ink-3">per new buyer, at current spend</div>
        </div>
      }>
        A discount and an ad both cost money to win orders. Ads mostly find new people, and cost more per buyer as you spend more.
        Discounts mostly reach people who would have bought anyway, and get less efficient the wider they go. The best answer is usually a mix.
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Spot id="ads-curve">
          <Card className="h-full p-5">
            <Eyebrow>Net profit by split, {inrShort(budget)} a month</Eyebrow>
            <h3 className="display mt-1 text-[19px] text-ink">{best.net > 0 ? <>Best mix: {pct(best.share)} on ads, {pct(1 - best.share)} on discounts</> : <>At {inrShort(budget)}, every mix loses money</>}</h3>
            <div className="mt-3 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 14, bottom: 4, left: 8 }}>
                  <CartesianGrid stroke="var(--color-rule-2)" vertical={false} />
                  <XAxis dataKey="share" tick={{ fontSize: 11, fill: 'var(--color-ink-3)' }} tickFormatter={(v) => `${v}%`} label={{ value: 'Share of budget on ads', position: 'insideBottom', offset: -2, fontSize: 11, fill: 'var(--color-ink-3)' }} height={36} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-3)' }} tickFormatter={(v) => inrShort(v)} width={78} />
                  <ReferenceLine y={0} stroke="var(--color-rule)" />
                  <ReferenceLine x={Math.round(share * 100)} stroke="var(--color-brass-2)" strokeDasharray="3 3" />
                  <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-rule)', borderRadius: 10, fontSize: 12 }} labelFormatter={(v) => `${v}% on ads`} formatter={(v) => inrShort(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line dataKey="net" name="Total net" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  <Line dataKey="ads" name="From ads" stroke="var(--color-gain)" strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                  <Line dataKey="disc" name="From discounts" stroke="var(--color-warn)" strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                  <ReferenceDot x={Math.round(best.share * 100)} y={Math.round(best.net)} r={5} fill="var(--color-primary)" stroke="var(--color-card)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {best.net <= 0 && <p className="mt-2 rounded-lg bg-warn-soft/60 p-2.5 text-[12px] text-brass-ink">Margins this thin can't carry this much paid growth. Lower the budget: the first rupees of each are the most efficient.</p>}
          </Card>
        </Spot>
        <Card className="h-fit p-5">
          <Eyebrow>Settings</Eyebrow>
          <div className="mt-3 space-y-4 text-[12.5px]">
            <div><div className="flex justify-between"><span className="text-ink-2">Monthly budget</span><span className="num font-semibold text-ink">{inrShort(budget)}</span></div><Slider label="Budget" min={5000} max={F.budget * 2} step={5000} value={budget} onChange={setBudget} className="mt-1.5" /></div>
            <div><div className="flex justify-between"><span className="text-ink-2">On ads</span><span className="num font-semibold text-ink">{pct(share)}</span></div><Slider label="Ads share" min={0} max={1} step={0.05} value={share} onChange={setShare} className="mt-1.5" /></div>
            <div><div className="flex justify-between"><span className="text-ink-2">Discount depth</span><span className="num font-semibold text-ink">{pct(depth)}</span></div><Slider label="Depth" min={0.05} max={0.4} step={0.01} value={depth} onChange={setDepth} className="mt-1.5" /></div>
          </div>
          <button onClick={() => setShare(best.share)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-rule px-3 py-2 text-[12.5px] text-ink hover:border-primary"><Sparkles size={13} /> Use the best split ({pct(best.share)} ads)</button>
          <div className="mt-4 flex items-end justify-between rounded-xl bg-paper-2/70 p-3"><span className="text-[12.5px] leading-tight text-ink-2">Net, counting a year<br />of repeat orders</span><Money value={r.net} signed className={cn('text-[22px] font-semibold', r.net >= 0 ? 'text-gain' : 'text-loss')} /></div>
        </Card>

        <Spot id="ads-buys" className="xl:col-span-2">
          <div className="grid gap-5 md:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-center gap-2 text-gain"><Megaphone size={15} /><Eyebrow className="text-gain">{inrShort(r.ads)} on ads buys</Eyebrow></div>
              <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-[12.5px]">
                <dt className="text-ink-3">New buyers</dt><dd className="num text-right text-ink">{units(r.adsBuyers)}</dd>
                <dt className="text-ink-3">Cost per new buyer</dt><dd className="num text-right text-ink">{r.adsBuyers ? inrShort(r.ads / r.adsBuyers) : '—'}</dd>
                <dt className="text-ink-3">Repeat orders in a year</dt><dd className="num text-right text-ink">{units(r.adsBuyers * F.adsRepeat * 0.5)}</dd>
                <dt className="text-ink-3">Net over a year</dt><dd className={cn('num text-right font-semibold', r.adsNet >= 0 ? 'text-gain' : 'text-loss')}>{inrShort(r.adsNet)}</dd>
              </dl>
              <p className="mt-3 text-[12px] leading-snug text-ink-3">Each extra rupee of ads reaches a less interested buyer, so cost per buyer climbs with spend.</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 text-brass"><Percent size={15} /><Eyebrow className="text-brass">{inrShort(r.disc)} on discounts buys</Eyebrow></div>
              <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-[12.5px]">
                <dt className="text-ink-3">Orders using the discount</dt><dd className="num text-right text-ink">{units(r.discOrders)}</dd>
                <dt className="text-ink-3">Truly extra orders</dt><dd className="num text-right text-ink">{units(r.discIncremental)} <span className="text-ink-3">({r.discOrders ? pct(r.discIncremental / r.discOrders) : '0%'})</span></dd>
                <dt className="text-ink-3">New buyers</dt><dd className="num text-right text-ink">{units(r.discNew)}</dd>
                <dt className="text-ink-3">Net</dt><dd className={cn('num text-right font-semibold', r.discNet >= 0 ? 'text-gain' : 'text-loss')}>{inrShort(r.discNet)}</dd>
              </dl>
              <p className="mt-3 text-[12px] leading-snug text-ink-3">The rest of the discount went to orders that would have happened at full price, and teaches those buyers to wait for the next one.</p>
            </Card>
          </div>
        </Spot>
      </div>
    </div>
  )
}
