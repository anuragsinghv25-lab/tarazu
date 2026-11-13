import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis, Area } from 'recharts'
import { toast } from 'sonner'
import { ArrowRight, MoveRight, Scale as ScaleIcon } from 'lucide-react'
import { Card, Chip, Eyebrow, Money, PageHeader, Slider } from '@/components/ui'
import { Select } from '@/components/ui/form'
import { Spot } from '@/components/Spot'
import { Term } from '@/components/Term'
import { useStore } from '@/state/store'
import { useSeller } from '@/state/hooks'
import { bestMove, forwardBuying, grossToNet, MECHANISM, reallocate, roi } from '@/engine/trade'
import type { Deduction, TradeData } from '@/data/sellers/types'
import { inrShort, pct, units } from '@/lib/format'
import { cn } from '@/lib/cn'
import { SellerMark } from '@/brand/sellers'

export function BrandMode() {
  const seller = useSeller()
  const { setSeller } = useStore()
  if (!seller.trade) {
    return (
      <div>
        <PageHeader eyebrow="Brand mode" title={<>For brands that sell<br /><span className="text-ink-3">through someone else's shelf.</span></>}>
          {seller.name} sells directly to shoppers, so every promotion is a consumer offer. Brands that sell through distributors and retailers
          fund promotions differently: as <Term k="trade spend" />, paid to the shop, not the shopper. Brand mode is built for them.
        </PageHeader>
        <Card className="flex flex-col items-start gap-4 p-6 md:flex-row md:items-center">
          <SellerMark id="anaya" size={56} />
          <div className="flex-1">
            <div className="display text-[22px] text-ink">Anaya · Malwa Bites, Indore</div>
            <p className="mt-1 text-[13px] text-ink-2">Snacks and chai through distributors, modern trade and quick commerce: <Term k="gross-to-net" />, <Term k="off-invoice" /> vs <Term k="scan-based" />, <Term k="slotting" /> fees, <Term k="forward buying" /> and <Term k="deduction">deductions</Term>.</p>
          </div>
          <button onClick={() => setSeller('anaya')} className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-paper">Open as Anaya <ArrowRight size={14} /></button>
        </Card>
      </div>
    )
  }
  return <Brand t={seller.trade} />
}

function Brand({ t }: { t: TradeData }) {
  const g = useMemo(() => grossToNet(t), [t])
  return (
    <div>
      <PageHeader eyebrow={`Brand mode · ${t.quarter}`} title={<>Where the trade money<br /><span className="text-ink-3">actually goes.</span></>}>
        Malwa Bites pays retailers and distributors to promote its snacks. That <Term k="trade spend" /> is {pct(g.tradeShare)} of gross sales, before
        distributor margins and the invoices retailers short-pay. Tarazu walks gross to net, scores every deal, and finds money to move.
      </PageHeader>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Gross sales" value={g.gross} sub="at list price, this quarter" />
        <Kpi label="Trade spend" value={g.tradeSpend} sub={`${pct(g.tradeShare)} of gross`} tone="loss" />
        <Kpi label="Net revenue" value={g.net} sub={`${pct(g.net / g.gross)} of gross kept`} tone="gain" />
        <Kpi label="Disputed deductions" value={g.disputed} sub="claimed beyond what was agreed" tone="loss" />
      </div>
      <Spot id="gtn"><Waterfall g={g} /></Spot>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Spot id="trade-lines"><Lines t={t} /></Spot>
        <Spot id="tpo"><Tpo t={t} /></Spot>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Spot id="forward-buy"><Forward t={t} /></Spot>
        <Spot id="deductions"><Deductions t={t} /></Spot>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, tone }: { label: string; value: number; sub: string; tone?: 'gain' | 'loss' }) {
  return (
    <Card className="p-4">
      <Eyebrow>{label}</Eyebrow>
      <Money value={value} className={cn('mt-1.5 block text-[28px] leading-none font-semibold', tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : 'text-ink')} />
      <div className="mt-1.5 text-[11.5px] text-ink-3">{sub}</div>
    </Card>
  )
}

function Waterfall({ g }: { g: ReturnType<typeof grossToNet> }) {
  const H = 240
  const scale = (v: number) => (v / g.gross) * H
  let run = g.gross
  const cols = [
    { label: 'Gross sales', top: 0, h: scale(g.gross), v: g.gross, kind: 'total' as const },
    ...g.steps.map((s) => { const top = scale(g.gross - run); run -= s.value; return { label: s.label, top, h: Math.max(2, scale(s.value)), v: -s.value, kind: 'step' as const } }),
    { label: 'Net revenue', top: scale(g.gross - g.net), h: scale(g.net), v: g.net, kind: 'net' as const },
  ]
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div><Eyebrow><Term k="gross-to-net">Gross-to-net</Term></Eyebrow><h2 className="display mt-1 text-[22px] text-ink">From {inrShort(g.gross)} on the invoice to {inrShort(g.net)} in the bank</h2></div>
        <span className="text-[12px] text-ink-3">Each red step is money that never reaches Malwa Bites</span>
      </div>
      <div className="mt-6 overflow-x-auto">
        <div className="grid min-w-[760px] gap-2" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
          {cols.map((col, i) => (
            <div key={col.label} className="flex flex-col items-center">
              <div className="num mb-1 h-4 text-[11.5px] font-medium" style={{ color: col.kind === 'step' ? '#c2421c' : col.kind === 'net' ? '#1e7b4f' : '#0b3d2e', marginTop: col.top }}>{col.kind === 'step' ? `−${inrShort(-col.v)}` : inrShort(col.v)}</div>
              <div className="relative w-full" style={{ height: H - col.top }}>
                <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.07, type: 'spring', stiffness: 120, damping: 20 }}
                  className={cn('absolute inset-x-1.5 top-0 origin-top rounded-md', col.kind === 'total' ? 'bg-primary' : col.kind === 'net' ? 'bg-gain' : 'bg-loss/85')} style={{ height: col.h }} />
                {i < cols.length - 1 && <div className="absolute top-0 left-full z-10 w-2 border-t border-dashed border-ink-3" style={{ top: cols[i + 1].top - col.top + (col.kind === 'step' ? col.h : 0) - (col.kind === 'total' ? 0 : col.h) + (col.kind === 'step' ? 0 : 0) }} />}
              </div>
              <div className="mt-2 min-h-[30px] text-center text-[11px] leading-tight text-ink-2">{col.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function Lines({ t }: { t: TradeData }) {
  const lines = [...t.lines].sort((a, b) => roi(b) - roi(a))
  const max = Math.max(...lines.map((l) => Math.abs(roi(l))))
  const acc = (id: string) => t.accounts.find((a) => a.id === id)!
  return (
    <Card className="p-5">
      <Eyebrow>Every trade deal, scored</Eyebrow>
      <h2 className="display mt-1 text-[20px] text-ink">Return on each rupee of trade spend</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-[12.5px]">
          <thead><tr className="border-b border-rule text-left text-ink-3"><th className="py-2 pr-2 font-medium">Deal</th><th className="px-2 py-2 font-medium">Type</th><th className="px-2 py-2 text-right font-medium">Spend</th><th className="w-[170px] py-2 pl-3 text-center font-medium">ROI</th></tr></thead>
          <tbody>
            {lines.map((l) => {
              const r = roi(l)
              return (
                <tr key={l.id} className="border-b border-rule-2 last:border-0">
                  <td className="py-2.5 pr-2"><div className="text-ink">{l.label}</div><div className="flex items-center gap-1.5 text-[11px] text-ink-3"><span className="h-1.5 w-1.5 rounded-full" style={{ background: acc(l.account).color }} />{acc(l.account).name}</div></td>
                  <td className="px-2 py-2.5"><Chip tone={l.mechanism === 'scan-based' ? 'gain' : l.mechanism === 'off-invoice' || l.mechanism === 'free-goods' ? 'warn' : 'quiet'}><Term k={l.mechanism === 'free-goods' ? 'forward buying' : l.mechanism === 'visibility' ? 'co-op' : l.mechanism === 'slotting' ? 'slotting' : l.mechanism}>{MECHANISM[l.mechanism].label}</Term></Chip></td>
                  <td className="num px-2 py-2.5 text-right text-ink">{inrShort(l.spend)}</td>
                  <td className="py-2.5 pl-3">
                    <div className="relative flex h-4 items-center">
                      <div className="absolute left-1/2 h-full w-px bg-rule" />
                      <motion.div className={cn('absolute h-2.5 rounded-full', r >= 0 ? 'left-1/2 bg-gain' : 'right-1/2 bg-loss')} initial={{ width: 0 }} animate={{ width: `${(Math.abs(r) / max) * 50}%` }} />
                    </div>
                    <div className={cn('num text-center text-[11.5px] font-semibold', r >= 0 ? 'text-gain' : 'text-loss')}>{r >= 0 ? '+' : ''}{Math.round(r * 100)}%</div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12px] leading-snug text-ink-3">ROI = (incremental gross profit − spend) ÷ spend, from post-event analysis. Scan-based deals pay only for real shopper sales, which is why they score best.</p>
    </Card>
  )
}

function Tpo({ t }: { t: TradeData }) {
  const sorted = [...t.lines].sort((a, b) => roi(a) - roi(b))
  const [fromId, setFrom] = useState(sorted[0].id)
  const [toId, setTo] = useState(sorted[sorted.length - 1].id)
  const from = t.lines.find((l) => l.id === fromId)!, to = t.lines.find((l) => l.id === toId)!
  const best = useMemo(() => bestMove(from, to), [from, to])
  const [amount, setAmount] = useState(best.amount)
  const r = reallocate(from, to, Math.min(amount, from.spend))
  const opts = t.lines.map((l) => ({ value: l.id, label: `${l.label} (${Math.round(roi(l) * 100)}%)` }))
  return (
    <Card className="border-beam p-5">
      <div className="flex items-center gap-2 text-brass"><ScaleIcon size={15} /><Eyebrow className="text-brass"><Term k="TPO">Trade promotion optimisation</Term></Eyebrow></div>
      <h2 className="display mt-1 text-[20px] text-ink">Move money from what doesn't pay to what does</h2>
      <div className="mt-4 space-y-2">
        <label className="block text-[11px] font-medium tracking-wide text-ink-3 uppercase">Take from</label>
        <Select label="Take from" value={fromId} onChange={(v) => { setFrom(v); setAmount(bestMove(t.lines.find((l) => l.id === v)!, to).amount) }} options={opts.filter((o) => o.value !== toId)} className="w-full" />
        <div className="flex justify-center py-0.5 text-ink-3"><MoveRight size={16} className="rotate-90" /></div>
        <label className="block text-[11px] font-medium tracking-wide text-ink-3 uppercase">Give to</label>
        <Select label="Give to" value={toId} onChange={(v) => { setTo(v); setAmount(bestMove(from, t.lines.find((l) => l.id === v)!).amount) }} options={opts.filter((o) => o.value !== fromId)} className="w-full" />
      </div>
      <div className="mt-4 flex justify-between text-[12.5px]"><span className="text-ink-2">Amount to move</span><span className="num font-semibold text-ink">{inrShort(amount)} of {inrShort(from.spend)}</span></div>
      <Slider label="Amount to move" min={0} max={from.spend} step={from.spend / 40} value={Math.min(amount, from.spend)} onChange={setAmount} className="mt-1.5" />
      <button onClick={() => setAmount(best.amount)} className="mt-1.5 text-[12px] font-medium text-brass hover:text-ink">Best move · {inrShort(best.amount)}</button>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-paper-2 p-3"><div className="text-[11px] text-ink-3">Incremental gross profit now</div><div className="num text-[18px] font-semibold text-ink">{inrShort(r.before)}</div></div>
        <div className="rounded-xl bg-gain-soft p-3"><div className="text-[11px] text-gain">After the move</div><div className="num text-[18px] font-semibold text-gain">{inrShort(r.after)}</div></div>
      </div>
      <div className="mt-3 flex items-end justify-between"><span className="text-[12.5px] text-ink-2">Same budget, more profit</span><Money value={r.gain} signed className={cn('text-[24px] font-semibold', r.gain >= 0 ? 'text-gain' : 'text-loss')} /></div>
      <p className="mt-2 text-[11.5px] leading-snug text-ink-3">Each deal shows diminishing returns: the more you spend on it, the less each extra rupee earns. Past a point, moving more stops paying.</p>
      <button onClick={() => toast('Added to the Q4 trade plan', { description: `Move ${inrShort(amount)} from "${from.label}" to "${to.label}" for ${r.gain >= 0 ? '+' : ''}${inrShort(r.gain)}.` })} className="mt-4 w-full rounded-full bg-primary py-2 text-[13px] font-medium text-paper">Add to the trade review</button>
    </Card>
  )
}

function Forward({ t }: { t: TradeData }) {
  const f = useMemo(() => forwardBuying(t), [t])
  const [a, b] = t.schemeWeeks
  return (
    <Card className="p-5">
      <Eyebrow><Term k="forward buying">Forward buying</Term> · Malwa Distributors</Eyebrow>
      <h2 className="display mt-1 text-[20px] text-ink">The scheme moved stock into the warehouse, not into homes</h2>
      <div className="mt-4 h-[260px]">
        <ResponsiveContainer>
          <ComposedChart data={f.weeks} margin={{ top: 10, right: 8, bottom: 0, left: -4 }}>
            <CartesianGrid vertical={false} stroke="#e2e8e4" />
            <XAxis dataKey="week" tickFormatter={(v) => `wk ${v}`} tick={{ fontSize: 10.5, fill: '#7a8580' }} axisLine={{ stroke: '#cbd5d1' }} tickLine={false} />
            <YAxis tickFormatter={(v) => units(v)} tick={{ fontSize: 10.5, fill: '#7a8580' }} axisLine={false} tickLine={false} width={44} />
            <Tooltip contentStyle={{ background: '#fffcf6', border: '1px solid #cbd5d1', borderRadius: 10, fontSize: 12 }} labelFormatter={(v) => `Week ${v}`} formatter={(v, n) => [`${units(Number(v))} cases`, n]} />
            <ReferenceArea x1={a + 1} x2={b + 1} fill="#f59e0b" fillOpacity={0.15} label={{ value: 'Buy 10 get 1 scheme', position: 'insideTop', fontSize: 10.5, fill: '#92400e' }} />
            <Area dataKey="pipeline" name="Extra stock at distributor" fill="#c2421c" fillOpacity={0.1} stroke="#c2421c" strokeOpacity={0.5} strokeDasharray="3 3" isAnimationActive={false} />
            <Bar dataKey="sellIn" name="Sell-in (shipped to distributor)" fill="#0b3d2e" radius={[3, 3, 0, 0]} barSize={18} />
            <Line dataKey="sellOut" name="Sell-out (bought by shoppers)" stroke="#1e7b4f" strokeWidth={2.5} dot={{ r: 2.5, fill: '#1e7b4f' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-[11.5px] text-ink-3">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> <Term k="sell-in">Sell-in</Term></span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-gain" /> <Term k="sell-out">Sell-out</Term></span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-loss/20" /> Extra stock sitting at the distributor</span>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
        During the scheme the distributor bought <b className="num text-ink">{units(f.loaded)}</b> more cases than shoppers did, about <b className="num text-ink">{f.weeksOfExtra.toFixed(1)} weeks</b> of
        stock, then ordered well below normal for a month. The discount bought a spike in shipments, not in sales. A <Term k="scan-based" /> deal would have paid only for the sell-out line.
      </p>
    </Card>
  )
}

const STATUS: Record<Deduction['status'] | 'disputed', { tone: 'gain' | 'loss' | 'warn' | 'quiet' | 'ink'; label: string }> = {
  matched: { tone: 'gain', label: 'Matched' }, 'over-claim': { tone: 'loss', label: 'Over-claimed' }, unmatched: { tone: 'loss', label: 'No promotion' }, pending: { tone: 'warn', label: 'Under-claimed' }, disputed: { tone: 'ink', label: 'Disputed' },
}

function Deductions({ t }: { t: TradeData }) {
  const [disputed, setDisputed] = useState<string[]>([])
  const rows = t.deductions
  const totalAcc = rows.reduce((a, d) => a + d.accrued, 0), totalClaim = rows.reduce((a, d) => a + d.claimed, 0)
  return (
    <Card className="p-5">
      <Eyebrow><Term k="accrual">Accruals</Term> vs <Term k="deduction">deductions</Term></Eyebrow>
      <h2 className="display mt-1 text-[20px] text-ink">What was agreed vs what retailers took</h2>
      <ul className="mt-4 divide-y divide-rule-2">
        {rows.map((d) => {
          const isDisputed = disputed.includes(d.id)
          const st = STATUS[isDisputed ? 'disputed' : d.status]
          const gap = d.claimed - d.accrued
          return (
            <li key={d.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] text-ink">{d.promo}</div>
                <div className="num text-[11px] text-ink-3">{d.account} · agreed {inrShort(d.accrued)} · took {inrShort(d.claimed)} · {d.daysOpen}d open</div>
              </div>
              {gap > 0 && <span className="num text-[12px] font-semibold text-loss">+{inrShort(gap)}</span>}
              <Chip tone={st.tone}>{st.label}</Chip>
              {(d.status === 'over-claim' || d.status === 'unmatched') && !isDisputed && (
                <button onClick={() => { setDisputed((x) => [...x, d.id]); toast('Dispute raised', { description: `${inrShort(gap)} with ${d.account}, backed by the promotion agreement.` }) }} className="rounded-full border border-loss/40 px-2.5 py-0.5 text-[11.5px] text-loss hover:bg-loss-soft">Dispute</button>
              )}
            </li>
          )
        })}
      </ul>
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-paper-2/70 p-3 text-center">
        <div><div className="text-[10.5px] text-ink-3 uppercase">Agreed</div><div className="num text-[15px] font-semibold text-ink">{inrShort(totalAcc)}</div></div>
        <div><div className="text-[10.5px] text-ink-3 uppercase">Taken</div><div className="num text-[15px] font-semibold text-ink">{inrShort(totalClaim)}</div></div>
        <div><div className="text-[10.5px] text-ink-3 uppercase">At stake</div><div className="num text-[15px] font-semibold text-loss">{inrShort(rows.reduce((a, d) => a + Math.max(0, d.claimed - d.accrued), 0))}</div></div>
      </div>
      <p className="mt-3 text-[11.5px] leading-snug text-ink-3">Retailers deduct promotion money by short-paying invoices. Matching each deduction to an accrual is how brands catch over-claims and "damages" with no promotion behind them.</p>
    </Card>
  )
}

