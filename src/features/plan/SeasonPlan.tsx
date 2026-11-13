import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar } from 'recharts'
import { AlertTriangle, CalendarDays, Hourglass, Swords, Trophy } from 'lucide-react'
import { Card, Chip, Eyebrow, HEALTH_META, Money, PageHeader, Segmented, Slider } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { useCampaigns, useControls, usePortfolio, useSeller } from '@/state/hooks'
import { clearance, duel, type DuelKind } from '@/engine/plan'
import { unitsAtRisk } from '@/engine/engine'
import { fmtDay, fmtWeekday } from '@/lib/dates'
import { inrShort, pct, units } from '@/lib/format'
import { cn } from '@/lib/cn'
import { ChannelLabel } from '@/brand/channels'

type Tab = 'calendar' | 'clearance' | 'duel'

export function SeasonPlan() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'calendar'
  return (
    <div>
      <PageHeader eyebrow="Season plan" title={<>When, how deep,<br /><span className="text-ink-3">and what to leave alone.</span></>}
        aside={<Segmented<Tab> value={tab} onChange={(t) => setParams({ tab: t }, { replace: true })} options={[
          { value: 'calendar', label: <span className="flex items-center gap-1.5"><CalendarDays size={13} /> Calendar</span> },
          { value: 'clearance', label: <span className="flex items-center gap-1.5"><Hourglass size={13} /> Clearance</span> },
          { value: 'duel', label: <span className="flex items-center gap-1.5"><Swords size={13} /> Scenario duel</span> },
        ]} />}>
        The calendar places every recommended offer and live campaign against festivals and sale events. Clearance plans a
        week-by-week markdown ladder for one product. The duel pits two whole-catalogue strategies against each other.
      </PageHeader>
      {tab === 'calendar' && <Calendar />}
      {tab === 'clearance' && <Clearance />}
      {tab === 'duel' && <Duel />}
    </div>
  )
}

/* ───────── Calendar ───────── */

const HORIZON = 70

