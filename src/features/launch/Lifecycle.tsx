import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { toast } from 'sonner'
import { AlertOctagon, AlertTriangle, CheckCircle2, Eye, GitCompare, History, Pencil, ShieldAlert, ShieldCheck, UserCog, X, Zap } from 'lucide-react'
import { Card, Chip, Eyebrow, PageHeader, Segmented, Switch } from '@/components/ui'
import { NumberInput } from '@/components/ui/form'
import { Spot } from '@/components/Spot'
import type { Campaign, CampaignStatus } from '@/engine/types'
import { describeCondition, describeReward } from '@/engine/cart'
import { approvalReasons, canMove, diff, GUARDS, MOVES, preflight, STATUS_LABEL, tripped, verdict } from '@/engine/launch'
import { newCampaign, sentence } from '@/features/campaigns/templates'
import { portfolio } from '@/engine/engine'
import { seededAudit, useLaunch, type Role } from '@/state/launch'
import { fmtDay } from '@/lib/dates'
import { inrShort } from '@/lib/format'
import { cn } from '@/lib/cn'
import { StatusChip, useLaunchCtx } from './shared'

const COLUMNS: { status: CampaignStatus; label: string; also?: CampaignStatus[] }[] = [
  { status: 'draft', label: 'Draft', also: ['rejected'] }, { status: 'review', label: 'In review' }, { status: 'approved', label: 'Approved' }, { status: 'scheduled', label: 'Scheduled' },
  { status: 'live', label: 'Live' }, { status: 'paused', label: 'Paused' }, { status: 'ended', label: 'Ended' },
]

type Tab = 'board' | 'approvals' | 'guardrails'

export function Lifecycle() {
  const { campaigns } = useLaunchCtx()
  const { role, setRole } = useLaunch()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) ?? 'board')
  const open = campaigns.find((k) => k.id === params.get('id'))
  const inReview = campaigns.filter((k) => k.status === 'review').length
  return (
    <div>
      <PageHeader eyebrow="Lifecycle" title={<>Every offer, from draft to archive,<br /><span className="text-ink-3">with a record of who did what.</span></>}
        aside={<div className="flex items-center gap-2 rounded-full border border-rule bg-card p-1 pl-3 text-[12.5px]"><UserCog size={14} className="text-ink-3" /><span className="text-ink-3">Acting as</span><Segmented<Role> size="sm" value={role} onChange={(r) => { setRole(r); toast(r === 'checker' ? 'You are now the approver' : 'You are now the maker') }} options={[{ value: 'maker', label: 'Maker' }, { value: 'checker', label: 'Approver' }]} /></div>}>
        Drag a card to move it; only moves the rules allow will stick. Offers above the approval policy go to review, where a second
        person approves or rejects with the rule, the pre-flight result and the changes in front of them. Live offers run under guardrails.
      </PageHeader>
      <Segmented<Tab> value={tab} onChange={(t) => { setTab(t); setParams(t === 'board' ? {} : { tab: t }, { replace: true }) }} options={[{ value: 'board', label: 'Board' }, { value: 'approvals', label: `Approvals${inReview ? ` · ${inReview}` : ''}` }, { value: 'guardrails', label: 'Guardrails' }]} className="mb-5" />
      {tab === 'board' && <Board onOpen={(id) => setParams({ id }, { replace: true })} />}
      {tab === 'approvals' && <Approvals />}
      {tab === 'guardrails' && <Guardrails />}
      <AnimatePresence>{open && <Drawer c={open} onClose={() => setParams(tab === 'board' ? {} : { tab }, { replace: true })} />}</AnimatePresence>
    </div>
  )
}

function useNeedsApproval() {
  const { seller, c, campaigns, ctx } = useLaunchCtx()
  const policy = useLaunch((s) => s.policy)
  return (k: Campaign) => approvalReasons(k, seller, policy, preflight(k, seller, c, campaigns, ctx)).length > 0
}

