import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { AlertTriangle, ArrowRight, Bot, Clock4, Hourglass, Layers, PackageX, Receipt, ShieldCheck, Swords, TrendingDown, Undo2, Wallet, type LucideIcon } from 'lucide-react'
import { Card, Chip, Eyebrow, PageHeader, Slider, Switch } from '@/components/ui'
import { Spot } from '@/components/Spot'
import type { Alert } from '@/ai/watch'
import { AutonomyDial, useAlerts } from './alerts'
import { useMind } from '@/state/mind'
import { inrShort, pct } from '@/lib/format'
import { cn } from '@/lib/cn'
import { AiByline, useApply, useGo } from './shared'

const ICON: Record<Alert['icon'], LucideIcon> = { stock: PackageX, expiry: Hourglass, rival: Swords, leak: AlertTriangle, budget: Wallet, slow: TrendingDown, fatigue: Layers, deduction: Receipt }
const SEV = { urgent: { label: 'Act now', tone: 'loss' as const }, watch: { label: 'Watch', tone: 'warn' as const }, idea: { label: 'Idea', tone: 'quiet' as const } }

export function Watchtower() {
  const alerts = useAlerts()
  const { autonomy, guardrails, setGuardrails, setAlert, logAction, actions, clearAction } = useMind()
  const apply = useApply()
  const go = useGo()

  // Act within guardrails: apply safe, open alerts on their own and record them with an undo.
  useEffect(() => {
    if (autonomy !== 'act') return
    for (const a of alerts) {
      if (a.status !== 'open' || !a.safe || !a.action) continue
      const undo = apply(a.action.changes)
      setAlert(a.key, 'auto')
      logAction({ id: a.key, text: a.action.done, undo: () => { undo(); setAlert(a.key, 'open') } })
      toast(`Tarazu: ${a.action.done}`, { description: a.why })
    }
  }, [autonomy, alerts.map((a) => a.key + a.status).join()]) // eslint-disable-line react-hooks/exhaustive-deps

  const open = alerts.filter((a) => a.status === 'open')
  const handled = alerts.filter((a) => a.status !== 'open' && a.status !== 'snoozed')
  const atStake = open.reduce((s, a) => s + Math.max(0, a.stake), 0)

  const approve = (a: (typeof alerts)[number]) => {
    if (!a.action) return
    const undo = apply(a.action.changes)
    setAlert(a.key, 'approved')
    logAction({ id: a.key, text: a.action.done, undo: () => { undo(); setAlert(a.key, 'open') } })
    toast(a.action.done, { action: { label: 'Undo', onClick: () => { undo(); setAlert(a.key, 'open') } } })
  }

  return (
    <div>
      <PageHeader eyebrow="Watchtower" title={<>Tarazu keeps watch.<br /><span className="text-ink-3">You decide how much it does.</span></>}
        aside={<div className="hidden text-right md:block"><div className="text-[11px] tracking-wider text-ink-3 uppercase">Open · at stake</div><div className="num text-[26px] font-semibold text-ink">{open.length} · {inrShort(atStake)}</div></div>}>
        Stock ageing, a rival's price cut, a code that leaks, a budget burning too fast, an offer nobody uses: each one arrives with the
        money at stake and one action. The autonomy dial sets whether Tarazu waits for you or acts inside your guardrails.
      </PageHeader>
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Spot id="alerts">
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {open.map((a) => {
                const Icon = ICON[a.icon]
                return (
                  <motion.div key={a.key} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}>
                    <Card className={cn('p-4', a.severity === 'urgent' && 'border-loss/30')}>
                      <div className="flex items-start gap-3">
                        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', a.severity === 'urgent' ? 'bg-loss-soft text-loss' : a.severity === 'watch' ? 'bg-warn-soft text-warn' : 'bg-paper-2 text-ink-2')}><Icon size={17} /></span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2"><Chip tone={SEV[a.severity].tone}>{SEV[a.severity].label}</Chip>{a.stake > 0 && <span className="num text-[12px] text-ink-3">{inrShort(a.stake)} at stake</span>}</div>
                          <div className="mt-1 text-[14.5px] font-semibold text-ink">{a.title}</div>
                          <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{a.body}</p>
                          {a.why && autonomy !== 'suggest' && <p className={cn('mt-1.5 flex items-center gap-1.5 text-[11.5px]', a.safe ? 'text-gain' : 'text-warn')}><ShieldCheck size={12} /> {a.why}</p>}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {a.action && autonomy !== 'suggest' && <button onClick={() => approve(a)} className="rounded-full bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-paper">{a.action.label}</button>}
                            {a.alt && autonomy !== 'suggest' && <button onClick={() => { setAlert(a.key, 'snoozed'); toast(a.alt!.done) }} className="rounded-full border border-rule px-3 py-1.5 text-[12.5px] text-ink-2 hover:text-ink">{a.alt.label}</button>}
                            <button onClick={() => go(a.to, a.focus)} className="flex items-center gap-1 px-1 text-[12.5px] font-medium text-brass hover:text-ink">See why <ArrowRight size={12} /></button>
                            <button onClick={() => setAlert(a.key, 'dismissed')} className="ml-auto text-[12px] text-ink-3 hover:text-ink">Dismiss</button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {open.length === 0 && <Card className="p-8 text-center text-[13.5px] text-ink-3">All clear. Tarazu will flag the next thing that needs a decision.</Card>}
            {handled.length > 0 && (
              <div className="pt-2">
                <Eyebrow>Handled</Eyebrow>
                <ul className="mt-2 space-y-1.5">
                  {handled.map((a) => (
                    <li key={a.key} className="flex items-center gap-2 rounded-xl border border-rule-2 bg-card/60 px-3 py-2 text-[12.5px]">
                      {a.status === 'auto' ? <Bot size={14} className="text-brass" /> : a.status === 'approved' ? <ShieldCheck size={14} className="text-gain" /> : <Clock4 size={14} className="text-ink-3" />}
                      <span className="min-w-0 flex-1 truncate text-ink-2">{a.status === 'dismissed' ? `Dismissed: ${a.title}` : a.action?.done ?? a.title}</span>
                      <span className="text-[11px] text-ink-3">{a.status === 'auto' ? 'by Tarazu' : a.status === 'approved' ? 'by you' : ''}</span>
                      {a.status !== 'dismissed' && actions.find((x) => x.id === a.key)?.undo && (
                        <button onClick={() => { actions.find((x) => x.id === a.key)!.undo!(); clearAction(a.key) }} className="flex items-center gap-1 text-[11.5px] text-brass hover:text-ink"><Undo2 size={12} /> Undo</button>
                      )}
                      {a.status === 'dismissed' && <button onClick={() => setAlert(a.key, 'open')} className="text-[11.5px] text-brass hover:text-ink">Restore</button>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Spot>
        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Spot id="autonomy">
            <Card className="p-4">
              <Eyebrow>Autonomy</Eyebrow>
              <div className="mt-2"><AutonomyDial /></div>
            </Card>
          </Spot>
          <Spot id="guardrails">
            <Card className={cn('p-4', autonomy !== 'act' && 'opacity-70')}>
              <Eyebrow>Guardrails</Eyebrow>
              <div className="mt-3 space-y-4 text-[12.5px]">
                <div><div className="flex justify-between"><span className="text-ink-2">Deepest markdown Tarazu may start</span><span className="num font-semibold text-ink">{pct(guardrails.maxMarkdown)}</span></div><Slider label="Max markdown" min={0.1} max={0.5} step={0.01} value={guardrails.maxMarkdown} onChange={(v) => setGuardrails({ maxMarkdown: v })} className="mt-2" /></div>
                <div><div className="flex justify-between"><span className="text-ink-2">Most it may commit per action</span><span className="num font-semibold text-ink">{inrShort(guardrails.maxSpend)}</span></div><Slider label="Max spend" min={5000} max={100000} step={5000} value={guardrails.maxSpend} onChange={(v) => setGuardrails({ maxSpend: v })} className="mt-2" /></div>
                <label className="flex items-center justify-between gap-3"><span className="text-ink-2">Never discount bestsellers on its own</span><Switch checked={guardrails.protectBestsellers} onChange={(v) => setGuardrails({ protectBestsellers: v })} label="Protect bestsellers" /></label>
                <p className="text-[11.5px] leading-snug text-ink-3">Fixing leaks, capping spend and pausing dead offers are always allowed: they can only save money. Disputes and anything strategic always wait for you.</p>
              </div>
            </Card>
          </Spot>
          <AiByline className="px-1" />
        </div>
      </div>
    </div>
  )
}
