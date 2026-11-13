import { useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { toast } from 'sonner'
import { Check, X, Minus, Plus, ShoppingCart, AlertTriangle, Wrench, FlaskConical, Sparkles, Gift, Truck, Coins, Trash2, GripVertical } from 'lucide-react'
import { Card, Chip, Eyebrow, PageHeader, Segmented } from '@/components/ui'
import { Select, TextInput } from '@/components/ui/form'
import { Spot } from '@/components/Spot'
import { useStore } from '@/state/store'
import { useCampaigns, useControls, useSeller } from '@/state/hooks'
import { evaluateCart, describeReward, GATES, PAYMENTS, type CartCtx, type Eval } from '@/engine/cart'
import { feeFor } from '@/engine/engine'
import type { Cart, Segment, Sku } from '@/engine/types'
import type { SellerDef } from '@/data/sellers'
import { skuOf } from '@/data/sellers'
import { inr, inrShort, pct } from '@/lib/format'
import { cn } from '@/lib/cn'
import { SellerLogo } from '@/brand/sellers'
import { MAX_ORDER, PRESETS } from './presets'

export function CartSandbox() {
  const seller = useSeller()
  return <SandboxInner key={seller.id} seller={seller} />
}

function SandboxInner({ seller }: { seller: SellerDef }) {
  const campaigns = useCampaigns()
  const c = useControls()
  const { saveCampaign, flash } = useStore()
  const [params, setParams] = useSearchParams()
  const preview = params.get('preview') ?? undefined
  const previewC = campaigns.find((x) => x.id === preview)
  const presets = PRESETS[seller.id]
  const start: Cart = { segment: 'regular', code: '', payment: 'upi', channel: Object.keys(seller.market.channels)[0], ...presets[0].cart }
  const [cart, setCart] = useState<Cart>(previewC && previewC.channel !== 'all' ? { ...start, channel: previewC.channel } : start)
  const [dragging, setDragging] = useState<Sku | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor))

  const ctx: CartCtx = useMemo(() => {
    const f = feeFor(cart.channel, c)
    const own = cart.channel === 'website'
    const units = cart.lines.reduce((a, l) => a + l.qty, 0)
    return {
      skus: seller.skus, commission: f.commission, payment: f.payment,
      shippingFee: own ? seller.shippingFee : 0, courier: own ? seller.courierCost : f.shipSubsidy * units,
      marginFloor: c.marginFloor, maxOrderDiscount: MAX_ORDER[seller.id], preview,
    }
  }, [cart.channel, cart.lines, c, seller, preview])
  const r = useMemo(() => evaluateCart(cart, campaigns, ctx), [cart, campaigns, ctx])

  const add = (id: string, n = 1) => setCart((x) => {
    const has = x.lines.find((l) => l.skuId === id)
    return { ...x, lines: has ? x.lines.map((l) => (l.skuId === id ? { ...l, qty: Math.max(0, l.qty + n) } : l)).filter((l) => l.qty > 0) : n > 0 ? [...x.lines, { skuId: id, qty: n }] : x.lines }
  })
  const onDragEnd = (e: DragEndEvent) => { setDragging(null); if (e.over?.id === 'cart') add(String(e.active.id)) }
  const codes = [...new Set(campaigns.flatMap((x) => x.conditions.filter((k) => k.kind === 'code').map((k) => k.value)))]
  const shelf = [...new Set([...seller.shelf, ...cart.lines.map((l) => l.skuId)])].map((id) => skuOf(seller, id)!).filter(Boolean)

  const applyFix = () => {
    const fix = r.leak?.fix
    if (!fix) return
    const target = campaigns.find((x) => x.id === fix.id)
    if (!target) return
    saveCampaign({ ...target, ...fix.patch })
    flash(['receipt', 'pipeline'])
    toast('Rule fixed', { description: `${fix.label}. The Campaign builder has the change too.` })
  }

  return (
    <div>
      <PageHeader eyebrow="Cart Sandbox" title={<>Drop a cart in.<br /><span className="text-ink-3">Watch every rule decide.</span></>}>
        This is the execution engine: each live campaign is checked in priority order through four gates, then the order is costed
        from the customer's side and from {seller.name}'s. Drag products onto the cart, or start from a preset.
      </PageHeader>

      {previewC && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-brass/40 bg-brass-soft px-4 py-2.5 text-[13px] text-[var(--color-brass-ink)]">
          <FlaskConical size={15} /> Testing <b className="font-semibold">{previewC.name}</b> as if it were live. Nothing changes for real customers.
          <button onClick={() => { params.delete('preview'); setParams(params) }} className="ml-auto text-[12px] underline">Stop testing</button>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11.5px] text-ink-3">Preset carts:</span>
        {presets.map((p) => (
          <button key={p.label} onClick={() => setCart({ ...start, ...p.cart })} className="rounded-full border border-rule bg-card px-3 py-1 text-[12px] text-ink-2 transition-colors hover:border-primary hover:text-ink">{p.label}</button>
        ))}
      </div>

      <DndContext sensors={sensors} onDragStart={(e) => setDragging(skuOf(seller, String(e.active.id)) ?? null)} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        <div className="grid gap-5 xl:grid-cols-[1fr_1fr_360px]">
          <Card className="p-4">
            <div className="flex items-baseline justify-between"><Eyebrow>Shelf</Eyebrow><span className="text-[11px] text-ink-3">drag onto the cart, or tap +</span></div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {shelf.map((s) => <ShelfItem key={s.id} sku={s} onAdd={() => add(s.id)} />)}
            </div>
          </Card>

          <div className="space-y-4">
            <CartDrop>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><ShoppingCart size={16} className="text-brass" /><Eyebrow>Cart · {r.units} items</Eyebrow></div>
                {cart.lines.length > 0 && <button onClick={() => setCart((x) => ({ ...x, lines: [] }))} className="flex items-center gap-1 text-[11.5px] text-ink-3 hover:text-loss"><Trash2 size={12} /> Empty</button>}
              </div>
              {cart.lines.length === 0 ? (
                <div className="mt-3 grid h-28 place-items-center rounded-xl border-2 border-dashed border-rule text-[13px] text-ink-3">Drop products here</div>
              ) : (
                <ul className="mt-2 divide-y divide-rule-2">
                  <AnimatePresence initial={false}>
                    {r.lines.map((l) => (
                      <motion.li key={l.sku.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] text-ink">{l.sku.name}</div>
                          <div className="num text-[11px] text-ink-3">₹{l.sku.price} · {l.sku.category}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => add(l.sku.id, -1)} className="grid h-6 w-6 place-items-center rounded-full border border-rule hover:border-primary" aria-label="Fewer"><Minus size={11} /></button>
                          <span className="num w-5 text-center text-[13px] font-semibold">{l.qty}</span>
                          <button onClick={() => add(l.sku.id, 1)} className="grid h-6 w-6 place-items-center rounded-full border border-rule hover:border-primary" aria-label="More"><Plus size={11} /></button>
                        </div>
                        <span className="num w-16 text-right text-[13px] text-ink">{inr(l.gross)}</span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </CartDrop>

            <Card className="space-y-3 p-4">
              <Eyebrow>Customer and checkout</Eyebrow>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-[74px] text-[12px] text-ink-3">Customer</span>
                <Segmented<Exclude<Segment, 'all'>> size="sm" value={cart.segment} onChange={(v) => setCart((x) => ({ ...x, segment: v }))}
                  options={(['new', 'regular', 'gold', 'lapsed'] as const).filter((k) => seller.ownChannel || k === 'new' || k === 'regular').map((k) => ({ value: k, label: { new: 'New', regular: 'Regular', gold: 'Gold', lapsed: 'Lapsed' }[k] }))} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-[74px] text-[12px] text-ink-3">Channel</span>
                <Select label="Channel" value={cart.channel} onChange={(v) => setCart((x) => ({ ...x, channel: v }))} options={Object.entries(seller.market.channels).map(([k, f]) => ({ value: k, label: f.label }))} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-[74px] text-[12px] text-ink-3">Payment</span>
                <Select label="Payment" value={cart.payment} onChange={(v) => setCart((x) => ({ ...x, payment: v }))} options={Object.entries(PAYMENTS).map(([k, l]) => ({ value: k, label: l }))} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-[74px] text-[12px] text-ink-3">Code</span>
                <TextInput label="Coupon code" mono value={cart.code} placeholder="none" onChange={(v) => setCart((x) => ({ ...x, code: v.toUpperCase().replace(/\s/g, '') }))} className="w-[130px]" />
                {codes.map((k) => <button key={k} onClick={() => setCart((x) => ({ ...x, code: x.code === k ? '' : k }))} className={cn('num rounded-full border px-2 py-0.5 text-[11px]', cart.code === k ? 'border-primary bg-primary text-paper' : 'border-dashed border-rule text-ink-3 hover:text-ink')}>{k}</button>)}
              </div>
            </Card>
          </div>

          <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <AnimatePresence>
              {r.leak && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <Spot id="leak">
                    <div className="rounded-2xl border border-loss/30 bg-loss-soft p-4">
                      <div className="flex items-center gap-2 text-[13px] font-semibold text-loss"><AlertTriangle size={15} /> Discount leakage{r.leak.amount > 1 ? `: ${inrShort(r.leak.amount)} on this order` : ''}</div>
                      <ul className="mt-1.5 space-y-1 text-[12.5px] leading-snug text-[var(--color-loss-ink)]">{r.leak.reasons.map((x) => <li key={x}>· {x}</li>)}</ul>
                      {r.leak.fix && <button onClick={applyFix} className="mt-3 flex items-center gap-1.5 rounded-full bg-loss px-3 py-1.5 text-[12px] font-medium text-card"><Wrench size={12} /> {r.leak.fix.label}</button>}
                    </div>
                  </Spot>
                </motion.div>
              )}
            </AnimatePresence>
            <Spot id="receipt"><Receipt r={r} seller={seller} channel={seller.market.channels[cart.channel]?.label ?? cart.channel} /></Spot>
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {dragging && <div className="w-[180px] rotate-[-3deg] rounded-xl border border-brass bg-card p-2.5 shadow-[var(--shadow-lift)]"><div className="text-[12px] font-medium text-ink">{dragging.name}</div><div className="num text-[11px] text-ink-3">₹{dragging.price}</div></div>}
        </DragOverlay>
      </DndContext>

      <Nudges evals={r.evals} />
      <Spot id="pipeline" className="mt-5"><Pipeline evals={r.evals} seller={seller} /></Spot>
    </div>
  )
}

function ShelfItem({ sku, onAdd }: { sku: Sku; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: sku.id })
  return (
    <div ref={setNodeRef} className={cn('group relative flex items-start gap-1.5 rounded-xl border border-rule bg-paper/60 p-2.5 transition-shadow hover:shadow-[var(--shadow-card)]', isDragging && 'opacity-40')}>
      <button {...listeners} {...attributes} className="mt-0.5 cursor-grab text-ink-3/60 hover:text-ink active:cursor-grabbing" aria-label={`Drag ${sku.name}`}><GripVertical size={14} /></button>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-[12px] leading-snug text-ink">{sku.name}</div>
        <div className="num mt-0.5 text-[11px] text-ink-3">₹{sku.price}</div>
      </div>
      <button onClick={onAdd} className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-paper opacity-80 transition-opacity hover:opacity-100" aria-label={`Add ${sku.name}`}><Plus size={12} /></button>
    </div>
  )
}

function CartDrop({ children }: { children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'cart' })
  return (
    <div ref={setNodeRef} className={cn('rounded-[var(--radius-card)] border bg-card p-4 shadow-[var(--shadow-card)] transition-all', isOver ? 'scale-[1.01] border-brass ring-4 ring-brass-2/25' : 'border-rule')}>
      {children}
    </div>
  )
}

