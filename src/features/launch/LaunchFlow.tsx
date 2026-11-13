import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import {
  AlertOctagon, AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, Crown, Info, Plus, Rocket, Save, Swords, Target, TrendingUp, UserRoundCheck, Users, X, Zap, type LucideIcon,
} from 'lucide-react'
import { Card, Chip, Eyebrow, PageHeader, Segmented, Slider, Switch } from '@/components/ui'
import { NumberInput, Select, TextInput } from '@/components/ui/form'
import { Spot } from '@/components/Spot'
import type { AudienceRule, Campaign, Condition, Reward } from '@/engine/types'
import { describeCondition, describeReward, evaluateCart, PAYMENTS } from '@/engine/cart'
import {
  approvalReasons, audience, codeRisk, generateCodes, mapChannels, normaliseCode, preflight, qualifyingCart, RECURRING, RULE_LABEL, verdict, windows, type Flight,
} from '@/engine/launch'
import { portfolio, recommend } from '@/engine/engine'
import { newCampaign, sentence } from '@/features/campaigns/templates'
import { useLaunch } from '@/state/launch'
import { fmtDay, fmtWeekday } from '@/lib/dates'
import { inrShort, pct } from '@/lib/format'
import { cn } from '@/lib/cn'
import { MiniScale, useLaunchCtx } from './shared'
import { StorefrontPreview } from './Storefront'

const STEPS = [
  { id: 'goal', label: 'Goal' }, { id: 'audience', label: 'Audience' }, { id: 'conditions', label: 'Conditions' }, { id: 'reward', label: 'Reward' },
  { id: 'codes', label: 'Codes' }, { id: 'limits', label: 'Limits & budget' }, { id: 'schedule', label: 'Schedule' }, { id: 'channels', label: 'Channels' },
  { id: 'stacking', label: 'Stacking' }, { id: 'preflight', label: 'Pre-flight check' }, { id: 'preview', label: 'Shopper preview' }, { id: 'approval', label: 'Approval' }, { id: 'publish', label: 'Publish' },
] as const
type StepId = (typeof STEPS)[number]['id']

type Goal = 'clear' | 'launch' | 'winback' | 'aov' | 'rival' | 'loyal'
const GOALS: { id: Goal; label: string; sub: string; icon: LucideIcon }[] = [
  { id: 'clear', label: 'Clear old stock', sub: 'Markdown on the product most at risk', icon: Target },
  { id: 'launch', label: 'Launch push', sub: 'A short welcome price on the hero product', icon: Rocket },
  { id: 'winback', label: 'Win back lapsed buyers', sub: 'Single-use codes for people who stopped ordering', icon: UserRoundCheck },
  { id: 'aov', label: 'Raise order value', sub: 'Spend tiers just above today\'s average order', icon: TrendingUp },
  { id: 'rival', label: 'Beat a rival\'s price', sub: 'Honest flash windows on the hero product', icon: Swords },
  { id: 'loyal', label: 'Reward loyal buyers', sub: 'Double points for members', icon: Crown },
]

const r50 = (n: number) => Math.max(50, Math.round(n / 50) * 50)

function fromGoal(goal: Goal, ctx: ReturnType<typeof useLaunchCtx>): Campaign {
  const { seller: s, c } = ctx
  const hero = s.skus.find((k) => k.id === s.heroSkuId)!
  const base = { status: 'draft' as const, launch: { goal, channels: Object.keys(s.market.channels).slice(0, 2), graceMinutes: 15, maxOrderPct: 0.35, recurring: 'none' as const } }
  switch (goal) {
    case 'clear': {
      const p = portfolio(s.skus, c)
      const r = [...p.promos].filter((x) => x.health === 'at-risk' || x.health === 'slow').sort((a, b) => b.result.net - a.result.net)[0] ?? p.promos[0]
      return newCampaign(s, 'Clearance', { ...base, name: `Clear ${r.sku.line}`, startDay: 1, endDay: r.weeks * 7 + 1, reward: { kind: 'pctOff', value: r.discount || 0.2, target: 'sku', ref: r.sku.id }, conditions: [{ kind: 'hasSku', value: r.sku.id }], dailyRedemptions: Math.max(2, Math.round(r.result.promoUnits / (r.weeks * 7))), budget: Math.max(5000, Math.round((r.result.subsidyCost + r.result.dealFees) / 1000) * 1000), stacking: 'exclusive' })
    }
    case 'launch': return newCampaign(s, 'Launch offer', { ...base, name: `${hero.line} launch week`, startDay: 2, endDay: 9, reward: { kind: 'pctOff', value: 0.1, target: 'sku', ref: hero.id }, conditions: [{ kind: 'hasSku', value: hero.id }], launch: { ...base.launch, audience: [{ kind: 'repeat' }], codes: { mode: 'public', prefix: 'LAUNCH10' } }, perCustomer: 1, dailyRedemptions: 18 })
    case 'winback': return newCampaign(s, 'Win-back', { ...base, name: 'We miss you', segment: 'lapsed', startDay: 1, endDay: 22, reward: { kind: 'amountOff', value: r50(s.avgOrder * 0.15) }, conditions: [{ kind: 'cartMin', value: r50(s.avgOrder * 0.9) }], launch: { ...base.launch, channels: ['website'].filter((x) => s.market.channels[x]), audience: [{ kind: 'lapsed', value: 90 }], codes: { mode: 'bulk', prefix: 'BACK', count: 1200 } }, perCustomer: 1, dailyRedemptions: 14, stacking: 'exclusive' })
    case 'aov': return newCampaign(s, 'Spend tiers', { ...base, name: `Spend more, save more`, startDay: 1, endDay: 15, reward: { kind: 'tiered', tiers: [{ min: r50(s.avgOrder * 1.3), off: r50(s.avgOrder * 0.08) }, { min: r50(s.avgOrder * 2), off: r50(s.avgOrder * 0.16) }] }, dailyRedemptions: 25 })
    case 'rival': return newCampaign(s, 'Flash deal', { ...base, name: `${hero.line} flash price`, startDay: 1, endDay: 4, reward: { kind: 'pctOff', value: 0.1, target: 'sku', ref: hero.id }, conditions: [{ kind: 'hasSku', value: hero.id }], launch: { ...base.launch, recurring: 'flash', flashSlots: [{ day: 1, from: 20, to: 22 }, { day: 2, from: 20, to: 22 }, { day: 3, from: 13, to: 15 }], countdown: true }, stacking: 'exclusive', dailyRedemptions: 30 })
    case 'loyal': return newCampaign(s, 'Double points', { ...base, name: 'Double points for members', segment: 'gold', startDay: 1, endDay: 15, reward: { kind: 'points', multiplier: 2 }, launch: { ...base.launch, audience: [{ kind: 'member' }] }, stacking: 'always', dailyRedemptions: 40 })
  }
}

