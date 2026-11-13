import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, Check, FlaskConical } from 'lucide-react'
import { Card, Chip, Eyebrow, PageHeader, Segmented, Slider } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { FRONTIER } from '@/data/frontier'
import { peekingPath, readout, testPlan } from '@/engine/frontier'
import { useControls, useSeller } from '@/state/hooks'
import { pct, units } from '@/lib/format'
import { cn } from '@/lib/cn'

type Q = 'holdout' | 'depth'
const RULES = [
  'Pick the metric before starting: profit per visitor, not conversion.',
  'Split by customer, not by visit, so nobody sees both offers.',
  'Run whole weeks, so weekends count equally in both groups.',
  'Decide the sample size first and don\'t stop early on a good day.',
  'Keep a small holdout with no offer, always, to measure what the offers add.',
]

export function Experiments() {
  const seller = useSeller(), c = useControls()
  const E = FRONTIER[seller.id].experiments
  const [q, setQ] = useState<Q>('depth')
  const [mde, setMde] = useState(0.1)
  const [share, setShare] = useState(1)
  const [alpha, setAlpha] = useState<'0.1' | '0.05' | '0.01'>('0.05')
  const [power, setPower] = useState<'0.8' | '0.9'>('0.8')
  const plan = testPlan(E, mde, share, Number(alpha), Number(power))
  const [dA, dB] = q === 'holdout' ? [0, 0.1] : [0.1, 0.15]
  const r = readout(E, seller, dA, dB, plan.n)
  const peek = useMemo(() => peekingPath(28), [])
  const late = plan.days > c.daysToEvent
  const convWin = r.pB > r.pA && r.p < Number(alpha)
  const profitWin = r.profitB > r.profitA
  const label = (d: number) => (d ? `${pct(d)} off` : 'No offer')
  return (
    <div>
      <PageHeader eyebrow="Experiments" title={<>Test the offer<br /><span className="text-ink-3">before trusting it.</span></>}>
        Every number in Tarazu is an estimate until a test confirms it. A proper test splits customers at random, runs long enough to tell a
        real difference from noise, and judges the offer on profit, not on how many people used it.
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Spot id="experiment-plan">
          <Card className="h-full p-5">
            <Eyebrow>Test design · {E.where}</Eyebrow>
            <Segmented<Q> size="sm" value={q} onChange={setQ} options={[{ value: 'depth', label: '10% off vs 15% off' }, { value: 'holdout', label: 'Offer vs no offer' }]} className="mt-3" />
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-paper-2/70 p-3"><div className="text-[12px] text-ink-3">Visitors per group</div><div className="num mt-1 text-[22px] font-semibold text-ink">{units(plan.n)}</div></div>
              <div className={cn('rounded-xl p-3', late ? 'bg-loss-soft/50' : 'bg-paper-2/70')}><div className="text-[12px] text-ink-3">Days to run</div><div className="num mt-1 text-[22px] font-semibold text-ink">{plan.days}</div></div>
              <div className="rounded-xl bg-paper-2/70 p-3"><div className="text-[12px] text-ink-3">Visitors a day in the test</div><div className="num mt-1 text-[22px] font-semibold text-ink">{units(E.traffic * share)}</div></div>
            </div>
            {late && <p className="mt-3 flex gap-1.5 rounded-lg bg-warn-soft/60 p-2.5 text-[12px] text-brass-ink"><AlertTriangle size={13} className="mt-0.5 shrink-0" /> The test ends after {seller.event} ({c.daysToEvent} days away). Test a bigger difference, or put more traffic in the test.</p>}
            {E.method === 'weeks' && <p className="mt-3 text-[12px] text-ink-3">Marketplaces don't split one listing's visitors, so the two offers alternate week by week (or city by city). That needs more time and is weaker than a true split.</p>}
            <p className="mt-3 text-[12px] leading-snug text-ink-3">To spot a {pct(mde)} change on a {pct(E.conversion, 1)} conversion rate with {pct(1 - Number(alpha))} confidence, each group needs {units(plan.n)} visitors. Halving the change you want to detect roughly quadruples that.</p>
          </Card>
        </Spot>
        <Card className="h-fit p-5">
          <div className="flex items-center gap-2 text-primary"><FlaskConical size={15} /><Eyebrow>Settings</Eyebrow></div>
          <div className="mt-3 space-y-4 text-[12.5px]">
            <div><div className="flex justify-between"><span className="text-ink-2">Smallest change worth finding</span><span className="num font-semibold text-ink">{pct(mde)}</span></div><Slider label="Minimum detectable effect" min={0.03} max={0.3} step={0.01} value={mde} onChange={setMde} className="mt-1.5" /></div>
            <div><div className="flex justify-between"><span className="text-ink-2">Traffic in the test</span><span className="num font-semibold text-ink">{pct(share)}</span></div><Slider label="Traffic share" min={0.1} max={1} step={0.05} value={share} onChange={setShare} className="mt-1.5" /></div>
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-ink-2">Confidence</span><Segmented size="sm" value={alpha} onChange={setAlpha} options={[{ value: '0.1', label: '90%' }, { value: '0.05', label: '95%' }, { value: '0.01', label: '99%' }]} /></div>
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-ink-2">Power</span><Segmented size="sm" value={power} onChange={setPower} options={[{ value: '0.8', label: '80%' }, { value: '0.9', label: '90%' }]} /></div>
          </div>
        </Card>

        <Spot id="experiment-peeking">
          <Card className="h-full p-5">
            <Eyebrow>Why not check every day?</Eyebrow>
            <h3 className="display mt-1 text-[19px] text-ink">Two identical offers, checked daily</h3>
            <div className="mt-3 h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={peek.path} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid stroke="var(--color-rule-2)" vertical={false} />
                  <ReferenceArea y1={0} y2={0.05} fill="var(--color-loss)" fillOpacity={0.08} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-ink-3)' }} tickFormatter={(v) => `D${v}`} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-3)' }} domain={[0, 1]} width={36} />
                  <ReferenceLine y={0.05} stroke="var(--color-loss)" strokeDasharray="4 4" label={{ value: '"Significant"', position: 'insideTopRight', fontSize: 11, fill: 'var(--color-loss)' }} />
                  <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-rule)', borderRadius: 10, fontSize: 12 }} labelFormatter={(v) => `Day ${v}`} formatter={(v) => [Number(v).toFixed(3), 'p-value']} />
                  <Line dataKey="p" stroke="var(--color-primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  {peek.firstDip > 0 && <ReferenceDot x={peek.firstDip} y={peek.path[peek.firstDip - 1].p} r={5} fill="var(--color-loss)" stroke="var(--color-card)" strokeWidth={2} />}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[12px] leading-snug text-ink-3">The two offers are the same, so there is nothing to find. A daily check still shows a "winner" on day {peek.firstDip}; by day 28 the difference has gone. Stopping at the first good day is how teams ship offers that never worked.</p>
          </Card>
        </Spot>

        <Spot id="experiment-readout">
          <Card className="h-full p-5">
            <Eyebrow>If the test runs as planned</Eyebrow>
            <h3 className="display mt-1 text-[19px] text-ink">{label(dA)} vs {label(dB)}</h3>
            <dl className="mt-3 space-y-2 text-[12.5px]">
              <div className="flex justify-between"><dt className="text-ink-3">Conversion</dt><dd className="num text-ink">{pct(r.pA, 2)} → {pct(r.pB, 2)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-3">Change, 95% range</dt><dd className="num text-ink">{pct(r.ci[0])} to {pct(r.ci[1])}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-3">Profit per visitor</dt><dd className="num text-ink">₹{r.profitA.toFixed(2)} → ₹{r.profitB.toFixed(2)}</dd></div>
            </dl>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between rounded-lg border border-rule-2 px-3 py-2 text-[12.5px]"><span className="text-ink-2">Judged on conversion</span><Chip tone={convWin ? 'gain' : 'quiet'}>{convWin ? `${label(dB)} wins` : 'No clear winner'}</Chip></div>
              <div className="flex items-center justify-between rounded-lg border border-rule-2 px-3 py-2 text-[12.5px]"><span className="text-ink-2">Judged on profit</span><Chip tone={profitWin ? 'gain' : 'loss'}>{profitWin ? `${label(dB)} wins` : `${label(dA)} wins`}</Chip></div>
            </div>
            <p className="mt-3 text-[12px] leading-snug text-ink-3">{convWin && !profitWin ? 'A deeper offer almost always wins on conversion. Judged on profit, it can lose. Decide the metric before the test starts.' : 'Here both measures agree, which is worth confirming rather than assuming.'}</p>
          </Card>
        </Spot>

        <Spot id="experiment-rules" className="xl:col-span-2">
          <Card className="p-5">
            <Eyebrow>Five rules for a fair test</Eyebrow>
            <ul className="mt-3 grid gap-2 md:grid-cols-2">{RULES.map((x) => <li key={x} className="flex gap-2 text-[12.5px] text-ink-2"><Check size={14} className="mt-0.5 shrink-0 text-gain" />{x}</li>)}</ul>
          </Card>
        </Spot>
      </div>
    </div>
  )
}