function Receipt({ r, seller, channel }: { r: ReturnType<typeof evaluateCart>; seller: SellerDef; channel: string }) {
  const applied = r.evals.filter((e) => e.stopAt === null)
  const row = (k: ReactNode, v: ReactNode, cls = '') => <div className={cn('flex justify-between gap-3 text-[12.5px]', cls)}><span>{k}</span><span className="num shrink-0">{v}</span></div>
  return (
    <div className="relative rounded-t-2xl bg-card px-5 pt-5 pb-8 shadow-[var(--shadow-card)] [mask:radial-gradient(circle_7px_at_7px_100%,transparent_6.5px,#000_7px)_0_0/14px_100%_repeat-x]">
      <div className="text-center">
        <SellerLogo id={seller.id} size="sm" className="justify-center" />
        <div className="mt-1.5 text-[11px] tracking-wider text-ink-3 uppercase">Order preview · {channel}</div>
      </div>
      <div className="my-3 border-t border-dashed border-rule" />
      {r.lines.length === 0 ? <div className="py-4 text-center text-[12.5px] text-ink-3">Empty cart</div> : (
        <div className="space-y-1 text-ink-2">
          {r.lines.map((l) => row(<>{l.qty} × {l.sku.line}</>, inr(l.gross)))}
          {r.freeItems.map((f) => row(<span className="flex items-center gap-1 text-gain"><Gift size={11} /> Free {f.sku.line}</span>, <span className="text-gain"><s className="text-ink-3">{inr(f.value)}</s> ₹0</span>))}
          <div className="my-2 border-t border-dashed border-rule" />
          {row('Subtotal', inr(r.subtotal), 'text-ink')}
          <AnimatePresence initial={false}>
            {applied.filter((e) => e.discount > 0).map((e) => (
              <motion.div key={e.campaign.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                {row(<span className="line-clamp-1 text-gain">{e.campaign.name}{e.capped ? ' (capped)' : ''}</span>, <span className="text-gain">−{inr(e.discount)}</span>)}
              </motion.div>
            ))}
          </AnimatePresence>
          {row(<span className="flex items-center gap-1"><Truck size={11} /> Shipping</span>, r.shipping ? inr(r.shipping) : <span className="text-gain">Free</span>)}
          <div className="my-2 border-t border-primary" />
          {row(<span className="display text-[17px] text-ink">You pay</span>, <span className="text-[20px] font-semibold text-ink">{inr(r.total)}</span>)}
          {r.saved > 0 && <div className="mt-1 text-right text-[12px] font-medium text-gain">You saved {inr(r.saved)}</div>}
          {r.cashback > 0 && row(<span className="flex items-center gap-1"><Coins size={11} /> Cashback after delivery</span>, inr(r.cashback), 'text-ink-3')}
          {r.points > 0 && row(<span className="flex items-center gap-1"><Sparkles size={11} /> Points earned</span>, `${r.points} pts`, 'text-ink-3')}

          <div className="mt-4 rounded-xl bg-paper-2/70 p-3">
            <div className="mb-1.5 text-[10.5px] font-semibold tracking-[0.14em] text-ink-3 uppercase">{seller.name}'s side</div>
            {row(`Discounts ${seller.name} pays`, `−${inr(r.sellerFunded)}`, 'text-ink-2')}
            {r.partnerFunded > 0 && row('Paid by platform or partner', inr(r.partnerFunded), 'text-gain')}
            {row(seller.id === 'anaya' ? 'Trade margin' : 'Commission and payment fees', `−${inr(r.fees)}`)}
            {r.courier > 0 && row('Courier', `−${inr(r.courier)}`)}
            {row('Product cost', `−${inr(r.cogs)}`)}
            <div className="my-1.5 border-t border-dashed border-rule" />
            {row(<span className="font-medium text-ink">Contribution margin</span>, <span className={cn('font-semibold', r.marginPct < 0.2 ? 'text-loss' : 'text-gain')}>{inr(r.margin)} · {pct(r.marginPct)}</span>)}
          </div>
        </div>
      )}
    </div>
  )
}

function Nudges({ evals }: { evals: Eval[] }) {
  const n = evals.filter((e) => e.nudge).slice(0, 4)
  if (!n.length) return null
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <span className="text-[11.5px] text-ink-3">Nearly unlocked:</span>
      {n.map((e) => <span key={e.campaign.id} className="rounded-full border border-dashed border-brass/50 bg-card px-2.5 py-1 text-[12px] text-ink-2">{e.nudge}</span>)}
    </div>
  )
}