function Calendar() {
  const seller = useSeller()
  const c = useControls()
  const p = usePortfolio()
  const campaigns = useCampaigns()
  const saleEvent = seller.id === 'meera' || seller.id === 'farhan'
  const ev = c.daysToEvent
  const events = [
    { label: seller.event, day: ev, length: saleEvent ? 7 : 2, kind: 'event' as const },
    ...seller.calendar,
  ].filter((e) => e.day < HORIZON)
  const quiet = saleEvent ? { start: Math.max(0, ev - 7), end: ev } : null

  const promos = useMemo(() => [...p.promos].sort((a, b) => b.result.net - a.result.net).slice(0, 8).map((r) => {
    const atEvent = /Lightning|Event|Bundle/.test(r.mechanic) && !/Clearance/.test(r.mechanic)
    const start = atEvent ? ev : 0
    const end = Math.min(HORIZON, start + r.weeks * 7)
    const clash = quiet && start < quiet.end && end > quiet.start && !atEvent
    return { id: r.sku.id, name: r.sku.line, sub: `${r.mechanic} · ${pct(r.discount)}`, start, end, net: r.result.net, health: r.health, clash }
  }), [p.promos, ev, quiet])
  const live = campaigns.filter((x) => x.status === 'live' || x.status === 'scheduled').filter((x) => x.endDay >= 0 && x.startDay < HORIZON)
    .sort((a, b) => a.startDay - b.startDay).slice(0, 7)
  const clashes = promos.filter((x) => x.clash)
  const x = (d: number) => `${(Math.max(0, Math.min(HORIZON, d)) / HORIZON) * 100}%`
  const w = (a: number, b: number) => `${((Math.min(HORIZON, b) - Math.max(0, a)) / HORIZON) * 100}%`
  const weeks = Array.from({ length: HORIZON / 7 }, (_, i) => i * 7)

  const Row = ({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) => (
    <div className="grid grid-cols-[150px_1fr] items-center border-b border-rule-2 last:border-0 md:grid-cols-[210px_1fr]">
      <div className="py-2 pr-3"><div className="truncate text-[12.5px] text-ink">{label}</div>{sub && <div className="truncate text-[11px] text-ink-3">{sub}</div>}</div>
      <div className="relative h-10">{children}</div>
    </div>
  )

  return (
    <div className="space-y-5">
      <Spot id="calendar">
        <Card className="overflow-x-auto p-5">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[150px_1fr] md:grid-cols-[210px_1fr]">
              <div />
              <div className="relative h-7 border-b border-rule">
                {weeks.map((d) => <div key={d} className="absolute top-0 text-[10.5px] text-ink-3" style={{ left: x(d) }}><span className="num">{fmtDay(d)}</span></div>)}
              </div>
            </div>
            <div className="relative">
              {/* week lines, quiet band and today */}
              <div className="pointer-events-none absolute inset-y-0 right-0 left-[150px] md:left-[210px]">
                {weeks.map((d) => <div key={d} className="absolute inset-y-0 w-px bg-rule-2" style={{ left: x(d) }} />)}
                {quiet && <div className="absolute inset-y-0 bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgba(217,119,6,0.13)_6px_8px)]" style={{ left: x(quiet.start), width: w(quiet.start, quiet.end) }} />}
                {events.map((e) => <div key={e.label} className={cn('absolute inset-y-0', e.kind === 'event' ? 'bg-brass-2/12' : e.kind === 'quiet' ? 'bg-loss/8' : 'bg-gain/6')} style={{ left: x(e.day), width: w(e.day, e.day + e.length) }} />)}
                <div className="absolute inset-y-0 w-0.5 bg-primary" style={{ left: 0 }} />
              </div>

              <Row label="Events" sub="Festivals and sale days">
                {events.map((e) => (
                  <div key={e.label} className={cn('absolute top-1.5 flex h-7 items-center overflow-hidden rounded-lg px-2 text-[11.5px] font-medium whitespace-nowrap', e.kind === 'event' ? 'bg-brass text-card' : e.kind === 'quiet' ? 'bg-loss-soft text-loss' : 'bg-gain-soft text-gain')} style={{ left: x(e.day), width: w(e.day, e.day + Math.max(e.length, 5)) }}>{e.label}</div>
                ))}
                {quiet && <div className="absolute top-1.5 flex h-7 items-center px-2 text-[11px] text-[var(--color-brass-ink)]" style={{ left: x(quiet.start), width: w(quiet.start, quiet.end) }}>quiet week</div>}
              </Row>
              <div className="py-1.5 pt-3 text-[10.5px] font-semibold tracking-[0.14em] text-ink-3 uppercase">Tarazu's recommended offers</div>
              {promos.map((r, i) => (
                <Row key={r.id} label={r.name} sub={r.sub}>
                  <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: i * 0.04, type: 'spring', stiffness: 120, damping: 20 }}
                    className={cn('absolute top-2 flex h-6 origin-left items-center justify-between gap-2 rounded-md px-2 text-[11px] font-medium', r.clash ? 'ring-2 ring-warn ring-offset-1 ring-offset-card' : '')}
                    style={{ left: x(r.start), width: w(r.start, r.end), background: HEALTH_META[r.health].soft, color: HEALTH_META[r.health].color, border: `1px solid ${HEALTH_META[r.health].color}55` }}>
                    <Link to={`/sku/${r.id}`} className="truncate hover:underline">{inrShort(r.net)} net</Link>
                    {r.clash && <AlertTriangle size={12} className="shrink-0 text-warn" />}
                  </motion.div>
                </Row>
              ))}
              <div className="py-1.5 pt-3 text-[10.5px] font-semibold tracking-[0.14em] text-ink-3 uppercase">Live and scheduled campaigns</div>
              {live.map((k) => (
                <Row key={k.id} label={k.name} sub={`${k.mechanic} · ${k.status}`}>
                  <Link to={`/campaigns?id=${k.id}`} className={cn('absolute top-2 flex h-6 items-center truncate rounded-md px-2 text-[11px] font-medium', k.status === 'live' ? 'bg-primary text-paper' : 'border border-dashed border-ink-3 text-ink-2')} style={{ left: x(k.startDay), width: w(k.startDay, k.endDay) }}>
                    {k.channel === 'all' ? 'all channels' : <ChannelLabel id={k.channel} label={seller.market.channels[k.channel]?.label} size={12} />}
                  </Link>
                </Row>
              ))}
            </div>
          </div>
        </Card>
      </Spot>
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-5">
          <Eyebrow>Calendar rules Tarazu applies</Eyebrow>
          <ul className="mt-3 space-y-2 text-[13px] leading-snug text-ink-2">
            <li><b className="text-ink">Clear risky stock now</b>, before the event's traffic, so the event is for full-margin and event-only offers.</li>
            {saleEvent && <li><b className="text-ink">Quiet week before {seller.event}</b>: launching offers here teaches buyers to wait (pull-backward), so sales dip before the event.</li>}
            <li><b className="text-ink">Deal slots during the event</b> for seasonal and bestselling items, where placement traffic pays for the fee.</li>
            <li><b className="text-ink">Bestsellers stay at full price</b> unless the event's traffic makes the discount pay for itself.</li>
          </ul>
        </Card>
        <Card className={cn('p-5', clashes.length ? 'border-warn/40' : '')}>
          <Eyebrow>Clashes</Eyebrow>
          {clashes.length === 0 ? (
            <p className="mt-3 text-[13px] text-ink-2">No offer runs into the quiet week. Move "Days to event" in the Control Room to see what happens when the sale gets closer.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {clashes.map((k) => <li key={k.id} className="flex gap-2 text-[13px] leading-snug text-ink-2"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-warn" /><span><b className="text-ink">{k.name}</b> runs into the quiet week before {seller.event} (from {fmtWeekday(Math.max(0, ev - 7))} {fmtDay(Math.max(0, ev - 7))}). Start it now and end it early, or fold it into the event.</span></li>)}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

/* ───────── Clearance countdown ───────── */

function Clearance() {
  const seller = useSeller()
  const c = useControls()
  const p = usePortfolio()
  const candidates = useMemo(() => p.recs.filter((r) => r.health === 'at-risk' || r.health === 'slow').sort((a, b) => unitsAtRisk(b.sku, c) * b.sku.cost - unitsAtRisk(a.sku, c) * a.sku.cost).slice(0, 8), [p.recs, c])
  const [id, setId] = useState(() => candidates.find((r) => r.sku.id === seller.heroSkuId)?.sku.id ?? candidates[0]?.sku.id)
  const sku = (candidates.find((r) => r.sku.id === id) ?? candidates[0])?.sku
  const k = useMemo(() => (sku ? clearance(sku, c) : null), [sku, c])
  if (!sku || !k) return <Card className="p-10 text-center text-ink-3">Nothing at risk right now.</Card>
  const data = [{ week: 0, ladder: k.ladder.weeks[0].left + k.ladder.weeks[0].units, nothing: k.nothing.weeks[0].left + k.nothing.weeks[0].units, flat: k.flat.weeks[0].left + k.flat.weeks[0].units, d: 0 },
    ...k.ladder.weeks.map((x, i) => ({ week: x.week, ladder: Math.round(x.left), nothing: Math.round(k.nothing.weeks[i].left), flat: Math.round(k.flat.weeks[i].left), d: Math.round(x.discount * 100) }))]
  const plans = [k.ladder, k.flat, k.nothing]
  const best = plans.reduce((a, b) => (b.profit > a.profit ? b : a))

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <Card className="p-2 lg:self-start">
        <div className="px-2.5 pt-2 pb-1"><Eyebrow>Most money at risk</Eyebrow></div>
        {candidates.map((r) => (
          <button key={r.sku.id} onClick={() => setId(r.sku.id)} className={cn('w-full rounded-xl px-2.5 py-2 text-left transition-colors', r.sku.id === sku.id ? 'bg-primary text-paper' : 'hover:bg-paper-2')}>
            <div className="line-clamp-1 text-[12.5px] font-medium">{r.sku.name}</div>
            <div className={cn('num text-[11px]', r.sku.id === sku.id ? 'text-paper/60' : 'text-ink-3')}>{inrShort(unitsAtRisk(r.sku, c) * r.sku.cost)} at risk · {r.sku.sellWindowWeeks} wks left</div>
          </button>
        ))}
      </Card>
      <Spot id="ladder">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Eyebrow>Clearance countdown · {k.weeks} weeks</Eyebrow>
              <h2 className="display mt-1 text-[24px] text-ink">{sku.name}</h2>
              <div className="num mt-1 text-[12.5px] text-ink-3">₹{sku.price} · cost ₹{sku.cost} · {units(data[0].ladder)} in stock{sku.expiryWeeks ? ` · expires in ${sku.expiryWeeks} weeks` : ''}</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {k.ladder.steps.map((d, i) => (
                <motion.span key={`${d}-${i}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="num rounded-full bg-primary px-2.5 py-1 text-[12px] font-semibold text-brass-2">{Math.round(d * 100)}%</motion.span>
              ))}
            </div>
          </div>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer>
              <ComposedChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
                <defs><linearGradient id="lad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--color-gain)" stopOpacity={0.25} /><stop offset="1" stopColor="var(--color-gain)" stopOpacity={0.02} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="var(--color-rule-2)" />
                <XAxis dataKey="week" tickFormatter={(v) => (v === 0 ? 'now' : `wk ${v}`)} tick={{ fontSize: 11, fill: 'var(--color-ink-3)' }} axisLine={{ stroke: 'var(--color-rule)' }} tickLine={false} />
                <YAxis yAxisId="u" tickFormatter={(v) => units(v)} tick={{ fontSize: 11, fill: 'var(--color-ink-3)' }} axisLine={false} tickLine={false} width={46} />
                <YAxis yAxisId="d" orientation="right" domain={[0, 80]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: 'var(--color-brass)' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-rule)', borderRadius: 10, fontSize: 12 }} labelFormatter={(v) => (v === 0 ? 'Now' : `Week ${v}`)}
                  formatter={(v, n) => (n === 'Discount' ? [`${v}%`, n] : [`${units(Number(v))} units left`, n])} />
                <Bar yAxisId="d" dataKey="d" name="Discount" fill="var(--color-brass-2)" fillOpacity={0.35} radius={[4, 4, 0, 0]} barSize={22} />
                <Line yAxisId="u" dataKey="nothing" name="Do nothing" stroke="var(--color-loss)" strokeDasharray="4 3" dot={false} strokeWidth={1.8} />
                <Line yAxisId="u" dataKey="flat" name={k.flat.label} stroke="var(--color-ink-3)" dot={false} strokeWidth={1.8} />
                <Area yAxisId="u" dataKey="ladder" name="Tarazu ladder" stroke="var(--color-gain)" strokeWidth={2.5} fill="url(#lad)" dot={{ r: 3, fill: 'var(--color-gain)' }} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {plans.map((pl) => (
              <div key={pl.label} className={cn('rounded-xl border p-3', pl === best ? 'border-gain/40 bg-gain-soft/60' : 'border-rule bg-card')}>
                <div className="flex items-center justify-between text-[12.5px] font-medium text-ink">{pl.label}{pl === best && <Trophy size={13} className="text-gain" />}</div>
                <Money value={pl.profit} signed className={cn('mt-1 text-[22px] font-semibold', pl.profit >= 0 ? 'text-gain' : 'text-loss')} />
                <div className="text-[11.5px] text-ink-3">{pl.leftover > 0.5 ? `${units(pl.leftover)} left, written off at ${inrShort(pl.writeOff)}` : 'Clears completely'}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-ink-2">
            Profit here is what the stock earns over {k.weeks} weeks after fees, minus the write-off on anything still unsold. The ladder starts shallow so
            early buyers who'd pay more still do, and only deepens when the clock runs down. {k.cap < 0.6 && `It never goes past ${pct(k.cap)}, where the price would fall below cost.`}
          </p>
        </Card>
      </Spot>
    </div>
  )
}

/* ───────── Scenario duel ───────── */

const KINDS: { value: DuelKind; label: string }[] = [
  { value: 'tarazu', label: "Tarazu's plan" }, { value: 'blanket', label: 'X% off everything' }, { value: 'risky-only', label: 'X% off risky stock' }, { value: 'nothing', label: 'Do nothing' },
]

function Duel() {
  const seller = useSeller()
  const c = useControls()
  const [a, setA] = useState<DuelKind>('blanket')
  const [b, setB] = useState<DuelKind>('tarazu')
  const [d, setD] = useState(seller.history.discount)
  const ra = useMemo(() => duel(seller.skus, c, a, d), [seller, c, a, d])
  const rb = useMemo(() => duel(seller.skus, c, b, d), [seller, c, b, d])
  const winner = ra.net === rb.net ? null : ra.net > rb.net ? 'a' : 'b'
  const metrics: { label: string; get: (r: typeof ra) => number; fmt: (n: number) => string; better: 'high' | 'low' }[] = [
    { label: 'Net impact after everything', get: (r) => r.net, fmt: (n) => inrShort(n), better: 'high' },
    { label: 'Revenue', get: (r) => r.revenue, fmt: (n) => inrShort(n), better: 'high' },
    { label: 'Discount given to full-price buyers', get: (r) => r.subsidy, fmt: (n) => inrShort(n), better: 'low' },
    { label: 'Risky stock still stuck', get: (r) => r.riskLeft, fmt: (n) => inrShort(n), better: 'low' },
    { label: 'Share of units sold on offer', get: (r) => r.onOffer, fmt: (n) => pct(n), better: 'low' },
  ]

  return (
    <Spot id="duel">
      <Card className="p-5">
        <div className="grid items-start gap-4 md:grid-cols-[1fr_auto_1fr]">
          <Side tag="A" value={a} onChange={setA} r={ra} win={winner === 'a'} />
          <div className="display grid h-12 w-12 place-items-center self-center rounded-full bg-primary text-[16px] text-brass-2 italic">vs</div>
          <Side tag="B" value={b} onChange={setB} r={rb} win={winner === 'b'} />
        </div>
        {(a === 'blanket' || a === 'risky-only' || b === 'blanket' || b === 'risky-only') && (
          <div className="mx-auto mt-5 max-w-md">
            <div className="flex justify-between text-[12px] text-ink-3"><span>X = discount</span><span className="num font-semibold text-ink">{pct(d)}</span></div>
            <Slider label="Discount for X" min={0.05} max={0.6} step={0.01} value={d} onChange={setD} className="mt-1" />
          </div>
        )}
        <div className="mt-6 space-y-3">
          {metrics.map((m) => {
            const va = m.get(ra), vb = m.get(rb)
            const max = Math.max(Math.abs(va), Math.abs(vb), 1)
            const aWins = m.better === 'high' ? va > vb : va < vb
            const bWins = m.better === 'high' ? vb > va : vb < va
            return (
              <div key={m.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="flex items-center justify-end gap-2">
                  <span className={cn('num text-[13px]', aWins ? 'font-semibold text-ink' : 'text-ink-3')}>{m.fmt(va)}</span>
                  <div className="h-2.5 w-[45%] overflow-hidden rounded-full bg-paper-2 [direction:rtl]"><motion.div className="h-full rounded-full" style={{ background: va < 0 ? 'var(--color-loss)' : aWins ? 'var(--color-gain)' : 'var(--color-ink-4)' }} animate={{ width: `${(Math.abs(va) / max) * 100}%` }} /></div>
                </div>
                <div className="w-[150px] text-center text-[11.5px] leading-tight text-ink-3 md:w-[210px]">{m.label}</div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-[45%] overflow-hidden rounded-full bg-paper-2"><motion.div className="h-full rounded-full" style={{ background: vb < 0 ? 'var(--color-loss)' : bWins ? 'var(--color-gain)' : 'var(--color-ink-4)' }} animate={{ width: `${(Math.abs(vb) / max) * 100}%` }} /></div>
                  <span className={cn('num text-[13px]', bWins ? 'font-semibold text-ink' : 'text-ink-3')}>{m.fmt(vb)}</span>
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-6 border-t border-dashed border-rule pt-4 text-center text-[13.5px] text-ink-2">
          {winner ? <><b className="text-ink">{(winner === 'a' ? ra : rb).label}</b> wins by <b className="num text-ink">{inrShort(Math.abs(ra.net - rb.net))}</b> for {seller.name}, before even counting what constant sales do to next month's full-price demand.</> : 'Dead heat.'}
        </p>
      </Card>
    </Spot>
  )
}

function Side({ tag, value, onChange, r, win }: { tag: string; value: DuelKind; onChange: (v: DuelKind) => void; r: ReturnType<typeof duel>; win: boolean }) {
  return (
    <div className={cn('rounded-2xl border p-4 text-center transition-colors', win ? 'border-beam border-gain/40 bg-gain-soft/40' : 'border-rule bg-card')}>
      <div className="flex items-center justify-center gap-2"><span className="num grid h-5 w-5 place-items-center rounded-full bg-paper-2 text-[10px] text-ink-3">{tag}</span>{win && <Chip tone="gain"><Trophy size={11} /> winner</Chip>}</div>
      <select value={value} onChange={(e) => onChange(e.target.value as DuelKind)} aria-label={`Strategy ${tag}`}
        className="display mt-2 w-full cursor-pointer appearance-none bg-transparent text-center text-[22px] text-ink outline-none">
        {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
      </select>
      <div className="text-[11.5px] text-ink-3">{r.label} · {r.skusOnOffer} products on offer</div>
      <Money value={r.net} signed className={cn('mt-3 text-[36px] leading-none font-medium', r.net >= 0 ? 'text-gain' : 'text-loss')} />
    </div>
  )
}
