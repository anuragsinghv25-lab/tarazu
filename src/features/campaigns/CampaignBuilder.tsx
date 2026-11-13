import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { Plus, Trash2, FlaskConical, Save, RotateCcw, Minus, AlertTriangle, Link2, Ban, Layers } from 'lucide-react'
import { Card, Chip, Eyebrow, PageHeader, Segmented } from '@/components/ui'
import { NumberInput, Select, TextInput } from '@/components/ui/form'
import { Spot } from '@/components/Spot'
import { useStore } from '@/state/store'
import { useCampaigns, useSeller } from '@/state/hooks'
import { burnDown, costPerRedemption, describeCondition, describeReward, PAYMENTS, SEGMENTS } from '@/engine/cart'
import type { Campaign, Condition, Funding, Reward, Segment, Stacking } from '@/engine/types'
import type { SellerDef } from '@/data/sellers'
import { newCampaign, sentence, templates } from './templates'
import { fmtDay } from '@/lib/dates'
import { inrAxis, inrShort } from '@/lib/format'
import { cn } from '@/lib/cn'

const STATUS_TONE = { live: 'gain', scheduled: 'brass', draft: 'quiet', paused: 'warn' } as const

export function CampaignBuilder() {
  const seller = useSeller()
  const campaigns = useCampaigns()
  const { saveCampaign, removeCampaign, resetCampaigns } = useStore()
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const selectedId = params.get('id') ?? campaigns[0]?.id
  const selected = campaigns.find((c) => c.id === selectedId) ?? campaigns[0]
  const [draft, setDraft] = useState<Campaign | null>(selected ?? null)
  useEffect(() => { setDraft(selected ?? null) }, [selected?.id, seller.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = !!draft && !!selected && JSON.stringify(draft) !== JSON.stringify(selected)
  const select = (id: string) => setParams({ id }, { replace: true })

  const create = (mechanic: string, patch: Partial<Campaign>) => {
    const c = newCampaign(seller, mechanic, patch)
    saveCampaign(c)
    select(c.id)
    toast(`Draft created: ${mechanic}`, { description: 'Edit the blocks, then save or test it in the Cart Sandbox.' })
  }

  return (
    <div>
      <PageHeader eyebrow="Campaign builder" title={<>Rules, not guesses.</>}
        aside={<NewMenu seller={seller} onPick={create} />}>
        Every promotion is a rule: who qualifies, what must be true, what they get, how far it can go, and how it combines with
        other offers. Build one block by block and watch its budget and conflicts update live.
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[270px_1fr_340px]">
        <Spot id="campaign-list" className="xl:sticky xl:top-24 xl:self-start">
          <Card className="p-2">
            <div className="flex items-center justify-between px-2.5 pt-2 pb-1">
              <Eyebrow>{seller.name}'s campaigns · {campaigns.length}</Eyebrow>
              <button onClick={() => { resetCampaigns(); toast('Campaigns reset to the demo set') }} title="Reset to demo campaigns" className="rounded-full p-1 text-ink-3 hover:bg-paper-2 hover:text-ink"><RotateCcw size={13} /></button>
            </div>
            <ul className="max-h-[66vh] space-y-0.5 overflow-y-auto">
              {[...campaigns].sort((a, b) => a.priority - b.priority).map((c) => (
                <li key={c.id}>
                  <button onClick={() => select(c.id)} className={cn('w-full rounded-xl px-2.5 py-2 text-left transition-colors', c.id === selected?.id ? 'bg-primary text-paper' : 'hover:bg-paper-2')}>
                    <div className="flex items-center gap-2">
                      <span className={cn('num grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px]', c.id === selected?.id ? 'bg-paper/15 text-brass-2' : 'bg-paper-2 text-ink-3')}>{c.priority}</span>
                      <span className="line-clamp-1 flex-1 text-[12.5px] font-medium">{c.name}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 pl-7">
                      <span className={cn('rounded-full px-1.5 py-px text-[10px] font-medium', c.id === selected?.id ? 'bg-paper/10 text-paper/70' : { live: 'bg-gain-soft text-gain', scheduled: 'bg-brass-soft text-[var(--color-brass-ink)]', draft: 'bg-paper-2 text-ink-3', paused: 'bg-warn-soft text-[var(--color-brass-ink)]' }[c.status])}>{c.status}</span>
                      <span className={cn('text-[10.5px]', c.id === selected?.id ? 'text-paper/60' : 'text-ink-3')}>{c.mechanic}</span>
                    </div>
                    <div className={cn('mt-1.5 ml-7 h-1 overflow-hidden rounded-full', c.id === selected?.id ? 'bg-paper/15' : 'bg-paper-2')}>
                      <div className={cn('h-full rounded-full', c.spent / c.budget > 0.85 ? 'bg-loss' : 'bg-brass')} style={{ width: `${Math.min(100, (c.spent / c.budget) * 100)}%` }} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </Spot>

        {draft ? (
          <>
            <RuleCanvas c={draft} seller={seller} onChange={setDraft} />
            <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
              <Card className="p-4">
                <div className="flex flex-wrap gap-2">
                  <button disabled={!dirty} onClick={() => { saveCampaign(draft); toast('Campaign saved', { description: draft.name }) }}
                    className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-paper disabled:opacity-35"><Save size={13} /> Save{dirty ? '' : 'd'}</button>
                  <button onClick={() => { if (dirty) saveCampaign(draft); nav(`/sandbox?preview=${draft.id}`) }}
                    className="flex items-center gap-1.5 rounded-full border border-brass/40 bg-brass-soft px-3.5 py-1.5 text-[12.5px] font-medium text-[var(--color-brass-ink)]"><FlaskConical size={13} /> Test in Cart Sandbox</button>
                  <button onClick={() => { removeCampaign(draft.id); setParams({}, { replace: true }); toast('Campaign deleted') }} title="Delete"
                    className="ml-auto rounded-full p-2 text-ink-3 hover:bg-loss-soft hover:text-loss"><Trash2 size={14} /></button>
                </div>
                {dirty && <div className="mt-2 text-[11.5px] text-warn">Unsaved changes. The preview below already reflects them.</div>}
              </Card>
              <Spot id="campaign-sentence"><ReadsAs c={draft} seller={seller} /></Spot>
              <Spot id="burn-down"><BudgetCard c={draft} seller={seller} /></Spot>
              <Spot id="conflicts"><Conflicts c={draft} all={campaigns} /></Spot>
            </div>
          </>
        ) : (
          <Card className="col-span-2 grid place-items-center p-16 text-center text-[14px] text-ink-3">No campaigns yet. Start one from a template.</Card>
        )}
      </div>
    </div>
  )
}

function NewMenu({ seller, onPick }: { seller: SellerDef; onPick: (m: string, p: Partial<Campaign>) => void }) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger className="flex items-center gap-2 self-start rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-paper md:self-auto"><Plus size={15} className="text-brass-2" /> New campaign</Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content align="end" sideOffset={8} className="z-50 grid w-[440px] max-w-[92vw] grid-cols-2 gap-1 rounded-2xl border border-rule bg-card p-2 shadow-[var(--shadow-lift)]">
          <div className="col-span-2 px-2 pt-1 pb-1.5 text-[10.5px] font-semibold tracking-[0.14em] text-ink-3 uppercase">Start from a mechanic</div>
          {templates(seller).map((t) => (
            <Dropdown.Item key={t.mechanic} onSelect={() => onPick(t.mechanic, t.make())} className="cursor-pointer rounded-xl px-2.5 py-2 outline-none data-[highlighted]:bg-paper-2">
              <div className="text-[13px] font-medium text-ink">{t.mechanic}</div>
              <div className="text-[11.5px] leading-snug text-ink-3">{t.blurb}</div>
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  )
}

/* ───────── The rule canvas: blocks joined by a travelling beam ───────── */

function Block({ tag, title, children, id, tone = 'ink' }: { tag: string; title: string; children: ReactNode; id: string; tone?: 'ink' | 'brass' }) {
  return (
    <Spot id={id}>
      <motion.div layout className="relative rounded-2xl border border-rule bg-card p-4 pl-[74px] shadow-[var(--shadow-card)]">
        <div className={cn('display absolute top-4 left-4 grid h-10 w-12 place-items-center rounded-xl text-[15px] italic', tone === 'brass' ? 'bg-brass text-card' : 'bg-primary text-brass-2')}>{tag}</div>
        <div className="mb-3 text-[13px] font-semibold text-ink">{title}</div>
        <div className="space-y-2.5">{children}</div>
      </motion.div>
    </Spot>
  )
}

function Beam() {
  return (
    <div className="relative ml-[39px] h-7 w-px bg-rule" aria-hidden>
      <motion.span className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-brass-2 shadow-[0_0_10px_2px_rgba(245,158,11,0.6)]"
        animate={{ top: ['-4px', '24px'], opacity: [0, 1, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
    </div>
  )
}

function RuleCanvas({ c, seller, onChange }: { c: Campaign; seller: SellerDef; onChange: (c: Campaign) => void }) {
  const set = (patch: Partial<Campaign>) => onChange({ ...c, ...patch })
  const channels = [{ value: 'all', label: 'Every channel' }, ...Object.entries(seller.market.channels).map(([k, f]) => ({ value: k, label: f.label }))]
  const catOptions = [...new Set(seller.skus.map((s) => s.category))].map((k) => ({ value: k, label: k }))
  const skuOptions = seller.shelf.map((id) => seller.skus.find((s) => s.id === id)!).filter(Boolean).map((s) => ({ value: s.id, label: s.name }))
  const share = c.partnerShare ?? (c.funding === 'seller' ? 0 : c.funding === 'co-funded' ? 0.5 : 1)

  return (
    <div>
      <Spot id="campaign-header">
        <Card className="p-4">
          <input value={c.name} onChange={(e) => set({ name: e.target.value })} aria-label="Campaign name"
            className="display w-full bg-transparent text-[24px] leading-tight text-ink outline-none placeholder:text-ink-3" />
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
            <Chip tone={STATUS_TONE[c.status]}>{c.status}</Chip><span>{c.mechanic}</span><span>·</span>
            <span className="num">{fmtDay(c.startDay)} → {fmtDay(c.endDay)}</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Labeled label="Status"><Segmented<Campaign['status']> size="sm" value={c.status} onChange={(v) => set({ status: v })} options={[{ value: 'draft', label: 'Draft' }, { value: 'scheduled', label: 'Scheduled' }, { value: 'live', label: 'Live' }, { value: 'paused', label: 'Paused' }]} /></Labeled>
            <Labeled label="Channel"><Select label="Channel" value={c.channel} onChange={(v) => set({ channel: v })} options={channels} className="w-full" /></Labeled>
            <Labeled label="Runs (days from today)">
              <div className="flex items-center gap-1.5">
                <NumberInput label="Start day" value={c.startDay} min={-60} onChange={(v) => set({ startDay: v ?? 0 })} prefix="from" className="w-[96px]" />
                <NumberInput label="End day" value={c.endDay} min={c.startDay} onChange={(v) => set({ endDay: Math.max(c.startDay, v ?? c.startDay) })} prefix="to" className="w-[90px]" />
              </div>
            </Labeled>
            <Labeled label="Budget"><NumberInput label="Budget" value={c.budget} step={1000} onChange={(v) => set({ budget: v ?? 0 })} prefix="₹" className="w-full" /></Labeled>
            <Labeled label="Who funds it">
              <Select<Funding> label="Funding" value={c.funding} onChange={(v) => set({ funding: v, partnerShare: v === 'seller' ? 0 : v === 'co-funded' ? 0.5 : 1 })} className="w-full"
                options={[{ value: 'seller', label: 'Seller-funded' }, { value: 'co-funded', label: 'Co-funded with platform' }, { value: 'platform', label: 'Platform-funded' }, { value: 'bank', label: 'Bank or card partner' }, { value: 'partner', label: 'Payments partner' }]} />
            </Labeled>
            {c.funding !== 'seller' && (
              <Labeled label="Partner pays"><NumberInput label="Partner share" value={Math.round(share * 100)} onChange={(v) => set({ partnerShare: Math.min(100, v ?? 0) / 100 })} suffix="% of the discount" className="w-full" /></Labeled>
            )}
          </div>
        </Card>
      </Spot>
      <Beam />

      <Block tag="who" title="Eligibility" id="block-who">
        <Select<Segment> label="Segment" value={c.segment} onChange={(v) => set({ segment: v })} className="w-full sm:w-auto"
          options={(Object.keys(SEGMENTS) as Segment[]).filter((k) => seller.ownChannel || (k !== 'gold' && k !== 'lapsed')).map((k) => ({ value: k, label: SEGMENTS[k] }))} />
        {!seller.ownChannel && <div className="text-[11.5px] text-ink-3">Member segments need customer data. Marketplaces keep it, so {seller.name} can only target everyone or new buyers.</div>}
      </Block>
      <Beam />

      <Block tag="if" title="Conditions" id="block-if">
        <div className="flex items-center gap-2 text-[12px] text-ink-3">
          Match <Segmented<'all' | 'any'> size="sm" value={c.match} onChange={(v) => set({ match: v })} options={[{ value: 'all', label: 'all' }, { value: 'any', label: 'any' }]} /> of these
        </div>
        <AnimatePresence initial={false}>
          {c.conditions.map((x, i) => (
            <motion.div key={i} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap items-center gap-2 rounded-xl bg-paper-2/60 p-2">
              <ConditionEditor x={x} cats={catOptions} skus={skuOptions} onChange={(nx) => set({ conditions: c.conditions.map((y, j) => (j === i ? nx : y)) })} />
              <button onClick={() => set({ conditions: c.conditions.filter((_, j) => j !== i) })} className="ml-auto rounded-full p-1 text-ink-3 hover:bg-card hover:text-loss" aria-label="Remove condition"><Minus size={14} /></button>
            </motion.div>
          ))}
        </AnimatePresence>
        {c.conditions.length === 0 && <div className="text-[12px] text-ink-3">No conditions: every order qualifies.</div>}
        <button onClick={() => set({ conditions: [...c.conditions, { kind: 'cartMin', value: Math.round(seller.avgOrder / 100) * 100 }] })}
          className="flex items-center gap-1 text-[12px] font-medium text-brass hover:text-ink"><Plus size={13} /> Add condition</button>
      </Block>
      <Beam />

      <Block tag="then" title="Reward" id="block-then" tone="brass">
        <RewardEditor r={c.reward} cats={catOptions} skus={skuOptions} onChange={(r) => set({ reward: r })} />
      </Block>
      <Beam />

      <Block tag="cap" title="Limits" id="block-limits">
        <div className="grid gap-2 sm:grid-cols-3">
          <Labeled label="Max off per order"><NumberInput label="Max discount" value={c.maxDiscount} placeholder="no cap" prefix="₹" onChange={(v) => set({ maxDiscount: v })} className="w-full" /></Labeled>
          <Labeled label="Uses per customer"><NumberInput label="Per customer" value={c.perCustomer} placeholder="unlimited" onChange={(v) => set({ perCustomer: v })} className="w-full" /></Labeled>
          <Labeled label="Total redemptions"><NumberInput label="Total redemptions" value={c.totalRedemptions} placeholder="unlimited" step={50} onChange={(v) => set({ totalRedemptions: v })} className="w-full" /></Labeled>
        </div>
      </Block>
      <Beam />

      <Block tag="stack" title="Stacking and priority" id="block-stack">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented<Stacking> size="sm" value={c.stacking} onChange={(v) => set({ stacking: v })} options={[{ value: 'exclusive', label: 'Exclusive' }, { value: 'stackable', label: 'Stackable' }, { value: 'always', label: 'Always stacks' }]} />
          <div className="flex items-center gap-1.5 text-[12px] text-ink-3">
            Priority
            <button onClick={() => set({ priority: Math.max(1, c.priority - 1) })} className="grid h-6 w-6 place-items-center rounded-full border border-rule bg-card hover:border-primary" aria-label="Raise priority"><Minus size={12} /></button>
            <span className="num w-5 text-center text-[14px] font-semibold text-ink">{c.priority}</span>
            <button onClick={() => set({ priority: c.priority + 1 })} className="grid h-6 w-6 place-items-center rounded-full border border-rule bg-card hover:border-primary" aria-label="Lower priority"><Plus size={12} /></button>
          </div>
        </div>
        <div className="text-[12px] leading-snug text-ink-3">
          {c.stacking === 'exclusive' && 'Applies alone. If a higher-priority offer already applied, this one is skipped; if this applies first, it blocks the rest.'}
          {c.stacking === 'stackable' && 'Combines with other stackable offers, but an exclusive offer that applies first will block it.'}
          {c.stacking === 'always' && 'Always applies on top, even with exclusive offers. Use for free shipping, points and partner-funded cashback.'}
          {' '}Lower number = evaluated first.
        </div>
      </Block>
    </div>
  )
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1 block text-[11px] font-medium tracking-wide text-ink-3 uppercase">{label}</span>{children}</label>
}

function ConditionEditor({ x, cats, skus, onChange }: { x: Condition; cats: { value: string; label: string }[]; skus: { value: string; label: string }[]; onChange: (c: Condition) => void }) {
  const kind = (k: Condition['kind']): Condition => {
    switch (k) {
      case 'cartMin': return { kind: k, value: 999 }
      case 'hasCategory': return { kind: k, value: cats[0].value }
      case 'hasSku': return { kind: k, value: skus[0].value }
      case 'qtyMin': return { kind: k, value: 2, category: cats[0].value }
      case 'code': return { kind: k, value: 'SAVE10' }
      case 'payment': return { kind: k, value: 'upi' }
    }
  }
  return (
    <>
      <Select<Condition['kind']> label="Condition" value={x.kind} onChange={(k) => onChange(kind(k))}
        options={[{ value: 'cartMin', label: 'Cart value at least' }, { value: 'hasCategory', label: 'Cart has category' }, { value: 'hasSku', label: 'Cart has product' }, { value: 'qtyMin', label: 'Quantity at least' }, { value: 'code', label: 'Coupon code' }, { value: 'payment', label: 'Payment method' }]} />
      {x.kind === 'cartMin' && <NumberInput label="Minimum" value={x.value} prefix="₹" step={50} onChange={(v) => onChange({ ...x, value: v ?? 0 })} className="w-[110px]" />}
      {x.kind === 'hasCategory' && <Select label="Category" value={x.value} onChange={(v) => onChange({ ...x, value: v })} options={cats} />}
      {x.kind === 'hasSku' && <Select label="Product" value={x.value} onChange={(v) => onChange({ ...x, value: v })} options={skus.some((s) => s.value === x.value) ? skus : [{ value: x.value, label: x.value }, ...skus]} className="max-w-[260px]" />}
      {x.kind === 'qtyMin' && <>
        <NumberInput label="Quantity" value={x.value} onChange={(v) => onChange({ ...x, value: v ?? 1 })} suffix="units of" className="w-[110px]" />
        <Select label="Of" value={x.sku ? `sku:${x.sku}` : `cat:${x.category}`} onChange={(v) => onChange(v.startsWith('sku:') ? { kind: 'qtyMin', value: x.value, sku: v.slice(4) } : { kind: 'qtyMin', value: x.value, category: v.slice(4) })}
          options={[...cats.map((k) => ({ value: `cat:${k.value}`, label: `any ${k.label.toLowerCase()}` })), ...skus.map((k) => ({ value: `sku:${k.value}`, label: k.label })), ...(x.sku && !skus.some((s) => s.value === x.sku) ? [{ value: `sku:${x.sku}`, label: x.sku }] : [])]} className="max-w-[240px]" />
      </>}
      {x.kind === 'code' && <TextInput label="Code" mono value={x.value} onChange={(v) => onChange({ ...x, value: v.toUpperCase().replace(/\s/g, '') })} className="w-[120px]" />}
      {x.kind === 'payment' && <Select label="Payment" value={x.value} onChange={(v) => onChange({ ...x, value: v })} options={Object.entries(PAYMENTS).map(([k, l]) => ({ value: k, label: l }))} />}
    </>
  )
}

function RewardEditor({ r, cats, skus, onChange }: { r: Reward; cats: { value: string; label: string }[]; skus: { value: string; label: string }[]; onChange: (r: Reward) => void }) {
  const kind = (k: Reward['kind']): Reward => {
    switch (k) {
      case 'pctOff': return { kind: k, value: 0.1, target: 'cart' }
      case 'amountOff': return { kind: k, value: 150 }
      case 'tiered': return { kind: k, tiers: [{ min: 999, off: 100 }, { min: 1999, off: 300 }] }
      case 'bxgy': return { kind: k, buy: 2, get: 1, getPct: 1, ref: cats[0].value, refKind: 'category' }
      case 'multiBuy': return { kind: k, qty: 3, price: 499, ref: skus[0].value, refKind: 'sku' }
      case 'freeItem': return { kind: k, sku: skus[skus.length - 1].value }
      case 'freeShipping': return { kind: k }
      case 'bundlePrice': return { kind: k, skus: [skus[0].value, skus[1].value], price: 999 }
      case 'points': return { kind: k, multiplier: 2 }
      case 'cashback': return { kind: k, pct: 0.05, max: 100 }
    }
  }
  const skuOpts = (id: string) => (skus.some((s) => s.value === id) ? skus : [{ value: id, label: id }, ...skus])
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select<Reward['kind']> label="Reward" value={r.kind} onChange={(k) => onChange(kind(k))}
        options={[{ value: 'pctOff', label: '% off' }, { value: 'amountOff', label: '₹ off' }, { value: 'tiered', label: 'Tiered ₹ off' }, { value: 'bxgy', label: 'Buy X get Y' }, { value: 'multiBuy', label: 'Multi-buy price' }, { value: 'bundlePrice', label: 'Bundle price' }, { value: 'freeItem', label: 'Free item' }, { value: 'freeShipping', label: 'Free shipping' }, { value: 'points', label: 'Loyalty points' }, { value: 'cashback', label: 'Cashback' }]} />
      {r.kind === 'pctOff' && <>
        <NumberInput label="Percent" value={Math.round(r.value * 100)} suffix="% off" onChange={(v) => onChange({ ...r, value: Math.min(90, v ?? 0) / 100 })} className="w-[100px]" />
        <Select label="Target" value={r.target === 'cart' ? 'cart' : `${r.target}:${r.ref}`} onChange={(v) => onChange(v === 'cart' ? { kind: 'pctOff', value: r.value, target: 'cart' } : { kind: 'pctOff', value: r.value, target: v.startsWith('category:') ? 'category' : 'sku', ref: v.split(':').slice(1).join(':') })}
          options={[{ value: 'cart', label: 'the whole order' }, ...cats.map((k) => ({ value: `category:${k.value}`, label: k.label })), ...skus.map((k) => ({ value: `sku:${k.value}`, label: k.label })), ...(r.target === 'sku' && r.ref && !skus.some((s) => s.value === r.ref) ? [{ value: `sku:${r.ref}`, label: r.ref }] : [])]} className="max-w-[260px]" />
      </>}
      {r.kind === 'amountOff' && <NumberInput label="Amount" value={r.value} prefix="₹" step={10} onChange={(v) => onChange({ ...r, value: v ?? 0 })} className="w-[110px]" />}
      {r.kind === 'tiered' && (
        <div className="w-full space-y-1.5">
          {r.tiers.map((t, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
              Spend <NumberInput label="Tier minimum" value={t.min} prefix="₹" step={50} onChange={(v) => onChange({ ...r, tiers: r.tiers.map((x, j) => (j === i ? { ...x, min: v ?? 0 } : x)) })} className="w-[110px]" />
              get <NumberInput label="Tier discount" value={t.off} prefix="₹" step={10} onChange={(v) => onChange({ ...r, tiers: r.tiers.map((x, j) => (j === i ? { ...x, off: v ?? 0 } : x)) })} className="w-[100px]" /> off
              {r.tiers.length > 1 && <button onClick={() => onChange({ ...r, tiers: r.tiers.filter((_, j) => j !== i) })} className="text-ink-3 hover:text-loss" aria-label="Remove tier"><Minus size={13} /></button>}
            </div>
          ))}
          <button onClick={() => { const last = r.tiers[r.tiers.length - 1]; onChange({ ...r, tiers: [...r.tiers, { min: last.min * 2, off: last.off * 2 }] }) }} className="flex items-center gap-1 text-[12px] font-medium text-brass"><Plus size={13} /> Add tier</button>
        </div>
      )}
      {r.kind === 'bxgy' && <>
        <span className="text-[12px] text-ink-3">Buy</span><NumberInput label="Buy" value={r.buy} onChange={(v) => onChange({ ...r, buy: Math.max(1, v ?? 1) })} className="w-[60px]" />
        <span className="text-[12px] text-ink-3">get</span><NumberInput label="Get" value={r.get} onChange={(v) => onChange({ ...r, get: Math.max(1, v ?? 1) })} className="w-[60px]" />
        <NumberInput label="Off on free units" value={Math.round(r.getPct * 100)} suffix="% off" onChange={(v) => onChange({ ...r, getPct: Math.min(100, v ?? 100) / 100 })} className="w-[100px]" />
        <Select label="On" value={r.ref} onChange={(v) => onChange({ ...r, ref: v, refKind: 'category' })} options={cats} />
      </>}
      {r.kind === 'multiBuy' && <>
        <NumberInput label="Quantity" value={r.qty} onChange={(v) => onChange({ ...r, qty: Math.max(2, v ?? 2) })} suffix="for" className="w-[80px]" />
        <NumberInput label="Price" value={r.price} prefix="₹" step={10} onChange={(v) => onChange({ ...r, price: v ?? 0 })} className="w-[100px]" />
        <Select label="Product" value={r.ref} onChange={(v) => onChange({ ...r, ref: v, refKind: 'sku' })} options={skuOpts(r.ref)} className="max-w-[240px]" />
      </>}
      {r.kind === 'bundlePrice' && <>
        <Select label="First product" value={r.skus[0]} onChange={(v) => onChange({ ...r, skus: [v, r.skus[1]] })} options={skuOpts(r.skus[0])} className="max-w-[220px]" />
        <span className="text-ink-3">+</span>
        <Select label="Second product" value={r.skus[1]} onChange={(v) => onChange({ ...r, skus: [r.skus[0], v] })} options={skuOpts(r.skus[1])} className="max-w-[220px]" />
        <NumberInput label="Bundle price" value={r.price} prefix="for ₹" step={10} onChange={(v) => onChange({ ...r, price: v ?? 0 })} className="w-[120px]" />
      </>}
      {r.kind === 'freeItem' && <Select label="Free product" value={r.sku} onChange={(v) => onChange({ ...r, sku: v })} options={skuOpts(r.sku)} className="max-w-[260px]" />}
      {r.kind === 'points' && <NumberInput label="Multiplier" value={r.multiplier} suffix="× points" onChange={(v) => onChange({ ...r, multiplier: Math.max(1, v ?? 1) })} className="w-[110px]" />}
      {r.kind === 'cashback' && <>
        <NumberInput label="Cashback percent" value={Math.round(r.pct * 100)} suffix="%" onChange={(v) => onChange({ ...r, pct: (v ?? 0) / 100 })} className="w-[80px]" />
        <NumberInput label="Cashback max" value={r.max} prefix="up to ₹" step={10} onChange={(v) => onChange({ ...r, max: v ?? 0 })} className="w-[130px]" />
      </>}
    </div>
  )
}

/* ───────── Right column: plain English, budget, conflicts ───────── */

function ReadsAs({ c, seller }: { c: Campaign; seller: SellerDef }) {
  const text = sentence(c, seller, (x) => describeCondition(x, seller.skus), (r) => describeReward(r, seller.skus))
  return (
    <Card className="p-4">
      <Eyebrow>Reads as</Eyebrow>
      <p className="display mt-2 text-[17px] leading-snug text-ink">{text}</p>
    </Card>
  )
}

function BudgetCard({ c, seller }: { c: Campaign; seller: SellerDef }) {
  const per = costPerRedemption(c, seller.avgOrder, seller.skus, seller.shippingFee)
  const b = useMemo(() => burnDown(c, per), [c, per])
  const over = b.exhaustDay !== null && b.exhaustDay <= c.endDay
  const data = b.pts.map((p) => ({ ...p, label: fmtDay(p.day) }))
  return (
    <Card className="p-4">
      <Eyebrow>Budget burn-down</Eyebrow>
      <div className="num mt-0.5 text-[12px] text-ink-3">{inrShort(c.spent)} of {inrShort(c.budget)} spent so far</div>
      <div className="mt-2 h-[150px]">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="burn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={over ? 'var(--color-loss)' : 'var(--color-brass)'} stopOpacity={0.35} /><stop offset="1" stopColor={over ? 'var(--color-loss)' : 'var(--color-brass)'} stopOpacity={0.02} /></linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-rule-2)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-ink-3)' }} tickLine={false} axisLine={{ stroke: 'var(--color-rule)' }} interval="preserveStartEnd" minTickGap={30} />
            <YAxis tickFormatter={inrAxis} tick={{ fontSize: 10, fill: 'var(--color-ink-3)' }} axisLine={false} tickLine={false} width={48} />
            <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-rule)', borderRadius: 10, fontSize: 12 }} formatter={(v) => [inrShort(Number(v)), 'Spent by then']} />
            <ReferenceLine y={c.budget} stroke="var(--color-primary)" strokeDasharray="4 3" label={{ value: 'budget', position: 'insideTopRight', fontSize: 10, fill: 'var(--color-primary)' }} />
            {c.startDay < 0 && <ReferenceLine x={fmtDay(0)} stroke="var(--color-ink-3)" label={{ value: 'today', position: 'insideTopLeft', fontSize: 10, fill: 'var(--color-ink-3)' }} />}
            <Area type="monotone" dataKey="spend" stroke={over ? 'var(--color-loss)' : 'var(--color-brass)'} strokeWidth={2} fill="url(#burn)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-y-1.5 text-[12px]">
        <dt className="text-ink-3">Seller cost per use</dt><dd className="num text-right text-ink">{inrShort(per)}</dd>
        <dt className="text-ink-3">Expected uses</dt><dd className="num text-right text-ink">{Math.round(b.redemptions).toLocaleString('en-IN')}</dd>
        <dt className="text-ink-3">Projected spend</dt><dd className={cn('num text-right', over ? 'text-loss' : 'text-ink')}>{inrShort(b.projected)}</dd>
      </dl>
      {over
        ? <div className="mt-3 flex gap-2 rounded-xl bg-loss-soft p-2.5 text-[12px] text-loss"><AlertTriangle size={14} className="mt-px shrink-0" /> Budget runs out on {fmtDay(b.exhaustDay!)}, {c.endDay - b.exhaustDay!} days before the campaign ends. Cap the discount, limit redemptions or raise the budget.</div>
        : <div className="mt-3 rounded-xl bg-gain-soft p-2.5 text-[12px] text-gain">On track: {inrShort(c.budget - b.projected)} of budget left at the end.</div>}
    </Card>
  )
}

function Conflicts({ c, all }: { c: Campaign; all: Campaign[] }) {
  const others = all.filter((o) => o.id !== c.id && (o.status === 'live' || o.status === 'scheduled') && (o.channel === 'all' || c.channel === 'all' || o.channel === c.channel))
  const rows = others.map((o) => {
    const first = o.priority < c.priority || (o.priority === c.priority && o.id < c.id)
    let kind: 'stacks' | 'blocks' | 'blocked'
    if (c.stacking === 'always' || o.stacking === 'always') kind = 'stacks'
    else if (c.stacking === 'exclusive' || o.stacking === 'exclusive') kind = first ? 'blocked' : 'blocks'
    else kind = 'stacks'
    return { o, kind }
  }).sort((a, b) => ['blocked', 'blocks', 'stacks'].indexOf(a.kind) - ['blocked', 'blocks', 'stacks'].indexOf(b.kind))
  const icon = { stacks: <Layers size={13} className="text-gain" />, blocks: <Ban size={13} className="text-brass" />, blocked: <Ban size={13} className="text-loss" /> }
  const text = { stacks: 'combines with', blocks: 'blocks', blocked: 'is blocked by' }
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5"><Link2 size={13} className="text-ink-3" /><Eyebrow>When both qualify, this offer…</Eyebrow></div>
      {rows.length === 0 ? <div className="mt-2 text-[12.5px] text-ink-3">No other live offers on this channel.</div> : (
        <ul className="mt-2 space-y-1.5">
          {rows.slice(0, 7).map(({ o, kind }) => (
            <li key={o.id} className="flex items-start gap-2 text-[12.5px]">
              <span className="mt-0.5">{icon[kind]}</span>
              <span className="text-ink-2"><span className="text-ink-3">{text[kind]}</span> {o.name} <span className="num text-[11px] text-ink-3">(#{o.priority})</span></span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