const segmentOf = (rules: AudienceRule[]): Campaign['segment'] =>
  rules.some((r) => r.kind === 'new') ? 'new' : rules.some((r) => r.kind === 'lapsed') ? 'lapsed' : rules.some((r) => r.kind === 'member') ? 'gold' : rules.some((r) => r.kind === 'repeat') ? 'regular' : 'all'

export function LaunchFlow() {
  const L = useLaunchCtx()
  const { seller, c, campaigns, ctx } = L
  const [params] = useSearchParams()
  const existing = campaigns.find((k) => k.id === params.get('id'))
  const [goal, setGoal] = useState<Goal | null>((existing?.launch?.goal as Goal) ?? null)
  const [d, setD] = useState<Campaign>(() => existing ?? fromGoal('clear', L))
  const [step, setStep] = useState<StepId>(existing ? 'audience' : 'goal')
  const [preview, setPreview] = useState<'listing' | 'product' | 'cart' | 'checkout' | 'wallet'>('listing')
  const { policy, commit, move, setCodes, log, role } = useLaunch()
  const nav = useNavigate()
  useEffect(() => { if (!existing) { setGoal(null); setD(fromGoal('clear', L)); setStep('goal') } }, [seller.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch: Partial<Campaign>) => setD((x) => ({ ...x, ...patch }))
  const setL = (patch: NonNullable<Campaign['launch']>) => setD((x) => ({ ...x, launch: { ...x.launch, ...patch } }))
  const flights = useMemo(() => preflight(d, seller, c, campaigns, ctx), [d, seller, c, campaigns, ctx])
  const v = verdict(flights)
  const reasons = approvalReasons(d, seller, policy, flights)
  const idx = STEPS.findIndex((x) => x.id === step)
  const go = (n: number) => setStep(STEPS[Math.max(0, Math.min(STEPS.length - 1, n))].id)
  const read = sentence(d, seller, (x) => describeCondition(x, seller.skus), (r) => describeReward(r, seller.skus))

  const finish = (mode: 'draft' | 'submit' | 'publish') => {
    const isNew = !campaigns.some((k) => k.id === d.id)
    const saved = { ...d, status: existing?.status === 'rejected' ? 'draft' as const : d.status }
    commit(saved, isNew ? 'Created in the Launch flow' : 'Edited in the Launch flow')
    if (d.launch?.codes?.mode === 'bulk') setCodes(d.id, { prefix: d.launch.codes.prefix ?? 'TZ', count: d.launch.codes.count ?? 500, seed: 1, blocked: [], createdAt: Date.now() })
    if (mode === 'submit') { move({ ...saved, status: 'draft' }, 'review', reasons.join('; ')); toast('Sent for approval', { description: reasons[0] }) }
    else if (mode === 'publish') { const to = d.startDay > 0 ? 'scheduled' : 'live'; move({ ...saved, status: 'draft' }, to); log(d.id, { what: `Pre-flight: ${v}` }); toast(to === 'live' ? 'Live now' : `Scheduled for ${fmtDay(d.startDay)}`) }
    else toast('Draft saved')
    nav(`/lifecycle?id=${d.id}`)
  }

  return (
    <div>
      <PageHeader eyebrow="Launch flow" title={<>From a goal to a live offer,<br /><span className="text-ink-3">weighed at every step.</span></>}>
        The full builder journey: who it's for, the rule, codes, limits, schedule and channels, then a pre-flight check by the engine,
        a shopper's-eye preview and approval. The Scale on the right updates with every change, so you never build an offer blind.
      </PageHeader>
      <div className="grid gap-5 xl:grid-cols-[190px_1fr_300px]">
        <nav aria-label="Launch steps" className="flex gap-1 overflow-x-auto xl:sticky xl:top-24 xl:flex-col xl:self-start">
          {STEPS.map((s, i) => {
            const warn = s.id === 'preflight' && v !== 'clear'
            return (
              <button key={s.id} onClick={() => setStep(s.id)} disabled={!goal && i > 0}
                className={cn('flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] transition-colors disabled:opacity-40', step === s.id ? 'bg-primary text-paper' : 'text-ink-2 hover:bg-paper-2')}>
                <span className={cn('num grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold', step === s.id ? 'bg-paper/20' : i < idx ? 'bg-gain-soft text-gain' : 'bg-paper-2 text-ink-3')}>{i < idx ? <Check size={11} /> : i + 1}</span>
                <span className="whitespace-nowrap">{s.label}</span>
                {warn && <span className={cn('ml-auto h-2 w-2 rounded-full', v === 'blocked' ? 'bg-loss' : 'bg-warn')} />}
              </button>
            )
          })}
        </nav>
        <Spot id={`launch-${step}`}>
          <Card className="p-5">
            <Eyebrow>Step {idx + 1} of {STEPS.length}</Eyebrow>
            <h2 className="display mt-1 mb-4 text-[24px] text-ink">{STEPS[idx].label}</h2>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>
                {step === 'goal' && <GoalStep goal={goal} onPick={(g) => { setGoal(g); setD(fromGoal(g, L)); setStep('audience') }} hasLoyalty={!!seller.loyalty} />}
                {step === 'audience' && <AudienceStep d={d} onChange={(rules) => { setL({ audience: rules }); set({ segment: segmentOf(rules) }) }} />}
                {step === 'conditions' && <ConditionsStep d={d} onChange={(conditions) => set({ conditions })} />}
                {step === 'reward' && <RewardStep d={d} onChange={(reward) => set({ reward })} />}
                {step === 'codes' && <CodesStep d={d} set={set} setL={setL} />}
                {step === 'limits' && <LimitsStep d={d} set={set} setL={setL} />}
                {step === 'schedule' && <ScheduleStep d={d} set={set} setL={setL} />}
                {step === 'channels' && <ChannelsStep d={d} setL={setL} />}
                {step === 'stacking' && <StackingStep d={d} set={set} setL={setL} />}
                {step === 'preflight' && <PreflightStep flights={flights} onFix={(p) => { setD((x) => ({ ...x, ...p, launch: { ...x.launch, ...p.launch } })); toast('Fixed') }} />}
                {step === 'preview' && <StorefrontPreview campaign={d} view={preview} onView={setPreview} compact />}
                {step === 'approval' && <ApprovalStep reasons={reasons} role={role} />}
                {step === 'publish' && <PublishStep d={d} read={read} v={v} reasons={reasons} onFinish={finish} />}
              </motion.div>
            </AnimatePresence>
            {step !== 'goal' && (
              <div className="mt-6 flex items-center justify-between border-t border-rule-2 pt-4">
                <button onClick={() => go(idx - 1)} className="flex items-center gap-1.5 rounded-full border border-rule px-3.5 py-1.5 text-[12.5px] text-ink-2 hover:text-ink"><ArrowLeft size={13} /> Back</button>
                <button onClick={() => finish('draft')} className="flex items-center gap-1.5 text-[12.5px] text-ink-3 hover:text-ink"><Save size={13} /> Save draft</button>
                {step !== 'publish' && <button onClick={() => go(idx + 1)} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[12.5px] font-medium text-paper">Next <ArrowRight size={13} /></button>}
              </div>
            )}
          </Card>
        </Spot>
        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Spot id="launch-scale"><Card className="p-4"><Eyebrow>Weighing this draft</Eyebrow><div className="mt-2"><MiniScale campaign={d} /></div></Card></Spot>
          <Card className="p-4">
            <div className="flex items-center justify-between"><Eyebrow>Reads as</Eyebrow><Verdict v={v} /></div>
            <TextInput label="Campaign name" value={d.name} onChange={(name) => set({ name })} className="mt-2 w-full" />
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">{read}</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Verdict({ v }: { v: ReturnType<typeof verdict> }) {
  return v === 'blocked' ? <Chip tone="loss"><AlertOctagon size={11} /> Blocked</Chip> : v === 'warnings' ? <Chip tone="warn"><AlertTriangle size={11} /> Warnings</Chip> : <Chip tone="gain"><CheckCircle2 size={11} /> Clear</Chip>
}

function GoalStep({ goal, onPick, hasLoyalty }: { goal: Goal | null; onPick: (g: Goal) => void; hasLoyalty: boolean }) {
  return (
    <div>
      <p className="mb-4 text-[13.5px] text-ink-2">Start from what you want to happen. Tarazu picks the mechanic, products and settings from the engine; you can change everything after.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GOALS.map((g) => {
          const off = g.id === 'loyal' && !hasLoyalty
          const Icon = g.icon
          return (
            <button key={g.id} disabled={off} onClick={() => onPick(g.id)} className={cn('rounded-xl border p-4 text-left transition-all disabled:opacity-40', goal === g.id ? 'border-primary bg-surface' : 'border-rule bg-card hover:border-brass/50 hover:shadow-[var(--shadow-card)]')}>
              <Icon size={18} className="text-brass" />
              <div className="mt-2 text-[14px] font-semibold text-ink">{g.label}</div>
              <div className="mt-0.5 text-[12px] leading-snug text-ink-3">{off ? 'This seller has no loyalty programme' : g.sub}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function AudienceStep({ d, onChange }: { d: Campaign; onChange: (r: AudienceRule[]) => void }) {
  const { seller } = useLaunchCtx()
  const rules = d.launch?.audience ?? []
  const a = audience(rules, seller)
  const [kind, setKind] = useState<AudienceRule['kind']>('lapsed')
  const add = () => {
    const r: AudienceRule = kind === 'lapsed' ? { kind, value: 90 } : kind === 'aov' ? { kind, value: Math.round(seller.avgOrder * 1.5) } : kind === 'city' ? { kind, values: [seller.city] } : kind === 'list' ? { kind, value: 2500 } : { kind }
    onChange([...rules.filter((x) => x.kind !== kind), r])
  }
  const kinds = (Object.keys(RULE_LABEL) as AudienceRule['kind'][]).filter((k) => k !== 'member' || seller.loyalty)
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
      <div>
        <p className="mb-3 text-[13px] text-ink-2">Rules combine with AND. Leave it empty to show the offer to everyone.</p>
        <ul className="space-y-2">
          {rules.map((r, i) => (
            <li key={r.kind} className="flex flex-wrap items-center gap-2 rounded-lg border border-rule bg-paper/60 px-3 py-2 text-[13px]">
              <Users size={14} className="text-ink-3" /><span className="text-ink">{RULE_LABEL[r.kind]}</span>
              {(r.kind === 'lapsed') && <NumberInput label="Days" value={r.value} onChange={(v) => onChange(rules.map((x, j) => (j === i ? { ...x, value: v ?? 90 } : x)))} suffix="days" className="w-28" />}
              {(r.kind === 'aov') && <NumberInput label="Average order" value={r.value} onChange={(v) => onChange(rules.map((x, j) => (j === i ? { ...x, value: v ?? 0 } : x)))} prefix="₹" className="w-28" />}
              {(r.kind === 'list') && <NumberInput label="People on the list" value={r.value} onChange={(v) => onChange(rules.map((x, j) => (j === i ? { ...x, value: v ?? 0 } : x)))} suffix="people" className="w-32" />}
              {(r.kind === 'city') && <TextInput label="Cities" value={(r.values ?? []).join(', ')} onChange={(v) => onChange(rules.map((x, j) => (j === i ? { ...x, values: v.split(',').map((z) => z.trim()).filter(Boolean) } : x)))} placeholder="Jaipur, Delhi" className="w-48" />}
              <button onClick={() => onChange(rules.filter((_, j) => j !== i))} aria-label="Remove rule" className="ml-auto text-ink-3 hover:text-loss"><X size={14} /></button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center gap-2">
          <Select label="Rule" value={kind} onChange={setKind} options={kinds.map((k) => ({ value: k, label: RULE_LABEL[k] }))} />
          <button onClick={add} className="flex items-center gap-1 rounded-full border border-rule px-3 py-1.5 text-[12.5px] text-ink-2 hover:text-ink"><Plus size={13} /> Add rule</button>
        </div>
      </div>
      <div className="rounded-xl bg-paper-2/70 p-4">
        <div className="text-[11px] tracking-wider text-ink-3 uppercase">Audience</div>
        {a.base ? (
          <>
            <div className="num mt-1 text-[30px] font-semibold text-ink">{a.size.toLocaleString('en-IN')}</div>
            <div className="text-[12px] text-ink-3">of {a.base.toLocaleString('en-IN')} reachable customers</div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-rule-2"><motion.div className="h-full bg-primary" animate={{ width: `${(a.size / a.base) * 100}%` }} /></div>
            <div className="mt-3 text-[12px] text-ink-2"><b className="num text-ink">{pct(a.anyway)}</b> would buy anyway</div>
          </>
        ) : null}
        {a.note && <p className="mt-2 text-[11.5px] leading-snug text-ink-3">{a.note}</p>}
      </div>
    </div>
  )
}

function ConditionsStep({ d, onChange }: { d: Campaign; onChange: (c: Condition[]) => void }) {
  const { seller } = useLaunchCtx()
  const cats = [...new Set(seller.skus.map((k) => k.category))]
  const conds = d.conditions.filter((k) => k.kind !== 'code')
  const code = d.conditions.filter((k) => k.kind === 'code')
  const upd = (i: number, x: Condition) => onChange([...conds.map((k, j) => (j === i ? x : k)), ...code])
  const add = (x: Condition) => onChange([...conds, x, ...code])
  return (
    <div>
      <p className="mb-3 text-[13px] text-ink-2">What must be true of the cart. Free items never count toward a spend threshold.</p>
      <ul className="space-y-2">
        {conds.map((k, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-rule bg-paper/60 px-3 py-2 text-[13px]">
            {k.kind === 'cartMin' && <>Cart is at least <NumberInput label="Minimum cart" value={k.value} onChange={(v) => upd(i, { ...k, value: v ?? 0 })} prefix="₹" className="w-28" /></>}
            {k.kind === 'hasSku' && <>Contains <Select label="Product" value={k.value} onChange={(v) => upd(i, { ...k, value: v })} options={seller.skus.map((s) => ({ value: s.id, label: s.name }))} className="max-w-[320px] flex-1" /></>}
            {k.kind === 'hasCategory' && <>Contains something from <Select label="Category" value={k.value} onChange={(v) => upd(i, { ...k, value: v })} options={cats.map((s) => ({ value: s, label: s }))} /></>}
            {k.kind === 'qtyMin' && <>At least <NumberInput label="Quantity" value={k.value} onChange={(v) => upd(i, { ...k, value: v ?? 1 })} suffix="items" className="w-24" /></>}
            {k.kind === 'payment' && <>Paid by <Select label="Payment" value={k.value} onChange={(v) => upd(i, { ...k, value: v })} options={Object.entries(PAYMENTS).map(([value, label]) => ({ value, label }))} /></>}
            <button onClick={() => onChange([...conds.filter((_, j) => j !== i), ...code])} aria-label="Remove condition" className="ml-auto text-ink-3 hover:text-loss"><X size={14} /></button>
          </li>
        ))}
        {!conds.length && <li className="rounded-lg border border-dashed border-rule px-3 py-3 text-[12.5px] text-ink-3">No conditions: every cart qualifies.</li>}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2 text-[12.5px]">
        <button onClick={() => add({ kind: 'cartMin', value: r50(seller.avgOrder) })} className="rounded-full border border-rule px-3 py-1 text-ink-2 hover:text-ink">+ Minimum cart</button>
        <button onClick={() => add({ kind: 'hasSku', value: seller.heroSkuId })} className="rounded-full border border-rule px-3 py-1 text-ink-2 hover:text-ink">+ Product</button>
        <button onClick={() => add({ kind: 'hasCategory', value: cats[0] })} className="rounded-full border border-rule px-3 py-1 text-ink-2 hover:text-ink">+ Category</button>
        <button onClick={() => add({ kind: 'qtyMin', value: 2 })} className="rounded-full border border-rule px-3 py-1 text-ink-2 hover:text-ink">+ Quantity</button>
        <button onClick={() => add({ kind: 'payment', value: 'upi' })} className="rounded-full border border-rule px-3 py-1 text-ink-2 hover:text-ink">+ Payment method</button>
      </div>
    </div>
  )
}

const REWARDS: { value: Reward['kind']; label: string }[] = [
  { value: 'pctOff', label: 'Percent off' }, { value: 'amountOff', label: 'Flat ₹ off' }, { value: 'tiered', label: 'Spend tiers' }, { value: 'bxgy', label: 'Buy X get Y' }, { value: 'multiBuy', label: 'Multi-buy price' },
  { value: 'freeItem', label: 'Free gift' }, { value: 'freeShipping', label: 'Free delivery' }, { value: 'bundlePrice', label: 'Bundle price' }, { value: 'points', label: 'Points multiplier' }, { value: 'cashback', label: 'Cashback' },
]

function RewardStep({ d, onChange }: { d: Campaign; onChange: (r: Reward) => void }) {
  const { seller, c } = useLaunchCtx()
  const r = d.reward
  const hero = seller.heroSkuId
  const skuOpts = seller.skus.map((s) => ({ value: s.id, label: s.name }))
  const cats = [...new Set(seller.skus.map((k) => k.category))]
  const switchTo = (k: Reward['kind']) => {
    const skuRef = (r.kind === 'pctOff' && r.target === 'sku' && r.ref) || hero
    const defaults: Record<Reward['kind'], Reward> = {
      pctOff: { kind: 'pctOff', value: 0.15, target: 'sku', ref: skuRef }, amountOff: { kind: 'amountOff', value: r50(seller.avgOrder * 0.12) },
      tiered: { kind: 'tiered', tiers: [{ min: r50(seller.avgOrder * 1.3), off: r50(seller.avgOrder * 0.08) }, { min: r50(seller.avgOrder * 2), off: r50(seller.avgOrder * 0.16) }] },
      bxgy: { kind: 'bxgy', buy: 2, get: 1, getPct: 1, ref: skuRef, refKind: 'sku' }, multiBuy: { kind: 'multiBuy', qty: 3, price: Math.round((seller.skus.find((s) => s.id === skuRef)?.price ?? 300) * 2.4), ref: skuRef, refKind: 'sku' },
      freeItem: { kind: 'freeItem', sku: [...seller.skus].sort((a, b) => a.cost - b.cost)[0].id }, freeShipping: { kind: 'freeShipping' },
      bundlePrice: { kind: 'bundlePrice', skus: [skuRef, seller.skus.find((s) => s.id !== skuRef)!.id], price: 0 }, points: { kind: 'points', multiplier: 2 }, cashback: { kind: 'cashback', pct: 0.05, max: r50(seller.avgOrder * 0.1) },
    }
    const next = defaults[k]
    if (next.kind === 'bundlePrice') next.price = Math.round(next.skus.reduce((a, id) => a + (seller.skus.find((s) => s.id === id)?.price ?? 0), 0) * 0.85)
    onChange(next)
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">{REWARDS.map((x) => <button key={x.value} onClick={() => switchTo(x.value)} className={cn('rounded-full border px-3 py-1 text-[12.5px]', r.kind === x.value ? 'border-primary bg-primary text-paper' : 'border-rule text-ink-2 hover:text-ink')}>{x.label}</button>)}</div>
      <div className="rounded-xl border border-rule bg-paper/60 p-4 text-[13px]">
        {r.kind === 'pctOff' && <div className="space-y-3">
          <div className="flex justify-between"><span className="text-ink-2">Discount</span><span className="num font-semibold text-ink">{pct(r.value)}</span></div>
          <Slider label="Discount" min={0.05} max={0.7} step={0.01} value={r.value} onChange={(value) => onChange({ ...r, value })} />
          <div className="flex flex-wrap items-center gap-2">On <Segmented size="sm" value={r.target} onChange={(t) => onChange({ ...r, target: t, ref: t === 'cart' ? undefined : t === 'category' ? cats[0] : hero })} options={[{ value: 'sku', label: 'A product' }, { value: 'category', label: 'A category' }, { value: 'cart', label: 'The whole order' }]} />
            {r.target === 'sku' && <Select label="Product" value={r.ref ?? hero} onChange={(ref) => onChange({ ...r, ref })} options={skuOpts} className="max-w-[300px] flex-1" />}
            {r.target === 'category' && <Select label="Category" value={r.ref ?? cats[0]} onChange={(ref) => onChange({ ...r, ref })} options={cats.map((x) => ({ value: x, label: x }))} />}
          </div>
          {r.target === 'sku' && r.ref && (() => { const rec = recommend(seller.skus.find((s) => s.id === r.ref)!, c); return <button onClick={() => onChange({ ...r, value: rec.discount || r.value })} className="text-[12px] font-medium text-brass hover:text-ink">The Scale's pick for this product: {rec.discount ? pct(rec.discount) : 'full price'}{rec.cliff ? `, cliff at ${pct(rec.cliff)}` : ''}</button> })()}
        </div>}
        {r.kind === 'amountOff' && <div className="flex items-center gap-2">₹ off the order <NumberInput label="Amount" value={r.value} onChange={(v) => onChange({ ...r, value: v ?? 0 })} prefix="₹" className="w-28" /></div>}
        {r.kind === 'tiered' && <div className="space-y-2">{r.tiers.map((t, i) => <div key={i} className="flex flex-wrap items-center gap-2">Spend <NumberInput label="Spend" value={t.min} onChange={(v) => onChange({ ...r, tiers: r.tiers.map((x, j) => (j === i ? { ...x, min: v ?? 0 } : x)) })} prefix="₹" className="w-28" /> get <NumberInput label="Off" value={t.off} onChange={(v) => onChange({ ...r, tiers: r.tiers.map((x, j) => (j === i ? { ...x, off: v ?? 0 } : x)) })} prefix="₹" className="w-24" /> off</div>)}<p className="text-[11.5px] text-ink-3">Inclusive at each threshold. Today's average order is ₹{seller.avgOrder}.</p></div>}
        {r.kind === 'bxgy' && <div className="flex flex-wrap items-center gap-2">Buy <NumberInput label="Buy" value={r.buy} onChange={(v) => onChange({ ...r, buy: v ?? 1 })} className="w-16" /> get <NumberInput label="Get" value={r.get} onChange={(v) => onChange({ ...r, get: v ?? 1 })} className="w-16" /> at <Select label="Get discount" value={String(r.getPct)} onChange={(v) => onChange({ ...r, getPct: Number(v) })} options={[{ value: '1', label: 'free' }, { value: '0.5', label: '50% off' }]} /> on <Select label="Product" value={r.ref} onChange={(ref) => onChange({ ...r, ref })} options={skuOpts} className="max-w-[260px] flex-1" /></div>}
        {r.kind === 'multiBuy' && <div className="flex flex-wrap items-center gap-2"><NumberInput label="Quantity" value={r.qty} onChange={(v) => onChange({ ...r, qty: v ?? 2 })} className="w-16" /> for <NumberInput label="Price" value={r.price} onChange={(v) => onChange({ ...r, price: v ?? 0 })} prefix="₹" className="w-24" /> of <Select label="Product" value={r.ref} onChange={(ref) => onChange({ ...r, ref })} options={skuOpts} className="max-w-[260px] flex-1" /></div>}
        {r.kind === 'freeItem' && <div className="flex flex-wrap items-center gap-2">Free <Select label="Gift" value={r.sku} onChange={(sku) => onChange({ ...r, sku })} options={skuOpts} className="max-w-[300px] flex-1" /><span className="text-[11.5px] text-ink-3">costs ₹{seller.skus.find((s) => s.id === r.sku)?.cost} each</span></div>}
        {r.kind === 'freeShipping' && <p>Free delivery on qualifying orders (₹{seller.shippingFee || 40} a shipment, paid by {seller.name}).</p>}
        {r.kind === 'bundlePrice' && <div className="flex flex-wrap items-center gap-2"><Select label="First" value={r.skus[0]} onChange={(v) => onChange({ ...r, skus: [v, r.skus[1]] })} options={skuOpts} className="max-w-[220px]" /> + <Select label="Second" value={r.skus[1]} onChange={(v) => onChange({ ...r, skus: [r.skus[0], v] })} options={skuOpts} className="max-w-[220px]" /> for <NumberInput label="Bundle price" value={r.price} onChange={(v) => onChange({ ...r, price: v ?? 0 })} prefix="₹" className="w-24" /><span className="text-[11.5px] text-ink-3">MRP together ₹{r.skus.reduce((a, id) => a + (seller.skus.find((s) => s.id === id)?.price ?? 0), 0)}</span></div>}
        {r.kind === 'points' && <div className="flex items-center gap-2"><NumberInput label="Multiplier" value={r.multiplier} onChange={(v) => onChange({ ...r, multiplier: v ?? 2 })} suffix="× points" className="w-28" /></div>}
        {r.kind === 'cashback' && <div className="flex flex-wrap items-center gap-2"><NumberInput label="Cashback" value={Math.round(r.pct * 100)} onChange={(v) => onChange({ ...r, pct: (v ?? 5) / 100 })} suffix="%" className="w-20" /> up to <NumberInput label="Max" value={r.max} onChange={(v) => onChange({ ...r, max: v ?? 0 })} prefix="₹" className="w-24" /></div>}
      </div>
      <p className="text-[12.5px] text-ink-3">{describeReward(r, seller.skus)}</p>
    </div>
  )
}
function CodesStep({ d, set, setL }: { d: Campaign; set: (p: Partial<Campaign>) => void; setL: (p: NonNullable<Campaign['launch']>) => void }) {
  const codes = d.launch?.codes ?? { mode: 'auto' as const }
  const risk = codeRisk(d)
  const publicCode = d.conditions.find((k) => k.kind === 'code')?.value ?? codes.prefix ?? ''
  const setMode = (mode: 'auto' | 'public' | 'bulk') => {
    const rest = d.conditions.filter((k) => k.kind !== 'code')
    if (mode === 'public') { const v = normaliseCode(publicCode || d.name.split(' ')[0] + '10'); set({ conditions: [...rest, { kind: 'code', value: v }], launch: { ...d.launch, codes: { mode, prefix: v } } }) }
    else { set({ conditions: rest, launch: { ...d.launch, codes: mode === 'bulk' ? { mode, prefix: codes.prefix && codes.mode === 'bulk' ? codes.prefix : 'TZ', count: codes.count ?? 1000 } : { mode } } }) }
  }
  const sample = codes.mode === 'bulk' ? generateCodes(codes.prefix ?? 'TZ', 6, 1) : []
  return (
    <div className="space-y-4">
      <Segmented size="sm" value={codes.mode} onChange={setMode} options={[{ value: 'auto', label: 'No code (auto-apply)' }, { value: 'public', label: 'One public code' }, { value: 'bulk', label: 'Unique single-use codes' }]} />
      {codes.mode === 'public' && <div className="flex flex-wrap items-center gap-2 text-[13px]">Code <TextInput mono label="Code" value={publicCode} onChange={(v) => { const n = normaliseCode(v); set({ conditions: [...d.conditions.filter((k) => k.kind !== 'code'), { kind: 'code', value: n }] }); setL({ codes: { mode: 'public', prefix: n } }) }} className="w-40" /><span className="text-[11.5px] text-ink-3">Trimmed and case-insensitive at checkout</span></div>}
      {codes.mode === 'bulk' && <div className="space-y-3 text-[13px]">
        <div className="flex flex-wrap items-center gap-2">Prefix <TextInput mono label="Prefix" value={codes.prefix ?? ''} onChange={(v) => setL({ codes: { ...codes, prefix: normaliseCode(v).slice(0, 8) } })} className="w-28" /> how many <NumberInput label="Count" value={codes.count} onChange={(v) => setL({ codes: { ...codes, count: Math.min(50000, v ?? 0) } })} className="w-28" /></div>
        <div className="flex flex-wrap gap-1.5">{sample.map((x) => <span key={x} className="num rounded-md border border-dashed border-rule bg-paper px-2 py-1 text-[12px] text-ink">{x}</span>)}<span className="self-center text-[11.5px] text-ink-3">…random, no 0/O or 1/I, collision-checked</span></div>
      </div>}
      <div className="rounded-xl bg-paper-2/70 p-4">
        <div className="flex items-center justify-between text-[12.5px]"><span className="text-ink-2">Leak risk</span><span className={cn('num font-semibold', risk.score >= 0.6 ? 'text-loss' : risk.score >= 0.3 ? 'text-warn' : 'text-gain')}>{risk.score >= 0.6 ? 'High' : risk.score >= 0.3 ? 'Medium' : 'Low'}</span></div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-rule-2"><motion.div className={cn('h-full', risk.score >= 0.6 ? 'bg-loss' : risk.score >= 0.3 ? 'bg-warn' : 'bg-gain')} animate={{ width: `${Math.max(6, risk.score * 100)}%` }} /></div>
        <ul className="mt-2 space-y-0.5 text-[12px] text-ink-3">{risk.reasons.map((x) => <li key={x}>· {x}</li>)}{!risk.reasons.length && <li>· Applies automatically to the audience; nothing to share</li>}</ul>
      </div>
    </div>
  )
}

function LimitsStep({ d, set, setL }: { d: Campaign; set: (p: Partial<Campaign>) => void; setL: (p: NonNullable<Campaign['launch']>) => void }) {
  const days = Math.max(1, d.endDay - Math.max(0, d.startDay))
  return (
    <div className="grid gap-x-6 gap-y-3 text-[13px] sm:grid-cols-2">
      <Row label="Most off one order"><NumberInput label="Max discount" value={d.maxDiscount} onChange={(maxDiscount) => set({ maxDiscount })} prefix="₹" placeholder="no cap" className="w-32" /></Row>
      <Row label="Uses per customer"><NumberInput label="Per customer" value={d.perCustomer} onChange={(perCustomer) => set({ perCustomer })} placeholder="unlimited" className="w-32" /></Row>
      <Row label="Total uses"><NumberInput label="Total uses" value={d.totalRedemptions} onChange={(totalRedemptions) => set({ totalRedemptions })} placeholder="unlimited" className="w-32" /></Row>
      <Row label="Budget"><NumberInput label="Budget" value={d.budget} onChange={(v) => set({ budget: v ?? 0 })} prefix="₹" className="w-32" /></Row>
      <Row label="Expected uses a day"><NumberInput label="Daily uses" value={d.dailyRedemptions} onChange={(v) => set({ dailyRedemptions: v ?? 0 })} className="w-32" /></Row>
      <Row label="Stock reserved"><NumberInput label="Reserved stock" value={d.launch?.reservedStock} onChange={(reservedStock) => setL({ reservedStock })} suffix="units" placeholder="none" className="w-32" /></Row>
      <p className="text-[12px] text-ink-3 sm:col-span-2">Runs {days} days. Budget is reserved when a shopper starts checkout and released if they leave, so the last rupee can't be spent twice.</p>
    </div>
  )
}
function Row({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex items-center justify-between gap-3"><span className="text-ink-2">{label}</span>{children}</label> }

function ScheduleStep({ d, set, setL }: { d: Campaign; set: (p: Partial<Campaign>) => void; setL: (p: NonNullable<Campaign['launch']>) => void }) {
  const { seller } = useLaunchCtx()
  const L = d.launch ?? {}
  const today = new Date().getDay()
  const w = windows(d, today, 14)
  const slots = L.flashSlots ?? []
  return (
    <div className="space-y-4 text-[13px]">
      <div className="flex flex-wrap items-center gap-2">Starts in <NumberInput label="Start day" value={d.startDay} onChange={(v) => set({ startDay: Math.max(0, v ?? 0) })} suffix="days" className="w-24" /><span className="text-ink-3">({fmtDay(d.startDay)})</span> and ends on day <NumberInput label="End day" value={d.endDay} onChange={(v) => set({ endDay: Math.max(d.startDay + 1, v ?? 1) })} className="w-20" /><span className="text-ink-3">({fmtDay(d.endDay)}), IST</span></div>
      <Segmented size="sm" value={L.recurring ?? 'none'} onChange={(recurring) => setL({ recurring })} options={[{ value: 'none', label: 'Always on' }, { value: 'weekends', label: 'Weekends' }, { value: 'evenings', label: 'Evenings 8–10 pm' }, { value: 'flash', label: 'Flash slots' }]} />
      <p className="text-[12px] text-ink-3">{RECURRING[L.recurring ?? 'none']}</p>
      {L.recurring === 'flash' && <div className="space-y-2">
        {slots.map((s, i) => <div key={i} className="flex flex-wrap items-center gap-2">Day <NumberInput label="Day" value={s.day} onChange={(v) => setL({ flashSlots: slots.map((x, j) => (j === i ? { ...x, day: v ?? 0 } : x)) })} className="w-16" /> from <NumberInput label="From hour" value={s.from} onChange={(v) => setL({ flashSlots: slots.map((x, j) => (j === i ? { ...x, from: v ?? 0 } : x)) })} suffix=":00" className="w-20" /> to <NumberInput label="To hour" value={s.to} onChange={(v) => setL({ flashSlots: slots.map((x, j) => (j === i ? { ...x, to: v ?? 0 } : x)) })} suffix=":00" className="w-20" /><button onClick={() => setL({ flashSlots: slots.filter((_, j) => j !== i) })} aria-label="Remove slot" className="text-ink-3 hover:text-loss"><X size={14} /></button></div>)}
        <button onClick={() => setL({ flashSlots: [...slots, { day: Math.max(1, d.startDay), from: 20, to: 22 }] })} className="rounded-full border border-rule px-3 py-1 text-[12.5px] text-ink-2 hover:text-ink">+ Add slot</button>
      </div>}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex items-center gap-2"><Switch checked={!!L.countdown} onChange={(countdown) => setL({ countdown })} label="Countdown" /> Show a countdown</label>
        <label className="flex items-center gap-2">Payment grace <NumberInput label="Grace minutes" value={L.graceMinutes ?? 15} onChange={(graceMinutes) => setL({ graceMinutes })} suffix="min" className="w-20" /></label>
      </div>
      <div>
        <div className="mb-1.5 text-[11px] tracking-wider text-ink-3 uppercase">Next 14 days</div>
        <div className="grid grid-cols-14 gap-1" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
          {Array.from({ length: 14 }, (_, i) => {
            const on = w.filter((x) => x.day === i)
            const ev = seller.calendar.find((e) => e.kind === 'event' && i >= e.day && i < e.day + e.length)
            return (
              <div key={i} title={ev?.label} className={cn('rounded-md border p-1 text-center', on.length ? 'border-gain/40 bg-gain-soft' : 'border-rule-2 bg-paper/50', ev && 'ring-1 ring-brass-2')}>
                <div className="text-[9.5px] text-ink-3">{fmtWeekday(i).slice(0, 2)}</div>
                <div className="num text-[11px] text-ink">{fmtDay(i).split(' ')[0]}</div>
                <div className="num h-3 text-[8.5px] text-gain">{on.length ? (on[0].to - on[0].from === 24 ? 'all day' : `${on[0].from}–${on[0].to}`) : ''}</div>
              </div>
            )
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-ink-3">Brass outline: sale events on {seller.name}'s calendar. Order time decides eligibility; payments get the grace window.</p>
      </div>
    </div>
  )
}

function ChannelsStep({ d, setL }: { d: Campaign; setL: (p: NonNullable<Campaign['launch']>) => void }) {
  const { seller, c } = useLaunchCtx()
  const chosen = d.launch?.channels ?? []
  const map = mapChannels({ ...d, launch: { ...d.launch, channels: Object.keys(seller.market.channels) } }, seller, c)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Object.entries(seller.market.channels).map(([id, ch]) => {
          const on = chosen.includes(id)
          return <button key={id} onClick={() => setL({ channels: on ? chosen.filter((x) => x !== id) : [...chosen, id] })} className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px]', on ? 'border-primary bg-primary text-paper' : 'border-rule text-ink-2 hover:text-ink')}>{on && <Check size={12} />}{ch.label}</button>
        })}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[12.5px]">
          <thead><tr className="border-b border-rule text-left text-ink-3"><th className="py-2 pr-2 font-medium">Channel</th><th className="px-2 py-2 font-medium">Runs as</th><th className="px-2 py-2 font-medium">Fit</th><th className="px-2 py-2 font-medium">Notes</th></tr></thead>
          <tbody>
            {map.map((m) => (
              <tr key={m.channel} className={cn('border-b border-rule-2 align-top', !chosen.includes(m.channel) && chosen.length > 0 && 'opacity-40')}>
                <td className="py-2 pr-2 text-ink">{m.label}<div className="text-[11px] text-ink-3">{pct(m.commission)} commission · {m.funding}</div></td>
                <td className="px-2 py-2 text-ink">{m.format}</td>
                <td className="px-2 py-2"><Chip tone={m.fit === 'native' ? 'gain' : m.fit === 'adapted' ? 'warn' : 'loss'}>{m.fit === 'native' ? 'As built' : m.fit === 'adapted' ? 'Adapted' : 'Can\'t run'}</Chip></td>
                <td className="px-2 py-2 text-ink-2">{m.notes.map((n) => n.replace(/\.?$/, '.')).join(' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="flex gap-1.5 text-[11.5px] text-ink-3"><Info size={12} className="mt-0.5 shrink-0" /> Formats are an illustrative map of typical seller-panel options, not official marketplace rules. In production this would come from each platform's API.</p>
    </div>
  )
}

function StackingStep({ d, set, setL }: { d: Campaign; set: (p: Partial<Campaign>) => void; setL: (p: NonNullable<Campaign['launch']>) => void }) {
  const { seller, campaigns, ctx } = useLaunchCtx()
  const cart = useMemo(() => qualifyingCart(d, seller), [d, seller])
  const res = useMemo(() => evaluateCart(cart, [...campaigns.filter((k) => k.id !== d.id), d], { ...ctx(cart), preview: d.id }), [cart, campaigns, d, ctx])
  const applied = res.evals.filter((e) => e.stopAt === null && (e.discount > 0 || e.cashback || e.points || e.freeItem))
  const total = res.subtotal ? (res.saved + res.cashback) / res.subtotal : 0
  const cap = d.launch?.maxOrderPct ?? 0.35
  return (
    <div className="space-y-4 text-[13px]">
      <Segmented size="sm" value={d.stacking} onChange={(stacking) => set({ stacking })} options={[{ value: 'exclusive', label: 'Exclusive' }, { value: 'stackable', label: 'Stacks with others' }, { value: 'always', label: 'Always applies' }]} />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <label className="flex items-center gap-2">Priority <NumberInput label="Priority" value={d.priority} onChange={(v) => set({ priority: v ?? 5 })} className="w-16" /><span className="text-[11.5px] text-ink-3">lower runs first</span></label>
        <label className="flex items-center gap-2">Most off one order, all offers <NumberInput label="Max per order" value={Math.round(cap * 100)} onChange={(v) => setL({ maxOrderPct: (v ?? 35) / 100 })} suffix="%" className="w-20" /></label>
      </div>
      <div className="rounded-xl border border-rule bg-paper/60 p-4">
        <div className="text-[11px] tracking-wider text-ink-3 uppercase">Worst qualifying cart, with every live offer</div>
        <ul className="mt-2 space-y-1">{applied.map((e) => <li key={e.campaign.id} className="flex justify-between"><span className={cn(e.campaign.id === d.id ? 'font-semibold text-ink' : 'text-ink-2')}>{e.campaign.id === d.id ? 'This offer' : e.campaign.name}</span><span className="num text-gain">−₹{Math.round(e.discount + (e.cashback ?? 0)).toLocaleString('en-IN')}</span></li>)}</ul>
        <div className="mt-2 flex justify-between border-t border-dashed border-rule pt-2"><span className="text-ink-2">On a ₹{Math.round(res.subtotal).toLocaleString('en-IN')} cart</span><span className={cn('num font-semibold', total > cap ? 'text-loss' : 'text-ink')}>{pct(total)} off · {pct(res.marginPct)} margin</span></div>
      </div>
    </div>
  )
}

const ICON: Record<Flight['level'], { icon: LucideIcon; cls: string }> = { block: { icon: AlertOctagon, cls: 'text-loss' }, warn: { icon: AlertTriangle, cls: 'text-warn' }, ok: { icon: CheckCircle2, cls: 'text-gain' }, info: { icon: Info, cls: 'text-ink-3' } }
function PreflightStep({ flights, onFix }: { flights: Flight[]; onFix: (p: Partial<Campaign>) => void }) {
  const order: Record<Flight['level'], number> = { block: 0, warn: 1, info: 2, ok: 3 }
  return (
    <ul className="space-y-2">
      {[...flights].sort((a, b) => order[a.level] - order[b.level]).map((f) => {
        const I = ICON[f.level]
        return (
          <li key={f.id} className={cn('flex gap-3 rounded-xl border p-3', f.level === 'block' ? 'border-loss/30 bg-loss-soft/50' : f.level === 'warn' ? 'border-warn/30 bg-warn-soft/40' : 'border-rule-2 bg-paper/50')}>
            <I.icon size={17} className={cn('mt-0.5 shrink-0', I.cls)} />
            <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-ink">{f.title}</div><div className="text-[12.5px] leading-snug text-ink-2">{f.detail}</div></div>
            {f.fix && Object.keys(f.fix.patch).length > 0 && <button onClick={() => onFix(f.fix!.patch)} className="h-fit shrink-0 rounded-full bg-primary px-3 py-1 text-[12px] font-medium text-paper">{f.fix.label}</button>}
          </li>
        )
      })}
    </ul>
  )
}

function ApprovalStep({ reasons, role }: { reasons: string[]; role: 'maker' | 'checker' }) {
  const { policy, setPolicy } = useLaunch()
  return (
    <div className="space-y-4 text-[13px]">
      {reasons.length ? (
        <div className="rounded-xl border border-brass/30 bg-brass-soft/50 p-4"><div className="font-semibold text-ink">Needs a second pair of eyes</div><ul className="mt-1 space-y-0.5 text-ink-2">{reasons.map((r) => <li key={r}>· {r}</li>)}</ul><p className="mt-2 text-[12px] text-ink-3">The approver sees the plain-English rule, the pre-flight result and a diff against any earlier version.</p></div>
      ) : <div className="rounded-xl border border-gain/30 bg-gain-soft/60 p-4 font-medium text-gain">Within policy: no approval needed. You can schedule it directly.</div>}
      <div>
        <div className="mb-2 text-[11px] tracking-wider text-ink-3 uppercase">Approval policy</div>
        <div className="space-y-3">
          <div><div className="flex justify-between"><span className="text-ink-2">Discount deeper than</span><span className="num font-semibold text-ink">{pct(policy.discountOver)}</span></div><Slider label="Discount threshold" min={0.1} max={0.6} step={0.05} value={policy.discountOver} onChange={(discountOver) => setPolicy({ discountOver })} className="mt-1.5" /></div>
          <div><div className="flex justify-between"><span className="text-ink-2">Budget above</span><span className="num font-semibold text-ink">{inrShort(policy.budgetOver)}</span></div><Slider label="Budget threshold" min={5000} max={200000} step={5000} value={policy.budgetOver} onChange={(budgetOver) => setPolicy({ budgetOver })} className="mt-1.5" /></div>
        </div>
      </div>
      <p className="text-[12px] text-ink-3">You're acting as the <b className="text-ink">{role}</b>. Switch roles on the Lifecycle board to approve.</p>
    </div>
  )
}

function PublishStep({ d, read, v, reasons, onFinish }: { d: Campaign; read: string; v: ReturnType<typeof verdict>; reasons: string[]; onFinish: (m: 'draft' | 'submit' | 'publish') => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-paper-2/70 p-4"><div className="flex items-center justify-between"><span className="text-[11px] tracking-wider text-ink-3 uppercase">Summary</span><Verdict v={v} /></div><p className="mt-2 text-[14px] leading-relaxed text-ink">{read}</p><p className="mt-2 text-[12px] text-ink-3">{d.startDay > 0 ? `Starts ${fmtDay(d.startDay)}` : 'Starts today'} · ends {fmtDay(d.endDay)} · budget ₹{d.budget.toLocaleString('en-IN')}</p></div>
      {v === 'blocked' && <p className="text-[13px] text-loss">Pre-flight found a blocker. Fix it on the Pre-flight step before this can go anywhere.</p>}
      <div className="flex flex-wrap gap-2">
        {reasons.length
          ? <button disabled={v === 'blocked'} onClick={() => onFinish('submit')} className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-paper disabled:opacity-40"><Zap size={14} className="text-brass-2" /> Submit for approval</button>
          : <button disabled={v === 'blocked'} onClick={() => onFinish('publish')} className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-paper disabled:opacity-40"><Rocket size={14} className="text-brass-2" /> {d.startDay > 0 ? 'Schedule it' : 'Go live now'}</button>}
        <button onClick={() => onFinish('draft')} className="rounded-full border border-rule px-4 py-2 text-[13px] text-ink-2 hover:text-ink">Save as draft</button>
      </div>
    </div>
  )
}