function Board({ onOpen }: { onOpen: (id: string) => void }) {
  const { campaigns } = useLaunchCtx()
  const { role, move } = useLaunch()
  const needs = useNeedsApproval()
  const [archived, setArchived] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const onEnd = (e: DragEndEvent) => {
    const to = e.over?.id as CampaignStatus | undefined
    const c = campaigns.find((k) => k.id === e.active.id)
    if (!to || !c || c.status === to) return
    const ok = canMove(c.status, to, role, needs(c))
    if (!ok.ok) { toast.error(ok.why); return }
    move(c, to)
    toast(`${c.name}: ${STATUS_LABEL[to]}`)
  }
  const arch = campaigns.filter((k) => k.status === 'archived')
  return (
    <Spot id="lifecycle-board">
      <DndContext sensors={sensors} onDragEnd={onEnd}>
        <div className="flex gap-3 overflow-x-auto pb-3">
          {COLUMNS.map((col) => <Column key={col.status} col={col} items={campaigns.filter((k) => k.status === col.status || col.also?.includes(k.status))} onOpen={onOpen} />)}
        </div>
      </DndContext>
      <label className="mt-2 flex items-center gap-2 text-[12.5px] text-ink-3"><Switch checked={archived} onChange={setArchived} label="Show archived" /> Show archived ({arch.length})</label>
      {archived && <div className="mt-2 flex flex-wrap gap-2">{arch.map((k) => <button key={k.id} onClick={() => onOpen(k.id)} className="rounded-lg border border-rule bg-card px-3 py-1.5 text-[12px] text-ink-3">{k.name}</button>)}</div>}
    </Spot>
  )
}

function Column({ col, items, onOpen }: { col: (typeof COLUMNS)[number]; items: Campaign[]; onOpen: (id: string) => void }) {
  const { isOver, setNodeRef } = useDroppable({ id: col.status })
  return (
    <div ref={setNodeRef} className={cn('w-[230px] shrink-0 rounded-2xl border p-2 transition-colors', isOver ? 'border-brass bg-brass-soft/40' : 'border-rule-2 bg-paper-2/50')}>
      <div className="flex items-center justify-between px-1.5 py-1"><span className="text-[11.5px] font-semibold tracking-wider text-ink-2 uppercase">{col.label}</span><span className="num text-[11.5px] text-ink-3">{items.length}</span></div>
      <div className="mt-1 min-h-[120px] space-y-2">
        {items.map((k) => <CardItem key={k.id} c={k} onOpen={onOpen} />)}
        {!items.length && col.status === 'draft' && <Link to="/launch" className="block rounded-xl border border-dashed border-rule p-3 text-center text-[12px] text-ink-3 hover:border-brass/50 hover:text-ink">+ Build an offer in the Launch flow</Link>}
      </div>
    </div>
  )
}

function CardItem({ c, onOpen }: { c: Campaign; onOpen: (id: string) => void }) {
  const { seller, c: ctl, campaigns, ctx } = useLaunchCtx()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: c.id })
  const v = useMemo(() => verdict(preflight(c, seller, ctl, campaigns, ctx)), [c, seller, ctl, campaigns, ctx])
  const burn = c.budget ? Math.min(1, c.spent / c.budget) : 0
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} onClick={() => onOpen(c.id)}
      style={{ transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined }}
      className={cn('cursor-grab rounded-xl border border-rule bg-card p-2.5 text-left shadow-[var(--shadow-card)] active:cursor-grabbing', isDragging && 'z-50 rotate-1 shadow-[var(--shadow-lift)]')}>
      <div className="flex items-start justify-between gap-2"><span className="line-clamp-2 text-[12.5px] font-medium text-ink">{c.name}</span>{v === 'blocked' ? <AlertOctagon size={13} className="shrink-0 text-loss" /> : v === 'warnings' ? <AlertTriangle size={13} className="shrink-0 text-warn" /> : <CheckCircle2 size={13} className="shrink-0 text-gain" />}</div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10.5px] text-ink-3">{c.status === 'rejected' && <StatusChip s="rejected" />}<span>{c.mechanic}</span><span>·</span><span>{fmtDay(c.startDay)}–{fmtDay(c.endDay)}</span></div>
      {(c.status === 'live' || c.status === 'paused') && <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-rule-2"><div className={cn('h-full', burn > 0.85 ? 'bg-loss' : 'bg-gain')} style={{ width: `${burn * 100}%` }} /></div>}
      <div className="num mt-1 text-[10.5px] text-ink-3">{inrShort(c.spent)} of {inrShort(c.budget)}{c.launch?.version ? ` · v${c.launch.version}` : ''}</div>
    </div>
  )
}

