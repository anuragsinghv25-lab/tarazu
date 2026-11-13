import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { ArrowRight, Check, FilePlus2, Wand2 } from 'lucide-react'
import { Card, Chip, Eyebrow, Money, PageHeader } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { buildPlan, examples, parseBrief, type BriefPlan } from '@/ai/brief'
import { newCampaign } from '@/features/campaigns/templates'
import { useControls, useSeller } from '@/state/hooks'
import { useStore } from '@/state/store'
import { inrShort, pct, units } from '@/lib/format'
import { cn } from '@/lib/cn'
import { AiByline, Thinking, useGo } from './shared'

export function Brief() {
  const seller = useSeller()
  const base = useControls()
  const ex = examples(seller)
  const [text, setText] = useState(ex[0])
  const [submitted, setSubmitted] = useState<string | null>(ex[0])
  const [ready, setReady] = useState(false)
  const parsed = useMemo(() => (submitted ? parseBrief(submitted, seller) : null), [submitted, seller])
  const plan = useMemo(() => (parsed ? buildPlan(seller, base, parsed) : null), [parsed, seller, base])
  const run = (t = text) => { setSubmitted(t); setReady(false) }

  return (
    <div>
      <PageHeader eyebrow="Brief to plan" title={<>Say what you want.<br /><span className="text-ink-3">Get a plan to review.</span></>}>
        Write a goal the way you'd say it to a manager: how much stock to clear, the margin you won't go below, what to leave alone.
        Tarazu reads the brief, sets the engine to match, and builds the plan from its own recommendations.
      </PageHeader>
      <Spot id="brief-input">
        <Card className="p-5">
          <label htmlFor="brief" className="text-[11px] font-semibold tracking-[0.14em] text-ink-3 uppercase">Your brief</label>
          <textarea id="brief" value={text} onChange={(e) => setText(e.target.value)} rows={2}
            className="mt-2 w-full resize-none rounded-xl border border-rule bg-paper px-4 py-3 text-[15px] text-ink outline-none focus:border-brass/60" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={() => run()} className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-paper"><Wand2 size={14} className="text-brass-2" /> Build the plan</button>
            <span className="text-[12px] text-ink-3">or try:</span>
            {ex.map((e) => <button key={e} onClick={() => { setText(e); run(e) }} className="max-w-full truncate rounded-full border border-rule px-3 py-1 text-[12px] text-ink-2 hover:border-brass/50 hover:text-ink">{e}</button>)}
          </div>
        </Card>
      </Spot>
      {parsed && plan && (
        <div className="mt-5">
          <Spot id="brief-read">
            <Card className="p-5">
              <Eyebrow>How Tarazu read it</Eyebrow>
              <div className="mt-2 flex flex-wrap gap-2">
                {parsed.chips.length ? parsed.chips.map((c) => <Chip key={c.label + c.value} tone="brass"><span className="opacity-70">{c.label}:</span> {c.value}</Chip>) : <span className="text-[13px] text-ink-3">No target found; planning for {seller.name}'s current goal and margin floor.</span>}
                <Chip tone="quiet"><span className="opacity-70">Margin floor used:</span> {pct(plan.controls.marginFloor)}</Chip>
              </div>
              {!ready && <div className="mt-4"><Thinking key={submitted} steps={[`Set the goal to "${plan.controls.goal}" and the floor to ${pct(plan.controls.marginFloor)}`, `Ran the Scale on all ${seller.skus.length} products`, 'Dropped offers that lose money after fees and cannibalisation', parsed.target ? `Picked offers until ${inrShort(parsed.target)} of stock clears` : 'Ranked offers by net impact']} onDone={() => setReady(true)} /></div>}
            </Card>
          </Spot>
          {ready && <Plan plan={plan} />}
        </div>
      )}
    </div>
  )
}

function Plan({ plan }: { plan: BriefPlan }) {
  const seller = useSeller()
  const { saveCampaign } = useStore()
  const go = useGo()
  const [added, setAdded] = useState(false)
  const pctOfTarget = plan.target ? Math.min(1, plan.cleared / plan.target) : 1
  const addAll = () => {
    plan.items.forEach(({ rec: r }, i) => saveCampaign(newCampaign(seller, 'Percentage off', {
      id: `brief-${r.sku.id}-${i}`, name: `${r.mechanic}: ${r.sku.line} ${pct(r.discount)} off`, status: 'draft', startDay: 1, endDay: r.weeks * 7,
      conditions: [{ kind: 'hasSku', value: r.sku.id }], reward: { kind: 'pctOff', value: r.discount, target: 'sku', ref: r.sku.id },
      budget: Math.max(3000, Math.round((r.result.subsidyCost + r.result.dealFees) / 1000) * 1000), dailyRedemptions: Math.max(1, Math.round(r.result.promoUnits / (r.weeks * 7))),
      note: 'Drafted from a brief',
    })))
    setAdded(true)
    toast(`${plan.items.length} drafts added`, { description: 'They are in the Campaign builder, waiting for review.' })
  }
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
      <Spot id="brief-plan">
        <Card className="p-5">
          <Eyebrow>The plan · {plan.items.length} offers, {plan.holds} products at full price</Eyebrow>
          <ol className="mt-3 divide-y divide-rule-2">
            {plan.items.map(({ rec: r, clears }, i) => (
              <motion.li key={r.sku.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 py-2.5">
                <span className="num w-5 text-[11.5px] text-ink-3">{String(i + 1).padStart(2, '0')}</span>
                <button onClick={() => go(`/sku/${r.sku.id}`, 'scale')} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-[13.5px] text-ink hover:underline">{r.sku.name}</span>
                  <span className="block truncate text-[11.5px] text-ink-3">{r.mechanic} · {pct(r.discount)} for {r.weeks} wk · clears {units(Math.max(0, r.result.promoUnits - r.result.baseUnits))} extra units</span>
                </button>
                <span className="num hidden w-24 text-right text-[12px] whitespace-nowrap text-ink-3 sm:block">{clears > 0 ? `${inrShort(clears)} stock` : '—'}</span>
                <Money value={r.result.net} signed className="w-20 text-right text-[13.5px] font-semibold text-gain" />
              </motion.li>
            ))}
          </ol>
          {plan.notes.length > 0 && <ul className="mt-3 space-y-1 rounded-xl bg-paper-2/70 p-3 text-[12.5px] leading-snug text-ink-2">{plan.notes.map((n) => <li key={n}>· {n}</li>)}</ul>}
        </Card>
      </Spot>
      <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <Card className="border-beam p-5">
          <Eyebrow>Against the brief</Eyebrow>
          {plan.target ? (
            <>
              <div className="mt-2 flex items-baseline justify-between"><span className="text-[12.5px] text-ink-2">Stock cleared</span><span className="num text-[13px] text-ink">{inrShort(plan.cleared)} / {inrShort(plan.target)}</span></div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-2"><motion.div className={cn('h-full rounded-full', plan.short ? 'bg-warn' : 'bg-gain')} initial={{ width: 0 }} animate={{ width: `${pctOfTarget * 100}%` }} /></div>
            </>
          ) : <div className="mt-2 text-[12.5px] text-ink-2">No stock target in the brief: ranked by profit.</div>}
          <div className="mt-4 text-[12px] text-ink-3">Net impact of the plan</div>
          <Money value={plan.net} signed className="text-[30px] leading-none font-semibold text-gain" />
          <div className="mt-2 text-[12px] text-ink-3">Every offer stays above a {pct(plan.controls.marginFloor)} margin.</div>
          <button onClick={addAll} disabled={added} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-[13px] font-medium text-paper disabled:opacity-60">
            {added ? <><Check size={14} /> Added as drafts</> : <><FilePlus2 size={14} /> Add {plan.items.length} drafts to review</>}
          </button>
          {added && <button onClick={() => go('/campaigns', 'campaign-list')} className="mt-2 flex w-full items-center justify-center gap-1.5 text-[12.5px] font-medium text-brass">Open the Campaign builder <ArrowRight size={13} /></button>}
        </Card>
        <AiByline className="px-1" />
      </div>
    </motion.div>
  )
}
