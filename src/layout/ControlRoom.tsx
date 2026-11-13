import * as Dialog from '@radix-ui/react-dialog'
import { X, RotateCcw, Zap } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useStore, AFFECTS } from '@/state/store'
import type { Knobs, Goal, FeeLevel, Strategy, DataQuality } from '@/engine/types'
import { useSeller } from '@/state/hooks'
import { Segmented, Slider, Eyebrow } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { cn } from '@/lib/cn'
import { AutonomyDial } from '@/features/mind/alerts'

const WIDGET_NAME: Record<string, string> = {
  opportunity: 'Opportunity', actions: 'Top actions', 'pulse-grid': 'Stock Pulse', scale: 'Scale', curve: 'Profit curve',
  why: 'Why card', truth: 'Truth Lens', compare: 'Platform compare', 'event-chip': 'Event chip',
}

function Affects({ k }: { k: keyof Knobs }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {AFFECTS[k].slice(0, 5).map((id) => (
        <span key={id} className="rounded-full bg-paper-2 px-1.5 py-px text-[10px] text-ink-3">{WIDGET_NAME[id] ?? id}</span>
      ))}
    </div>
  )
}

function Row({ k, label, value, hint, children }: { k: keyof Knobs; label: string; value: ReactNode; hint?: string; children: ReactNode }) {
  return (
    <div className="py-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[13px] font-medium text-ink">{label}</div>
        <div className="num text-[13px] font-semibold text-brass">{value}</div>
      </div>
      {hint && <div className="text-[11.5px] text-ink-3">{hint}</div>}
      <div className="mt-2">{children}</div>
      <Affects k={k} />
    </div>
  )
}

