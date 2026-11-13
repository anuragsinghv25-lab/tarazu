import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Send } from 'lucide-react'
import { Card, Chip, Eyebrow, Money, PageHeader, Slider } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { FRONTIER } from '@/data/frontier'
import { KIND, segmentResult, targetingSummary, TARGETING, upliftCurve, type Kind, type Targeting } from '@/engine/frontier'
import { contribution } from '@/engine/reach'
import { useSeller } from '@/state/hooks'
import { useStore } from '@/state/store'
import { useLaunch } from '@/state/launch'
import { newCampaign } from '@/features/campaigns/templates'
import { inrShort, pct, units } from '@/lib/format'
import { cn } from '@/lib/cn'

export const KIND_TONE: Record<Kind, 'gain' | 'quiet' | 'warn' | 'loss'> = { persuadable: 'gain', sure: 'warn', lost: 'quiet', sleeping: 'loss' }
const ORDER: Kind[] = ['sure', 'sleeping', 'persuadable', 'lost']

export function Uplift() {
  const seller = useSeller()
  const F = FRONTIER[seller.id]
  const m = contribution(seller)
  const [d, setD] = useState(0.12)
  const [t, setT] = useState<Targeting>('uplift')
  const rows = useMemo(() => F.segments.map((g) => segmentResult(g, d, seller.avgOrder, m)), [F, d, seller, m])
  const sums = (['everyone', 'propensity', 'uplift'] as Targeting[]).map((x) => ({ t: x, ...targetingSummary(rows, x) }))
  const cur = sums.find((x) => x.t === t)!
  const max = Math.max(...sums.map((x) => Math.abs(x.net)))
  const curve = useMemo(() => upliftCurve(rows), [rows])
  const { saveCampaign } = useStore()
  const { commit } = useLaunch()
  const nav = useNavigate()
  const total = rows.reduce((a, r) => a + r.g.size, 0)

  const draft = () => {
    const k = newCampaign(seller, 'Coupon', {
      name: `Persuadables only: ${pct(d)} off`, status: 'draft', startDay: 2, endDay: 16, stacking: 'exclusive', perCustomer: 1,
      reward: { kind: 'pctOff', value: d, target: 'cart' }, conditions: [],
      budget: Math.max(5000, Math.round(cur.given / 1000) * 1000), dailyRedemptions: Math.max(1, Math.round(cur.incremental / 14)), funding: 'seller',
      note: `Sent to ${units(cur.customers)} customers in ${cur.chosen.size} groups chosen by uplift, not by likelihood to buy.`,
      launch: { goal: 'winback', audience: [{ kind: 'list', value: Math.round(cur.customers) }], codes: { mode: 'bulk', prefix: 'MORE', count: Math.round(cur.customers) } },
    })
    saveCampaign(k); commit(k, 'Created from Uplift targeting')
    toast('Targeted offer drafted', { description: 'Finish it in the Launch flow.' })
    nav(`/launch?id=${k.id}`)
  }

  return (
    <div>
      <PageHeader eyebrow="Uplift targeting" title={<>Send the offer to people<br /><span className="text-ink-3">it actually changes.</span></>}>
        Most tools send offers to the customers most likely to buy. Those people were going to buy anyway. Uplift targeting asks a different
        question: whose behaviour does the offer change? Pay only them.
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Spot id="uplift-quadrant">
          <Card className="h-full p-5">
            <Eyebrow>Four kinds of customer</Eyebrow>
            <h3 className="display mt-1 text-[19px] text-ink">{units(total)} customers, sorted by what an offer does to them</h3>
            <div className="mt-4 grid grid-cols-[22px_1fr_1fr] grid-rows-[1fr_1fr_22px] gap-2">
              <span className="row-span-2 flex rotate-180 items-center justify-around text-[11px] tracking-wider text-ink-3 uppercase [writing-mode:vertical-rl]"><span>No offer: wouldn't buy</span><span>No offer: buys</span></span>
              {ORDER.map((k) => {
                const group = rows.filter((r) => r.kind === k)
                const n = group.reduce((a, r) => a + r.g.size, 0)
                const net = group.reduce((a, r) => a + r.net, 0)
                return (
                  <div key={k} className={cn('rounded-xl border p-3', k === 'persuadable' ? 'border-gain/40 bg-gain-soft/40' : k === 'sleeping' ? 'border-loss/30 bg-loss-soft/30' : 'border-rule-2 bg-paper/40')}>
                    <div className="flex items-center justify-between gap-2"><Chip tone={KIND_TONE[k]}>{KIND[k].label}</Chip><span className="num text-[12px] text-ink-3">{units(n)}</span></div>
                    <p className="mt-1.5 text-[12px] leading-snug text-ink-2">{KIND[k].rule}</p>
                    <ul className="mt-2 space-y-0.5 text-[11.5px] text-ink-3">{group.map((r) => <li key={r.g.id} className="truncate">· {r.g.name}</li>)}</ul>
                    {group.length > 0 && <div className="mt-2 text-[12px]">If offered: <Money value={net} signed className={cn('font-semibold', net >= 0 ? 'text-gain' : 'text-loss')} /></div>}
                  </div>
                )
              })}
              <span />
              <span className="text-center text-[11px] tracking-wider text-ink-3 uppercase">With offer: buys</span>
              <span className="text-center text-[11px] tracking-wider text-ink-3 uppercase">With offer: doesn't buy</span>
            </div>
          </Card>
        </Spot>

        <Spot id="uplift-compare">
          <Card className="h-full p-5">
            <Eyebrow>Three ways to pick who gets it</Eyebrow>
            <h3 className="display mt-1 text-[19px] text-ink">{pct(d)} off for 30 days</h3>
            <div className="mt-3 text-[12.5px]"><div className="flex justify-between"><span className="text-ink-2">Discount</span><span className="num font-semibold text-ink">{pct(d)}</span></div><Slider label="Discount" min={0.05} max={0.3} step={0.01} value={d} onChange={setD} className="mt-1.5" /></div>
            <ul className="mt-4 space-y-3">
              {sums.map((x) => (
                <li key={x.t}>
                  <button onClick={() => setT(x.t)} className={cn('w-full rounded-xl border p-3 text-left', t === x.t ? 'border-primary bg-surface/50 dark:bg-paper-2' : 'border-rule-2 hover:border-rule')}>
                    <div className="flex items-center justify-between text-[13px]"><span className="text-ink">{TARGETING[x.t]}</span><Money value={x.net} signed className={cn('font-semibold', x.net >= 0 ? 'text-gain' : 'text-loss')} /></div>
                    <div className="relative mt-2 h-2.5"><span className="absolute inset-y-0 left-1/2 w-px bg-rule" /><motion.span className={cn('absolute inset-y-0 rounded', x.net >= 0 ? 'left-1/2 bg-gain' : 'right-1/2 bg-loss/85')} animate={{ width: `${(Math.abs(x.net) / Math.max(1, max)) * 50}%` }} /></div>
                    <div className="mt-1.5 text-[11.5px] text-ink-3">{units(x.customers)} customers · {units(x.incremental)} extra orders · {inrShort(x.given)} given away</div>
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={draft} disabled={cur.customers === 0} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[13px] font-medium text-paper disabled:opacity-40"><Send size={14} /> Draft this offer for {units(cur.customers)} people</button>
          </Card>
        </Spot>

        <Spot id="uplift-segments" className="xl:col-span-2">
          <Card className="p-5">
            <Eyebrow>Customer groups · {TARGETING[t].toLowerCase()}</Eyebrow>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[760px] text-[12.5px]">
                <thead className="text-left text-ink-3"><tr className="border-b border-rule"><th className="py-2 pr-2 font-medium">Group</th><th className="px-2 py-2 font-medium">Kind</th><th className="px-2 py-2 text-right font-medium">People</th><th className="px-2 py-2 text-right font-medium">Buy anyway</th><th className="px-2 py-2 text-right font-medium">With offer</th><th className="px-2 py-2 text-right font-medium">Extra orders</th><th className="px-2 py-2 text-right font-medium">Net if offered</th><th className="py-2 pl-2 text-right font-medium">Send?</th></tr></thead>
                <tbody>
                  {[...rows].sort((a, b) => b.perCustomer - a.perCustomer).map((r) => {
                    const on = cur.chosen.has(r.g.id)
                    return (
                      <tr key={r.g.id} className={cn('border-b border-rule-2 align-top', !on && 'text-ink-3')}>
                        <td className="py-2 pr-2"><div className={on ? 'text-ink' : ''}>{r.g.name}</div><div className="text-[11.5px] text-ink-3">{r.g.note}</div></td>
                        <td className="px-2 py-2"><Chip tone={KIND_TONE[r.kind]}>{KIND[r.kind].label}</Chip></td>
                        <td className="num px-2 py-2 text-right">{units(r.g.size)}</td>
                        <td className="num px-2 py-2 text-right">{pct(r.g.p0)}</td>
                        <td className={cn('num px-2 py-2 text-right', r.p1 < r.g.p0 && 'text-loss')}>{pct(r.p1)}</td>
                        <td className="num px-2 py-2 text-right">{r.incremental >= 0 ? units(r.incremental) : `−${units(-r.incremental)}`}</td>
                        <td className={cn('num px-2 py-2 text-right font-semibold', r.net >= 0 ? 'text-gain' : 'text-loss')}>{inrShort(r.net)}</td>
                        <td className="py-2 pl-2 text-right">{on ? <span className="text-gain">Send</span> : <span>Skip</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11.5px] text-ink-3">"Buy anyway" and "with offer" come from past campaigns that held back a random control group. Without a holdout, nobody can tell a persuadable from a sure thing.</p>
          </Card>
        </Spot>

        <Spot id="uplift-curve" className="xl:col-span-2">
          <Card className="p-5">
            <Eyebrow>Uplift curve</Eyebrow>
            <h3 className="display mt-1 text-[19px] text-ink">Profit as the offer reaches more people</h3>
            <div className="mt-3 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={curve} margin={{ top: 8, right: 12, bottom: 4, left: 8 }}>
                  <CartesianGrid stroke="var(--color-rule-2)" vertical={false} />
                  <XAxis dataKey="pct" tick={{ fontSize: 11, fill: 'var(--color-ink-3)' }} tickFormatter={(v) => `${v}%`} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-3)' }} tickFormatter={(v) => inrShort(v)} width={78} />
                  <ReferenceLine y={0} stroke="var(--color-rule)" />
                  <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-rule)', borderRadius: 10, fontSize: 12 }} labelFormatter={(v) => `Top ${v}% of customers`} formatter={(v) => inrShort(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line dataKey="uplift" name="Ranked by uplift" stroke="var(--color-gain)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  <Line dataKey="propensity" name="Ranked by likely to buy" stroke="var(--color-brass-2)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line dataKey="random" name="No ranking" stroke="var(--color-ink-3)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[12px] text-ink-3">The green line rises while it adds persuadables, then falls as it reaches sure things and sleeping dogs. The peak is where to stop sending.</p>
          </Card>
        </Spot>
      </div>
    </div>
  )
}