function Drawer({ c, onClose }: { c: Campaign; onClose: () => void }) {
  const { seller, c: ctl, campaigns, ctx } = useLaunchCtx()
  const { role, move, audit, versions } = useLaunch()
  const needs = useNeedsApproval()
  const nav = useNavigate()
  const flights = useMemo(() => preflight(c, seller, ctl, campaigns, ctx), [c, seller, ctl, campaigns, ctx])
  const events = [...(audit[c.id] ?? []), ...seededAudit(c).filter(() => !(versions[c.id]?.length))].sort((a, b) => b.at - a.at)
  const vs = versions[c.id] ?? []
  const changes = vs.length > 1 ? diff(vs[vs.length - 2], vs[vs.length - 1]) : []
  const read = sentence(c, seller, (x) => describeCondition(x, seller.skus), (r) => describeReward(r, seller.skus))
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-ink/20" />
      <motion.aside role="dialog" aria-label={c.name} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} className="fixed inset-y-0 right-0 z-50 w-full max-w-[460px] overflow-y-auto border-l border-rule bg-card p-5 shadow-[var(--shadow-lift)]">
        <div className="flex items-start justify-between gap-3"><div><StatusChip s={c.status} /><h2 className="display mt-2 text-[22px] leading-tight text-ink">{c.name}</h2></div><button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper-2"><X size={16} /></button></div>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{read}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {MOVES[c.status].map((m) => {
            const ok = canMove(c.status, m.to, role, needs(c))
            return <button key={m.to} disabled={!ok.ok} title={ok.why} onClick={() => { move(c, m.to); toast(`${c.name}: ${STATUS_LABEL[m.to]}`) }} className="rounded-full border border-rule px-3 py-1.5 text-[12.5px] text-ink-2 hover:border-primary hover:text-ink disabled:opacity-40">{m.label}</button>
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[12.5px]">
          <button onClick={() => nav(`/launch?id=${c.id}`)} className="flex items-center gap-1.5 font-medium text-brass hover:text-ink"><Pencil size={13} /> Edit in Launch flow</button>
          <Link to={`/storefront?id=${c.id}`} className="flex items-center gap-1.5 font-medium text-brass hover:text-ink"><Eye size={13} /> Shopper preview</Link>
        </div>
        <section className="mt-5"><Eyebrow>Pre-flight · {verdict(flights)}</Eyebrow>
          <ul className="mt-2 space-y-1">{flights.filter((f) => f.level !== 'ok' && f.level !== 'info').map((f) => <li key={f.id} className={cn('text-[12.5px]', f.level === 'block' ? 'text-loss' : 'text-warn')}>· {f.title}</li>)}{flights.every((f) => f.level === 'ok' || f.level === 'info') && <li className="text-[12.5px] text-gain">· All checks pass</li>}</ul>
        </section>
        {changes.length > 0 && <section className="mt-5"><Eyebrow><GitCompare size={11} className="mr-1 inline" />v{vs.length - 1} → v{vs.length}</Eyebrow><Diff rows={changes} /></section>}
        <section className="mt-5"><Eyebrow><History size={11} className="mr-1 inline" />Audit log</Eyebrow>
          <ol className="mt-2 space-y-2 border-l border-rule pl-3">
            {events.map((e, i) => <li key={i} className="text-[12.5px]"><div className="text-ink">{e.what}{e.note ? <span className="text-ink-3"> · {e.note}</span> : ''}</div><div className="text-[11px] text-ink-3">{e.who} · {new Date(e.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div></li>)}
          </ol>
        </section>
      </motion.aside>
    </>
  )
}

function Diff({ rows }: { rows: { field: string; from: string; to: string }[] }) {
  return (
    <table className="mt-2 w-full text-[11.5px]"><tbody>
      {rows.map((r) => <tr key={r.field} className="border-b border-rule-2 align-top"><td className="py-1.5 pr-2 text-ink-3">{r.field}</td><td className="py-1.5 pr-2 break-all text-loss line-through decoration-loss/50">{r.from.slice(0, 80)}</td><td className="py-1.5 break-all text-gain">{r.to.slice(0, 80)}</td></tr>)}
    </tbody></table>
  )
}