export function ControlRoom() {
  const { roomOpen, setRoom, controls: c, setControl, commit, applyScenario, reset, log } = useStore()
  const seller = useSeller()
  const num = <K extends keyof Knobs>(k: K) => ({
    value: c[k] as number,
    onChange: (v: number) => setControl(k, v as Knobs[K]),
    onCommit: () => commit(k),
  })
  const pick = <K extends keyof Knobs>(k: K) => (v: Knobs[K]) => { setControl(k, v); setTimeout(() => commit(k), 0) }

  return (
    <Dialog.Root open={roomOpen} onOpenChange={setRoom}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px] data-[state=open]:animate-[fadeIn_.2s]" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-rule bg-paper shadow-[var(--shadow-lift)] data-[state=closed]:animate-[slideOut_.22s_ease-in] data-[state=open]:animate-[slideIn_.28s_cubic-bezier(.2,.8,.2,1)]">
          <div className="flex items-start justify-between border-b border-rule px-5 pt-5 pb-4">
            <Spot id="control-room">
              <div>
                <Eyebrow>Prototype controls</Eyebrow>
                <Dialog.Title className="display mt-1 text-[26px] leading-none text-ink">Control Room</Dialog.Title>
                <Dialog.Description className="mt-1.5 text-[12.5px] text-ink-2">Change {seller.name}'s market. Every screen that depends on a control glows when it changes.</Dialog.Description>
              </div>
            </Spot>
            <Dialog.Close className="rounded-full p-1.5 text-ink-3 hover:bg-paper-2 hover:text-ink" aria-label="Close"><X size={18} /></Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-6">
            <section className="pt-4">
              <div className="mb-2 flex items-center justify-between">
                <Eyebrow>Scenario presets</Eyebrow>
                <button onClick={reset} className="flex items-center gap-1 text-[11.5px] text-ink-3 hover:text-ink"><RotateCcw size={12} /> Reset</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {seller.presets.map((s) => {
                  const on = c.scenario === s.id
                  return (
                    <motion.button key={s.id} whileTap={{ scale: 0.97 }} onClick={() => applyScenario(s.id)}
                      className={cn('rounded-xl border p-2.5 text-left transition-colors', on ? 'border-primary bg-primary text-paper' : 'border-rule bg-card hover:border-ink-3/40')}>
                      <div className="flex items-center gap-1.5 text-[12.5px] font-semibold">{on && <Zap size={12} className="text-brass-2" />}{s.label}</div>
                      <div className={cn('mt-0.5 text-[11px] leading-snug', on ? 'text-paper/70' : 'text-ink-3')}>{s.blurb}</div>
                    </motion.button>
                  )
                })}
              </div>
              {c.scenario === 'custom' && <div className="mt-2 text-[11.5px] text-ink-3">Custom mix — you've tuned the controls by hand.</div>}
            </section>

            <section className="mt-5">
              <Eyebrow>Market</Eyebrow>
              <div className="divide-y divide-rule-2">
                <Row k="seasonality" label="Seasonal demand" value={`${c.seasonality.toFixed(2)}×`} hint="Festive boost or monsoon slump">
                  <Slider label="Seasonal demand" min={0.5} max={2.5} step={0.05} {...num('seasonality')} />
                </Row>
                <Row k="elasticityMult" label="Price sensitivity" value={`${c.elasticityMult.toFixed(2)}×`} hint="Loyal buyers ← → bargain hunters">
                  <Slider label="Price sensitivity" min={0.4} max={2} step={0.05} {...num('elasticityMult')} />
                </Row>
                <Row k="competitorPrice" label="Competitor price" value={`${c.competitorPrice > 0 ? '+' : ''}${Math.round(c.competitorPrice * 100)}%`} hint="Rivals cutting prices pulls demand away">
                  <Slider label="Competitor price" min={-0.3} max={0.2} step={0.01} {...num('competitorPrice')} />
                </Row>
                <Row k="pullForward" label="Pull-forward" value={`${Math.round(c.pullForward * 100)}%`} hint="Share of promo sales that were only bought early">
                  <Slider label="Pull-forward" min={0} max={0.4} step={0.01} {...num('pullForward')} />
                </Row>
                <Row k="daysToEvent" label="Days to sale event" value={`${c.daysToEvent} d`}>
                  <Slider label="Days to sale event" min={0} max={60} step={1} {...num('daysToEvent')} />
                </Row>
              </div>
            </section>

            <section className="mt-3">
              <Eyebrow>Cost and stock</Eyebrow>
              <div className="divide-y divide-rule-2">
                <Row k="feeLevel" label="Platform fees" value={c.feeLevel}>
                  <Segmented<FeeLevel> size="sm" value={c.feeLevel} onChange={pick('feeLevel')} options={[{ value: 'low', label: 'Low' }, { value: 'current', label: 'Current' }, { value: 'high', label: 'High' }]} />
                </Row>
                <Row k="stockMult" label="Stock level" value={`${c.stockMult.toFixed(1)}×`} hint="Multiplies stock on hand for every SKU">
                  <Slider label="Stock level" min={0.5} max={3} step={0.1} {...num('stockMult')} />
                </Row>
              </div>
            </section>

            <section className="mt-3">
              <Eyebrow>Seller policy</Eyebrow>
              <div className="divide-y divide-rule-2">
                <Row k="marginFloor" label="Margin floor" value={`${Math.round(c.marginFloor * 100)}%`} hint="Never sell below this gross margin">
                  <Slider label="Margin floor" min={0.05} max={0.4} step={0.01} {...num('marginFloor')} />
                </Row>
                <Row k="goal" label="Seller goal" value={c.goal}>
                  <Segmented<Goal> size="sm" value={c.goal} onChange={pick('goal')} options={[{ value: 'clear', label: 'Clear stock' }, { value: 'grow', label: 'Grow' }, { value: 'margin', label: 'Protect margin' }]} />
                </Row>
                <Row k="strategy" label="Pricing strategy" value={c.strategy === 'hilo' ? 'Hi-Lo' : c.strategy === 'edlp' ? 'EDLP' : 'Balanced'} hint="Hi-Lo trains buyers to wait for sales; EDLP keeps prices steady">
                  <Segmented<Strategy> size="sm" value={c.strategy} onChange={pick('strategy')} options={[{ value: 'edlp', label: 'EDLP' }, { value: 'balanced', label: 'Balanced' }, { value: 'hilo', label: 'Hi-Lo' }]} />
                </Row>
                <Row k="dataQuality" label="Sales data quality" value={c.dataQuality} hint="Messy feeds lower confidence on every recommendation">
                  <Segmented<DataQuality> size="sm" value={c.dataQuality} onChange={pick('dataQuality')} options={[{ value: 'clean', label: 'Clean' }, { value: 'messy', label: 'Messy' }]} />
                </Row>
                <div className="py-3">
                  <div className="mb-2 flex items-center justify-between text-[13px] font-medium text-ink"><span>AI autonomy</span><span className="text-[11px] text-ink-3">Watchtower</span></div>
                  <AutonomyDial />
                </div>
              </div>
            </section>

            <section className="mt-4">
              <Eyebrow>Impact log</Eyebrow>
              {log.length === 0 ? (
                <div className="mt-2 rounded-xl border border-dashed border-rule p-3 text-[12px] text-ink-3">Move any control or pick a scenario. Each change is recorded here with what it did to the plan.</div>
              ) : (
                <ol className="mt-2 space-y-2">
                  {log.map((e) => (
                    <motion.li key={e.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-rule bg-card p-2.5">
                      <div className="flex justify-between text-[12px] font-medium text-ink"><span>{e.text}</span><span className="num text-[10.5px] text-ink-3">{e.at.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div>
                      <div className="mt-0.5 text-[11.5px] leading-snug text-ink-2">{e.detail}</div>
                    </motion.li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