function Pipeline({ evals, seller }: { evals: Eval[]; seller: SellerDef }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-2 p-5 pb-3">
        <div>
          <Eyebrow>Promotion pipeline</Eyebrow>
          <h2 className="display mt-1 text-[22px] text-ink">Every campaign, in priority order, through four gates</h2>
        </div>
        <div className="flex items-center gap-3 text-[11.5px] text-ink-3">
          <span className="flex items-center gap-1"><Gate v={true} /> passed</span><span className="flex items-center gap-1"><Gate v={false} /> stopped here</span><span className="flex items-center gap-1"><Gate v={null} /> not reached</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-[12.5px]">
          <thead>
            <tr className="border-y border-rule bg-paper-2/50 text-left text-ink-3">
              <th className="w-10 px-4 py-2 font-medium">#</th>
              <th className="px-2 py-2 font-medium">Campaign</th>
              {GATES.map((g) => <th key={g.key} className="w-16 px-2 py-2 text-center font-medium">{g.label}</th>)}
              <th className="px-4 py-2 text-right font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {evals.map((e, i) => {
              const on = e.stopAt === null
              return (
                <motion.tr key={e.campaign.id} layout initial={false} animate={{ backgroundColor: on ? 'rgba(231,243,236,0.45)' : 'rgba(0,0,0,0)' }} className="border-b border-rule-2 last:border-0">
                  <td className="num px-4 py-2.5 text-ink-3">{e.campaign.priority}</td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('font-medium', on ? 'text-ink' : 'text-ink-2')}>{e.campaign.name}</span>
                      {e.campaign.stacking !== 'stackable' && <Chip tone={e.campaign.stacking === 'exclusive' ? 'ink' : 'quiet'} className="!py-0 text-[10px]">{e.campaign.stacking === 'exclusive' ? 'exclusive' : 'always'}</Chip>}
                    </div>
                    <div className="text-[11.5px] text-ink-3">{describeReward(e.campaign.reward, seller.skus)}</div>
                  </td>
                  {GATES.map((g) => <td key={g.key} className="px-2 py-2.5 text-center"><motion.span key={`${i}-${g.key}-${String(e.gates[g.key])}`} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-block"><Gate v={e.gates[g.key]} title={e.stopAt === g.key ? e.reason : undefined} /></motion.span></td>)}
                  <td className="px-4 py-2.5 text-right">
                    {on ? (
                      <span className="font-semibold text-gain">
                        {e.discount > 0 ? `−${inr(e.discount)}` : e.freeItem ? `Free ${e.freeItem.sku.line}` : e.freeShipping ? 'Free shipping' : e.cashback ? `${inr(e.cashback)} cashback` : e.points ? `${e.points} pts` : 'Applied'}
                        {e.capped && <span className="ml-1 text-[11px] font-normal text-ink-3">capped</span>}
                      </span>
                    ) : <span className="text-[11.5px] text-ink-3">{e.reason}</span>}
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function Gate({ v, title }: { v: boolean | null; title?: string }) {
  if (v === null) return <span className="inline-block h-1.5 w-1.5 rounded-full bg-rule" />
  return v
    ? <span className="grid h-5 w-5 place-items-center rounded-full bg-gain text-card"><Check size={12} strokeWidth={3} /></span>
    : <span title={title} className="grid h-5 w-5 place-items-center rounded-full bg-loss text-card"><X size={12} strokeWidth={3} /></span>
}