function Approvals() {
  const { seller, c: ctl, campaigns, ctx } = useLaunchCtx()
  const { role, setRole, move, policy, versions } = useLaunch()
  const [why, setWhy] = useState<Record<string, string>>({})
  const queue = campaigns.filter((k) => k.status === 'review')
  const sample = () => {
    const r = [...portfolio(seller.skus, ctl).promos].sort((a, b) => b.result.net - a.result.net)[0]
    const k = newCampaign(seller, 'Clearance', {
      name: `Deep clearance: ${r.sku.line} 40% off`, startDay: 2, endDay: 16, stacking: 'stackable', budget: 40000, dailyRedemptions: 20,
      reward: { kind: 'pctOff', value: 0.4, target: 'sku', ref: r.sku.id }, conditions: [{ kind: 'hasSku', value: r.sku.id }], launch: { goal: 'clear', channels: Object.keys(seller.market.channels).slice(0, 2) },
    })
    useLaunch.getState().commit(k, 'Created in the Launch flow')
    move(k, 'review', 'Discount and budget above policy')
    toast('Sample offer sent for approval')
  }
  if (!queue.length) return (
    <Card className="p-8 text-center text-[13.5px] text-ink-3">
      Nothing waiting for approval. Offers above the policy land here when submitted from the Launch flow.
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button onClick={sample} className="rounded-full bg-primary px-4 py-2 text-[12.5px] font-medium text-paper">Send a sample offer for approval</button>
        <Link to="/launch" className="rounded-full border border-rule px-4 py-2 text-[12.5px] text-ink-2 hover:text-ink">Build one in the Launch flow</Link>
      </div>
    </Card>
  )
  return (
    <Spot id="approvals">
      <div className="space-y-4">
        {role === 'maker' && <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brass/30 bg-brass-soft/50 px-4 py-2.5 text-[13px] text-ink-2">You submitted these, so you can't approve them yourself. <button onClick={() => setRole('checker')} className="rounded-full bg-primary px-3 py-1 text-[12.5px] font-medium text-paper">Switch to approver</button></div>}
        {queue.map((k) => {
          const flights = preflight(k, seller, ctl, campaigns, ctx)
          const reasons = approvalReasons(k, seller, policy, flights)
          const vs = versions[k.id] ?? []
          const changes = vs.length > 1 ? diff(vs[vs.length - 2], vs[vs.length - 1]) : []
          return (
            <Card key={k.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><StatusChip s="review" /><h3 className="display mt-1.5 text-[20px] text-ink">{k.name}</h3></div><Chip tone={verdict(flights) === 'clear' ? 'gain' : verdict(flights) === 'blocked' ? 'loss' : 'warn'}>Pre-flight: {verdict(flights)}</Chip></div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{sentence(k, seller, (x) => describeCondition(x, seller.skus), (r) => describeReward(r, seller.skus))}</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div><div className="text-[11px] tracking-wider text-ink-3 uppercase">Why it needs approval</div><ul className="mt-1 space-y-0.5 text-[12.5px] text-ink-2">{reasons.map((r) => <li key={r}>· {r}</li>)}</ul></div>
                <div><div className="text-[11px] tracking-wider text-ink-3 uppercase">{changes.length ? 'What changed' : 'First version'}</div>{changes.length ? <Diff rows={changes} /> : <p className="mt-1 text-[12.5px] text-ink-3">New offer: nothing to compare.</p>}</div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button disabled={role !== 'checker'} onClick={() => { move(k, 'approved', 'Approved'); toast(`${k.name} approved`) }} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[12.5px] font-medium text-paper disabled:opacity-40"><CheckCircle2 size={14} /> Approve</button>
                <input aria-label="Reason for rejecting" value={why[k.id] ?? ''} onChange={(e) => setWhy({ ...why, [k.id]: e.target.value })} placeholder="Reason, if rejecting" className="min-w-0 flex-1 rounded-full border border-rule bg-paper px-3 py-1.5 text-[12.5px] text-ink outline-none focus:border-brass/60" />
                <button disabled={role !== 'checker' || !why[k.id]?.trim()} onClick={() => { move(k, 'rejected', why[k.id]); toast(`${k.name} sent back`, { description: why[k.id] }) }} className="rounded-full border border-loss/40 px-4 py-1.5 text-[12.5px] text-loss disabled:opacity-40">Reject</button>
              </div>
            </Card>
          )
        })}
      </div>
    </Spot>
  )
}

function Guardrails() {
  const { seller, campaigns } = useLaunchCtx()
  const { guards, setGuard, events, record, move, log } = useLaunch()
  const live = campaigns.filter((k) => k.status === 'live')
  // Live check: any campaign that trips an enabled guard is acted on once.
  useEffect(() => {
    for (const k of live) {
      const t = tripped(k, seller)
      if (!t || !guards[t.guard].on || events.some((e) => e.campaignId === k.id && e.guard === t.guard)) continue
      act(k, t.guard, t.reason)
    }
  }, [live.map((k) => k.id + k.status + k.spent).join()]) // eslint-disable-line react-hooks/exhaustive-deps

  function act(k: Campaign, g: (typeof GUARDS)[number]['id'], reason: string) {
    const guard = GUARDS.find((x) => x.id === g)!
    if (guard.action === 'pause') { move(k, 'paused', `Guardrail: ${guard.label}`); record({ campaignId: k.id, campaign: k.name, guard: g, reason, action: 'Paused' }) }
    else { useLaunch.getState().commit({ ...k, perCustomer: 1 }, `Guardrail: ${guard.label} capped to 1 per customer`); record({ campaignId: k.id, campaign: k.name, guard: g, reason, action: 'Capped at 1 use per customer' }) }
    log(k.id, { who: 'Tarazu guardrail', what: `${guard.label}: ${reason}` })
    toast(`Guardrail: ${guard.label}`, { description: `${k.name}: ${guard.action === 'pause' ? 'paused' : 'capped'}` })
  }
  const simulate = (g: (typeof GUARDS)[number]['id']) => {
    const k = live.find((x) => (g === 'coupon-site' ? x.conditions.some((y) => y.kind === 'code') : true)) ?? live[0]
    if (!k) { toast('No live campaign to test'); return }
    if (!guards[g].on) { toast(`${GUARDS.find((x) => x.id === g)!.label} is off: nothing happens`, { description: 'Turn the guardrail on to protect against this.' }); return }
    const reasons: Record<typeof g, string> = { margin: 'An order cleared at 9% margin after stacking', spike: '6.2× the planned uses in the last hour', budget: 'Spend reached the budget', 'coupon-site': 'Code spotted on a public coupon site' }
    act(k, g, `Simulated · ${reasons[g]}`)
  }
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <Spot id="guardrails-live">
        <Card className="p-5">
          <Eyebrow>Guardrails on live offers</Eyebrow>
          <ul className="mt-3 divide-y divide-rule-2">
            {GUARDS.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center gap-3 py-3">
                <Switch checked={guards[g.id].on} onChange={(on) => setGuard(g.id, { on })} label={g.label} />
                <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-ink">{g.label}</div><div className="text-[12px] text-ink-3">{g.detail} {g.unit === '%' ? `${Math.round(guards[g.id].threshold * 100)}%` : g.unit === '×' ? `${guards[g.id].threshold}×` : ''} → {g.action === 'pause' ? 'pause' : 'cap'}</div></div>
                {g.unit === '×' && <NumberInput label="Spike multiple" value={guards[g.id].threshold} onChange={(v) => setGuard(g.id, { threshold: v ?? 3 })} suffix="×" className="w-20" />}
                {g.id === 'margin' && <NumberInput label="Margin threshold" value={Math.round(guards[g.id].threshold * 100)} onChange={(v) => setGuard(g.id, { threshold: (v ?? 12) / 100 })} suffix="%" className="w-20" />}
                <button onClick={() => simulate(g.id)} className="flex items-center gap-1 rounded-full border border-rule px-2.5 py-1 text-[12px] text-ink-2 hover:text-ink"><Zap size={12} className="text-brass" /> Simulate</button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11.5px] text-ink-3">"Simulate" fires the event on a live {seller.name} offer so you can watch the guardrail act. Real triggers are checked against each live offer's own numbers.</p>
        </Card>
      </Spot>
      <Card className="h-fit p-5">
        <Eyebrow>What the guardrails did</Eyebrow>
        {events.length === 0 ? <p className="mt-3 text-[13px] text-ink-3">Nothing yet. Every live offer is inside its limits.</p> : (
          <ol className="mt-3 space-y-3">
            {events.map((e, i) => (
              <li key={i} className="flex gap-2.5 text-[12.5px]">
                {e.action === 'Paused' ? <ShieldAlert size={15} className="mt-0.5 shrink-0 text-loss" /> : <ShieldCheck size={15} className="mt-0.5 shrink-0 text-gain" />}
                <div><div className="text-ink"><b>{e.action}</b> · {e.campaign}</div><div className="text-ink-3">{e.reason}</div><div className="text-[11px] text-ink-4">{new Date(e.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div></div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  )
}
