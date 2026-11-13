import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, CalendarClock, PackageCheck, Repeat, ShieldCheck } from 'lucide-react'
import { Card, Chip, Eyebrow, Money, PageHeader, Segmented, Slider, Switch } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { FRONTIER } from '@/data/frontier'
import { PAYMENT, preorderSim, priceProtection, subscribeSim, type Payment } from '@/engine/frontier'
import { useControls, useSeller } from '@/state/hooks'
import { inrShort, pct, units } from '@/lib/format'
import { cn } from '@/lib/cn'

type Tab = 'subscribe' | 'preorder' | 'protect'
const TABS: Tab[] = ['subscribe', 'preorder', 'protect']

export function Commitments() {
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(() => { const t = params.get('tab') as Tab; return TABS.includes(t) ? t : 'subscribe' })
  return (
    <div>
      <PageHeader eyebrow="Subscribe, pre-order, protect" title={<>Offers that ask for<br /><span className="text-ink-3">a commitment back.</span></>}>
        A plain discount gives margin away and asks for nothing. These three trade a benefit for something the seller needs: repeat orders,
        an early read on demand, or a buyer who stops waiting for the sale.
      </PageHeader>
      <Segmented<Tab> value={tab} onChange={(t) => { setTab(t); setParams(t === 'subscribe' ? {} : { tab: t }, { replace: true }) }} options={[{ value: 'subscribe', label: 'Subscribe and save' }, { value: 'preorder', label: 'Pre-orders' }, { value: 'protect', label: 'Price-drop protection' }]} className="mb-5" />
      {tab === 'subscribe' && <Subscribe />}
      {tab === 'preorder' && <Preorder />}
      {tab === 'protect' && <Protect />}
    </div>
  )
}

function Subscribe() {
  const seller = useSeller()
  const sub = FRONTIER[seller.id].subscription
  const [d, setD] = useState(0.1)
  const r = useMemo(() => subscribeSim(sub, seller, d), [sub, seller, d])
  if (!r) return (
    <Spot id="subscribe">
      <Card className="max-w-2xl p-6">
        <Chip tone="quiet">Not a fit</Chip>
        <h3 className="display mt-2 text-[21px] text-ink">Subscribe and save doesn't suit {seller.brand}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{sub.why} A subscription discount here would only reward a few loyal buyers for orders they'd place anyway. Pre-orders for new collections fit better.</p>
      </Card>
    </Spot>
  )
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <Spot id="subscribe">
        <Card className="h-full p-5">
          <div className="flex flex-wrap items-center gap-2"><Eyebrow>{sub.category} · every {sub.cycleDays} days · {sub.where}</Eyebrow><Chip tone={sub.fit === 'strong' ? 'gain' : 'warn'}>{sub.fit === 'strong' ? 'Strong fit' : 'Some fit'}</Chip></div>
          <h3 className="display mt-1 text-[19px] text-ink">One month's subscribers, followed for a year</h3>
          <div className="mt-3 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={r.series} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="var(--color-rule-2)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-ink-3)' }} tickFormatter={(v) => `M${v}`} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-3)' }} width={44} />
                <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-rule)', borderRadius: 10, fontSize: 12 }} labelFormatter={(v) => `Month ${v}`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line dataKey="sub" name="Still subscribed" stroke="var(--color-gain)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                <Line dataKey="base" name="Same buyers, still ordering without it" stroke="var(--color-ink-3)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[12.5px] sm:grid-cols-4">
            <div><dt className="text-ink-3">Sign up</dt><dd className="num text-[16px] font-semibold text-ink">{units(r.N)} <span className="text-[12px] font-normal text-ink-3">({pct(r.uptake)})</span></dd></div>
            <div><dt className="text-ink-3">Cancel each month</dt><dd className="num text-[16px] font-semibold text-ink">{pct(r.churn)}</dd></div>
            <div><dt className="text-ink-3">Orders in a year</dt><dd className="num text-[16px] font-semibold text-ink">{units(r.subOrders)} <span className="text-[12px] font-normal text-ink-3">vs {units(r.baseOrders)}</span></dd></div>
            <div><dt className="text-ink-3">Discount given</dt><dd className="num text-[16px] font-semibold text-ink">{inrShort(r.given)}</dd></div>
          </dl>
        </Card>
      </Spot>
      <Card className="h-fit p-5">
        <div className="flex items-center gap-2 text-primary"><Repeat size={15} /><Eyebrow>Subscriber discount</Eyebrow></div>
        <div className="mt-3 text-[12.5px]"><div className="flex justify-between"><span className="text-ink-2">Off every delivery</span><span className="num font-semibold text-ink">{pct(d)}</span></div><Slider label="Subscriber discount" min={0} max={0.25} step={0.01} value={d} onChange={setD} className="mt-1.5" /></div>
        <p className="mt-3 text-[12px] leading-snug text-ink-3">{sub.why} A deeper discount brings more sign-ups and fewer cancellations, but every delivery pays it, including the ones they'd have ordered anyway.</p>
        <div className="mt-4 flex items-end justify-between rounded-xl bg-paper-2/70 p-3"><span className="text-[12.5px] text-ink-2">Net over the year</span><Money value={r.net} signed className={cn('text-[22px] font-semibold', r.net >= 0 ? 'text-gain' : 'text-loss')} /></div>
        {r.net < 0 && <p className="mt-2 text-[12px] text-loss">Orders are too far apart for the discount to pay back. A reorder reminder would do the same job for free.</p>}
      </Card>
    </div>
  )
}

