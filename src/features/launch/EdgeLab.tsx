import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { FlaskConical, Star } from 'lucide-react'
import { Card, Chip, Eyebrow, PageHeader, Slider, Switch } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { CASES, DEMOS, GROUPS, type EdgeCase } from '@/engine/edge'
import { cn } from '@/lib/cn'

export function EdgeLab() {
  const [only, setOnly] = useState(false)
  const [sel, setSel] = useState<string>(CASES.find((c) => c.demo)!.id)
  const [q, setQ] = useState('')
  const list = CASES.filter((c) => (!only || c.demo) && (!q || `${c.title} ${c.example} ${c.rule}`.toLowerCase().includes(q.toLowerCase())))
  const current = CASES.find((c) => c.id === sel)!
  return (
    <div>
      <PageHeader eyebrow="Edge-case lab" title={<>A builder is judged<br /><span className="text-ink-3">by what it does when things go wrong.</span></>}>
        {CASES.length} edge cases across {GROUPS.length} areas, each with the rule Tarazu applies. The {CASES.filter((c) => c.demo).length} starred ones run live:
        change the inputs and compare what happens without the rule against what happens with it. These are the acceptance criteria for the builder.
      </PageHeader>
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Spot id="edge-catalogue">
          <Card className="p-0">
            <div className="flex flex-wrap items-center gap-3 border-b border-rule p-3">
              <input aria-label="Search edge cases" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search edge cases" className="min-w-0 flex-1 rounded-full border border-rule bg-paper px-3 py-1.5 text-[12.5px] text-ink outline-none focus:border-brass/60" />
              <label className="flex items-center gap-2 text-[12.5px] text-ink-2"><Switch checked={only} onChange={setOnly} label="Runnable only" /> Runnable only</label>
            </div>
            <div className="max-h-[680px] overflow-auto">
              {GROUPS.map((g) => {
                const items = list.filter((c) => c.group === g)
                if (!items.length) return null
                return (
                  <section key={g}>
                    <div className="sticky top-0 z-10 bg-card/95 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-ink-3 uppercase backdrop-blur">{g}</div>
                    <ul>
                      {items.map((c) => (
                        <li key={c.id}>
                          <button onClick={() => c.demo && setSel(c.id)} className={cn('grid w-full grid-cols-[18px_1fr] gap-2 border-b border-rule-2 px-4 py-2.5 text-left', c.demo ? 'hover:bg-paper-2/70' : 'cursor-default', sel === c.id && 'bg-surface')}>
                            {c.demo ? <Star size={13} className="mt-0.5 fill-brass-2 text-brass-2" /> : <span />}
                            <span><span className="block text-[13px] font-medium text-ink">{c.title}</span><span className="block text-[12px] text-ink-3">{c.example}</span><span className="mt-0.5 block text-[12px] text-ink-2"><b className="font-medium text-gain">Rule:</b> {c.rule}</span></span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              })}
            </div>
          </Card>
        </Spot>
        <div className="xl:sticky xl:top-24 xl:self-start"><Spot id="edge-run"><Runner key={current.id} c={current} /></Spot></div>
      </div>
    </div>
  )
}

function Runner({ c }: { c: EdgeCase }) {
  const demo = DEMOS[c.demo!]
  const [v, setV] = useState<Record<string, number>>(() => Object.fromEntries(demo.inputs.map((i) => [i.key, i.value])))
  const r = useMemo(() => demo.run(v), [demo, v])
  return (
    <Card className="border-beam p-5">
      <div className="flex items-center gap-2 text-brass"><FlaskConical size={15} /><Eyebrow className="text-brass">Run it</Eyebrow></div>
      <h2 className="display mt-1 text-[21px] leading-tight text-ink">{c.title}</h2>
      <p className="mt-1 text-[12.5px] text-ink-3">{c.example}</p>
      <div className="mt-4 space-y-3">
        {demo.inputs.map((i) => (
          <div key={i.key}>
            <div className="flex justify-between text-[12.5px]"><span className="text-ink-2">{i.label}</span><span className="num font-semibold text-ink">{i.unit === '%' ? `${Math.round(v[i.key] * 100)}%` : v[i.key]}</span></div>
            <Slider label={i.label} min={i.min} max={i.max} step={i.step} value={v[i.key]} onChange={(x) => setV({ ...v, [i.key]: x })} className="mt-1.5" />
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-2">
        <motion.div key={r.without} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="rounded-xl border border-loss/25 bg-loss-soft/50 p-3"><Chip tone="loss">Without the rule</Chip><p className="mt-1.5 text-[13px] text-ink">{r.without}</p></motion.div>
        <motion.div key={r.with} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="rounded-xl border border-gain/30 bg-gain-soft/60 p-3"><Chip tone="gain">With Tarazu's rule</Chip><p className="mt-1.5 text-[13px] font-medium text-ink">{r.with}</p></motion.div>
      </div>
      <p className="mt-3 text-[12px] leading-snug text-ink-3">{r.detail}</p>
    </Card>
  )
}
