import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { ArrowRight, ClipboardCopy, Printer, ThumbsDown, ThumbsUp } from 'lucide-react'
import { Card, Eyebrow, Money, PageHeader } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { debrief } from '@/ai/debrief'
import { useControls, useSeller } from '@/state/hooks'
import { inrShort, pct, units } from '@/lib/format'
import { cn } from '@/lib/cn'
import { AiByline, Rich, Typewriter, useGo } from './shared'

export function Debrief() {
  const seller = useSeller()
  const c = useControls()
  const d = useMemo(() => debrief(seller, c), [seller, c])
  const [typed, setTyped] = useState(false)
  const go = useGo()
  const t = d.truth
  const maxCat = Math.max(...d.byCat.map((k) => Math.abs(k.net)), 1)

  const copy = async () => {
    const text = [
      `${seller.brand} · ${d.event} debrief`, '', d.headline, d.summary, '',
      'What made money:', ...d.made.map((r) => `- ${r.name}: ${inrShort(r.net)}`), '',
      'What only looked good:', ...d.looked.map((r) => `- ${r.name}: revenue +${inrShort(r.revenueGain)}, profit ${inrShort(r.net)}`), '',
      'Next time:', ...d.changes.map((x, i) => `${i + 1}. ${x}`),
    ].join('\n')
    try { await navigator.clipboard.writeText(text); toast('Debrief copied', { description: 'Paste it into WhatsApp, email or a doc.' }) } catch { toast('Copy failed', { description: 'Your browser blocked clipboard access.' }) }
  }

  return (
    <div>
      <PageHeader eyebrow={`Sale debrief · ${seller.history.label}`} title={<>What the sale really did,<br /><span className="text-ink-3">in plain words.</span></>}
        aside={<div className="flex gap-2 print:hidden"><button onClick={copy} className="flex items-center gap-1.5 rounded-full border border-rule bg-card px-3 py-1.5 text-[12.5px] text-ink-2 hover:text-ink"><ClipboardCopy size={13} /> Copy</button><button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-full border border-rule bg-card px-3 py-1.5 text-[12.5px] text-ink-2 hover:text-ink"><Printer size={13} /> Print</button></div>}>
        The Truth Lens, narrated. Tarazu re-runs last festival's offer product by product and writes the report a seller would want the
        morning after: what made money, what only looked good, and what to change next time.
      </PageHeader>
      <Spot id="debrief-headline">
        <Card className="overflow-hidden p-0">
          <div className="bg-hero px-6 py-6 text-hero-ink">
            <div className="text-[11px] tracking-[0.14em] uppercase opacity-70">{d.event} · the short version</div>
            <h2 className="display mt-2 text-[28px] leading-tight md:text-[34px]"><Typewriter text={d.headline} speed={30} onDone={() => setTyped(true)} /></h2>
            <p className="mt-2 max-w-3xl text-[14px] leading-relaxed opacity-85">{typed ? d.summary : ' '}</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-rule-2 md:grid-cols-4">
            <Kpi label="Units vs expected" value={`+${pct(d.up)}`} sub={`${units(t.promoUnits)} vs ${units(t.baseUnits)}`} />
            <Kpi label="Truly new units" value={units(t.incremental)} sub={`${pct(t.incremental / Math.max(1, t.promoUnits))} of all units`} />
            <Kpi label="Net profit" value={inrShort(t.net)} sub="after every cost" tone={t.net >= 0 ? 'gain' : 'loss'} />
            <Kpi label="Tarazu's plan" value={inrShort(t.planNet)} sub="same event, targeted" tone="gain" />
          </div>
        </Card>
      </Spot>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Spot id="debrief-made"><List title="What made money" icon={<ThumbsUp size={14} className="text-gain" />} rows={d.made.map((r) => ({ id: r.id, name: r.name, sub: `${units(r.incremental)} truly new units`, value: r.net }))} onOpen={(id) => go(`/sku/${id}`, 'scale')} /></Spot>
        <Spot id="debrief-looked"><List title="What only looked good" icon={<ThumbsDown size={14} className="text-loss" />} rows={d.looked.map((r) => ({ id: r.id, name: r.name, sub: `revenue +${inrShort(r.revenueGain)}, but`, value: r.net }))} onOpen={(id) => go(`/sku/${id}`, 'scale')} /></Spot>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Spot id="debrief-categories">
          <Card className="p-5">
            <Eyebrow>Profit by category</Eyebrow>
            <ul className="mt-3 space-y-2">
              {d.byCat.map((k) => (
                <li key={k.category} className="grid grid-cols-[120px_1fr_70px] items-center gap-2 text-[12.5px]">
                  <span className="truncate text-ink-2">{k.category}</span>
                  <span className="relative h-3">
                    <span className="absolute inset-y-0 left-1/2 w-px bg-rule" />
                    <motion.span initial={{ width: 0 }} animate={{ width: `${(Math.abs(k.net) / maxCat) * 50}%` }} className={cn('absolute inset-y-0 rounded-sm', k.net >= 0 ? 'left-1/2 bg-gain' : 'right-1/2 bg-loss/85')} />
                  </span>
                  <span className={cn('num text-right font-medium', k.net >= 0 ? 'text-gain' : 'text-loss')}>{inrShort(k.net)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Spot>
        <Spot id="debrief-next">
          <Card className="border-beam p-5">
            <Eyebrow>Next time</Eyebrow>
            <ol className="mt-3 space-y-3">
              {d.changes.map((x, i) => (
                <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-ink-2">
                  <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brass-soft text-[11.5px] font-semibold text-brass">{i + 1}</span>
                  <Rich text={x} />
                </li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap gap-2 print:hidden">
              <button onClick={() => go('/brief')} className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-paper">Plan the next event <ArrowRight size={13} /></button>
              <button onClick={() => go('/truth', 'truth-peel')} className="rounded-full border border-rule px-3.5 py-1.5 text-[12.5px] text-ink-2 hover:text-ink">Peel it in Truth Lens</button>
            </div>
          </Card>
        </Spot>
      </div>
      <AiByline className="mt-4" />
    </div>
  )
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: 'gain' | 'loss' }) {
  return (
    <div className="p-4">
      <div className="text-[10.5px] tracking-wider text-ink-3 uppercase">{label}</div>
      <div className={cn('num mt-1 text-[22px] font-semibold', tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : 'text-ink')}>{value}</div>
      <div className="text-[11.5px] text-ink-3">{sub}</div>
    </div>
  )
}

function List({ title, icon, rows, onOpen }: { title: string; icon: React.ReactNode; rows: { id: string; name: string; sub: string; value: number }[]; onOpen: (id: string) => void }) {
  return (
    <Card className="h-full p-5">
      <div className="flex items-center gap-2">{icon}<Eyebrow>{title}</Eyebrow></div>
      {rows.length === 0 ? <p className="mt-3 text-[13px] text-ink-3">Nothing here: every product went the same way.</p> : (
        <ul className="mt-2 divide-y divide-rule-2">
          {rows.map((r) => (
            <li key={r.id}>
              <button onClick={() => onOpen(r.id)} className="flex w-full items-center gap-3 py-2.5 text-left">
                <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-ink hover:underline">{r.name}</span><span className="block text-[11.5px] text-ink-3">{r.sub}</span></span>
                <Money value={r.value} signed className={cn('text-[13.5px] font-semibold', r.value >= 0 ? 'text-gain' : 'text-loss')} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