function Preorder() {
  const seller = useSeller()
  const l = FRONTIER[seller.id].launch
  const [early, setEarly] = useState(0.1)
  const [pay, setPay] = useState<Payment>('deposit')
  const [weeks, setWeeks] = useState(Math.min(4, l.weeksOut))
  const r = preorderSim(l, early, pay, weeks)
  const band = (e: number) => [Math.round(l.demand * (1 - e)), Math.round(l.demand * (1 + e))]
  const [b0, b1] = [band(r.errBefore), band(r.errAfter)]
  const lo = b0[0], hi = b0[1]
  const pos = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <Spot id="preorder">
        <Card className="h-full p-5">
          <Eyebrow>{l.name} · launches in {l.weeksOut} weeks · {inrShort(l.price)}</Eyebrow>
          <h3 className="display mt-1 text-[19px] text-ink">Pre-orders tell you how much to buy</h3>
          <p className="mt-1 text-[12.5px] text-ink-3">{l.note}</p>
          <div className="mt-5 space-y-4 text-[12.5px]">
            {[{ label: 'Forecast without pre-orders', b: b0, tone: 'bg-warn/50' }, { label: `Forecast with ${units(r.confirmed)} confirmed pre-orders`, b: b1, tone: 'bg-gain/60' }].map((x) => (
              <div key={x.label}>
                <div className="mb-1 flex justify-between"><span className="text-ink-2">{x.label}</span><span className="num text-ink">{units(x.b[0])} to {units(x.b[1])} units</span></div>
                <div className="relative h-5 rounded-full bg-paper-2"><motion.span className={cn('absolute inset-y-0 rounded-full', x.tone)} animate={{ left: pos(x.b[0]), width: `calc(${pos(x.b[1])} - ${pos(x.b[0])})` }} /><span className="absolute inset-y-[-3px] w-0.5 bg-ink" style={{ left: pos(l.demand) }} /></div>
              </div>
            ))}
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-1 border-t border-dashed border-rule pt-3 text-[12.5px] sm:grid-cols-4">
            <div><dt className="text-ink-3">Buy for launch</dt><dd className="num text-[16px] font-semibold text-ink">{units(r.buy)} units</dd></div>
            <div><dt className="text-ink-3">Stock at risk</dt><dd className="num text-[16px] font-semibold text-ink">{inrShort(r.riskAfter)} <span className="text-[12px] font-normal text-ink-3">was {inrShort(r.riskBefore)}</span></dd></div>
            <div><dt className="text-ink-3">Cash before launch</dt><dd className="num text-[16px] font-semibold text-ink">{inrShort(r.cash)}</dd></div>
            <div><dt className="text-ink-3">Cancelled</dt><dd className="num text-[16px] font-semibold text-ink">{units(r.signups - r.confirmed)} <span className="text-[12px] font-normal text-ink-3">({pct(r.cancel)})</span></dd></div>
          </dl>
        </Card>
      </Spot>
      <Card className="h-fit p-5">
        <div className="flex items-center gap-2 text-primary"><PackageCheck size={15} /><Eyebrow>Pre-order terms</Eyebrow></div>
        <div className="mt-3 space-y-4 text-[12.5px]">
          <div><div className="flex justify-between"><span className="text-ink-2">Early-bird price</span><span className="num font-semibold text-ink">{early ? `${pct(early)} off` : 'Full price'}</span></div><Slider label="Early bird" min={0} max={0.25} step={0.01} value={early} onChange={setEarly} className="mt-1.5" /></div>
          <div><div className="flex justify-between"><span className="text-ink-2">Open for</span><span className="num font-semibold text-ink">{weeks} weeks</span></div><Slider label="Weeks open" min={1} max={l.weeksOut} step={1} value={weeks} onChange={setWeeks} className="mt-1.5" /></div>
          <div className="space-y-1.5"><span className="text-ink-2">Payment</span><Segmented<Payment> size="sm" value={pay} onChange={setPay} options={(Object.keys(PAYMENT) as Payment[]).map((p) => ({ value: p, label: PAYMENT[p].label }))} /></div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-y-1 text-[12.5px]">
          <dt className="text-ink-3">Overstock risk avoided</dt><dd className="num text-right text-gain">{inrShort(r.saved)}</dd>
          <dt className="text-ink-3">Early-bird discount</dt><dd className="num text-right text-loss">−{inrShort(r.given)}</dd>
        </dl>
        <div className="mt-3 flex items-end justify-between rounded-xl bg-paper-2/70 p-3"><span className="text-[12.5px] text-ink-2">Net</span><Money value={r.net} signed className={cn('text-[22px] font-semibold', r.net >= 0 ? 'text-gain' : 'text-loss')} /></div>
        <p className="mt-3 text-[11.5px] leading-snug text-ink-3">Show the expected dispatch date on the listing and refund in full on cancellation; consumer protection rules expect both for advance payments.</p>
      </Card>
    </div>
  )
}

function Protect() {
  const seller = useSeller(), c = useControls()
  const [days, setDays] = useState(14)
  const [depth, setDepth] = useState(0.2)
  const [exclude, setExclude] = useState(false)
  const r = priceProtection(seller, days, c.daysToEvent, depth, exclude)
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <Spot id="price-protect">
        <Card className="h-full p-5">
          <Eyebrow>{seller.event} in {c.daysToEvent} days</Eyebrow>
          <h3 className="display mt-1 text-[19px] text-ink">"If our price drops within {days} days, we refund the difference."</h3>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-2">Before a big sale, shoppers wait. A price-drop promise gives them a reason to buy now. It costs nothing until the price actually drops, and then it costs on every order inside the window.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-gain/30 bg-gain-soft/40 p-4"><div className="text-[12px] text-ink-3">Buyers who stop waiting</div><div className="num mt-1 text-[22px] font-semibold text-ink">{units(r.gainOrders)} orders</div><Money value={r.earned} signed className="text-[14px] font-semibold text-gain" /></div>
            <div className={cn('rounded-xl border p-4', r.liability > 0 ? 'border-loss/30 bg-loss-soft/40' : 'border-rule-2')}><div className="text-[12px] text-ink-3">Refund claims if the sale price applies</div><div className="num mt-1 text-[22px] font-semibold text-ink">{units(r.exposedOrders * 0.35)} claims</div><Money value={-r.liability} signed className={cn('text-[14px] font-semibold', r.liability > 0 ? 'text-loss' : 'text-ink-3')} /></div>
          </div>
          {r.warn && <p className="mt-3 flex gap-1.5 rounded-lg bg-warn-soft/60 p-2.5 text-[12px] text-brass-ink"><AlertTriangle size={13} className="mt-0.5 shrink-0" /> {seller.event} falls inside the window. Every order in the last {r.exposed} days before it can claim the sale price. Shorten the window, or exclude sale events in the terms (and say so clearly).</p>}
          <div className="mt-3 flex items-end justify-between rounded-xl bg-paper-2/70 p-3"><span className="text-[12.5px] text-ink-2">Net of the promise</span><Money value={r.net} signed className={cn('text-[22px] font-semibold', r.net >= 0 ? 'text-gain' : 'text-loss')} /></div>
          <p className="mt-2 text-[11.5px] text-ink-3">About 35% of eligible buyers claim. Buyers who'd have waited are estimated from past pre-sale dips.</p>
        </Card>
      </Spot>
      <Card className="h-fit p-5">
        <div className="flex items-center gap-2 text-primary"><ShieldCheck size={15} /><Eyebrow>Promise terms</Eyebrow></div>
        <div className="mt-3 space-y-4 text-[12.5px]">
          <div><div className="flex justify-between"><span className="text-ink-2">Protection window</span><span className="num font-semibold text-ink">{days} days</span></div><Slider label="Window" min={0} max={45} step={1} value={days} onChange={setDays} className="mt-1.5" /></div>
          <div><div className="flex justify-between"><span className="text-ink-2">Planned sale discount</span><span className="num font-semibold text-ink">{pct(depth)}</span></div><Slider label="Sale depth" min={0.05} max={0.5} step={0.01} value={depth} onChange={setDepth} className="mt-1.5" /></div>
          <label className="flex items-center justify-between text-ink-2">Exclude sale events<Switch checked={exclude} onChange={setExclude} label="Exclude sale events" /></label>
        </div>
        <p className="mt-3 flex gap-1.5 text-[11.5px] leading-snug text-ink-3"><CalendarClock size={13} className="mt-0.5 shrink-0" /> Change the days to {seller.event.toLowerCase()} in the Control Room and watch the liability move.</p>
      </Card>
    </div>
  )
}
