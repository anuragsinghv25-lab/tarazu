import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BadgePercent, Clock, ShoppingBag, Ticket } from 'lucide-react'
import { Card, PageHeader, Segmented } from '@/components/ui'
import { Select } from '@/components/ui/form'
import { Spot } from '@/components/Spot'
import { SellerLogo, SELLER_BRANDS } from '@/brand/sellers'
import type { Campaign, Reward, Sku } from '@/engine/types'
import { describeReward, evaluateCart } from '@/engine/cart'
import { qualifyingCart, targetSkus } from '@/engine/launch'
import { useLaunch } from '@/state/launch'
import { generateCodes } from '@/engine/launch'
import { fmtDay } from '@/lib/dates'
import { cn } from '@/lib/cn'
import { useLaunchCtx } from './shared'

type View = 'listing' | 'product' | 'cart' | 'checkout' | 'wallet'
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

/** The short badge a shopper sees on a product tile. */
export function badge(r: Reward): string {
  switch (r.kind) {
    case 'pctOff': return `${Math.round(r.value * 100)}% off`
    case 'amountOff': return `₹${r.value} off`
    case 'tiered': return `Up to ₹${Math.max(...r.tiers.map((t) => t.off))} off`
    case 'bxgy': return `Buy ${r.buy} get ${r.get}${r.getPct < 1 ? ` at ${Math.round(r.getPct * 100)}% off` : ' free'}`
    case 'multiBuy': return `${r.qty} for ₹${r.price}`
    case 'freeItem': return 'Free gift'
    case 'freeShipping': return 'Free delivery'
    case 'bundlePrice': return `Bundle ₹${r.price}`
    case 'points': return `${r.multiplier}× points`
    case 'cashback': return `${Math.round(r.pct * 100)}% cashback`
  }
}

function offerPrice(s: Sku, r: Reward) {
  if (r.kind === 'pctOff' && r.target !== 'cart') return Math.round(s.price * (1 - r.value))
  return s.price
}

/** How an offer appears to a shopper, in the seller's own brand, from listing to checkout. */
export function StorefrontPreview({ campaign, view, onView, compact }: { campaign: Campaign; view: View; onView: (v: View) => void; compact?: boolean }) {
  const { seller, campaigns, ctx } = useLaunchCtx()
  const b = SELLER_BRANDS[seller.id]
  const batch = useLaunch((s) => s.codes[campaign.id])
  const targets = targetSkus(campaign, seller.skus)
  const shown = (targets.length ? targets : [...seller.skus].sort((a, z) => z.price - a.price).slice(4)).slice(0, 3)
  const cart = useMemo(() => qualifyingCart(campaign, seller), [campaign, seller])
  const others = campaigns.filter((k) => k.id !== campaign.id)
  const res = useMemo(() => evaluateCart(cart, [...others, campaign], { ...ctx(cart), preview: campaign.id }), [cart, others, campaign, ctx])
  const mine = res.evals.find((e) => e.campaign.id === campaign.id)
  const small = useMemo(() => ({ ...cart, lines: cart.lines.slice(0, 1).map((l) => ({ ...l, qty: 1 })) }), [cart])
  const smallRes = useMemo(() => evaluateCart(small, [...others, campaign], { ...ctx(small), preview: campaign.id }), [small, others, campaign, ctx])
  const nudge = smallRes.evals.find((e) => e.campaign.id === campaign.id)?.nudge
  const days = campaign.endDay - Math.max(0, campaign.startDay)
  const ends = campaign.launch?.countdown && days <= 7 ? `Ends in ${days}d 04h` : `Ends ${fmtDay(campaign.endDay)}`
  const mode = campaign.launch?.codes?.mode ?? (campaign.conditions.some((k) => k.kind === 'code') ? 'public' : 'auto')
  const code = mode === 'bulk' ? (batch ? generateCodes(batch.prefix, 1, batch.seed)[0] : 'YOUR-UNIQUE-CODE') : campaign.conditions.find((k) => k.kind === 'code')?.value
  const tag = badge(campaign.reward)
  const views: { value: View; label: string }[] = [{ value: 'listing', label: 'Listing' }, { value: 'product', label: 'Product' }, { value: 'cart', label: 'Cart' }, { value: 'checkout', label: 'Checkout' }, { value: 'wallet', label: 'Coupons' }]

  return (
    <div>
      <Segmented<View> size="sm" value={view} onChange={onView} options={views} className="mb-3 max-w-full overflow-x-auto" />
      <div className="overflow-hidden rounded-2xl border border-rule bg-white text-[#1f2937] shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5" style={{ borderColor: `${b.color.primary}22`, background: b.color.tint }}>
          <SellerLogo id={seller.id} size="sm" onLight />
          <ShoppingBag size={16} style={{ color: b.color.ink }} />
        </div>
        <div className={cn('p-4', compact ? 'min-h-[260px]' : 'min-h-[320px]')}>
          {view === 'listing' && (
            <div className="grid grid-cols-3 gap-2.5">
              {shown.map((s) => (
                <div key={s.id} className="overflow-hidden rounded-xl border border-[#e5e7eb]">
                  <div className="relative grid aspect-square place-items-center" style={{ background: b.color.soft }}>
                    <span className="text-center text-[10px] font-medium opacity-60" style={{ color: b.color.ink }}>{s.category}</span>
                    <span className="absolute top-1.5 left-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ background: b.color.primary }}>{tag}</span>
                  </div>
                  <div className="p-2">
                    <div className="line-clamp-2 text-[11.5px] leading-tight">{s.name}</div>
                    <div className="mt-1 flex items-baseline gap-1"><span className="text-[12.5px] font-semibold">{inr(offerPrice(s, campaign.reward))}</span>{offerPrice(s, campaign.reward) < s.price && <s className="text-[10.5px] text-[#9ca3af]">{inr(s.price)}</s>}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-[9.5px] text-[#6b7280]"><Clock size={9} /> {ends}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {view === 'product' && shown[0] && (
            <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
              <div className="grid aspect-square place-items-center rounded-xl text-[11px] opacity-70" style={{ background: b.color.soft, color: b.color.ink }}>{shown[0].category}</div>
              <div>
                <div className="text-[15px] font-semibold">{shown[0].name}</div>
                <div className="mt-1 flex items-baseline gap-2"><span className="text-[20px] font-bold">{inr(offerPrice(shown[0], campaign.reward))}</span>{offerPrice(shown[0], campaign.reward) < shown[0].price && <><s className="text-[13px] text-[#9ca3af]">MRP {inr(shown[0].price)}</s><span className="text-[12px] font-semibold text-[#15803d]">{Math.round((1 - offerPrice(shown[0], campaign.reward) / shown[0].price) * 100)}% off</span></>}</div>
                <div className="text-[10.5px] text-[#6b7280]">Inclusive of all taxes</div>
                <div className="mt-3 rounded-lg border border-[#e5e7eb] p-2.5">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold"><BadgePercent size={13} style={{ color: b.color.primary }} /> Offers for you</div>
                  <ul className="space-y-1.5 text-[11.5px]">
                    <li><b>{describeReward(campaign.reward, seller.skus)}</b>{code ? <> · code <span className="rounded border border-dashed px-1 font-mono">{code}</span></> : ' · applied automatically'}. {ends}.{campaign.perCustomer || campaign.maxDiscount ? ' T&C apply.' : ''}</li>
                    {others.filter((k) => k.status === 'live' && k.conditions.some((x) => x.kind === 'payment')).slice(0, 2).map((k) => <li key={k.id} className="text-[#4b5563]">{k.name}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}
          {view === 'cart' && (
            <div>
              {nudge && <div className="mb-3 rounded-lg px-3 py-2 text-[12px] font-medium" style={{ background: b.color.soft, color: b.color.ink }}>{nudge}</div>}
              <ul className="divide-y divide-[#f3f4f6]">
                {res.lines.map((l) => <li key={l.sku.id} className="flex justify-between py-2 text-[12.5px]"><span>{l.qty} × {l.sku.name}</span><span>{inr(l.gross)}</span></li>)}
                {res.freeItems.map((f) => <li key={f.sku.id} className="flex justify-between py-2 text-[12.5px] text-[#15803d]"><span>1 × {f.sku.name} (free)</span><span>₹0</span></li>)}
              </ul>
              <div className="mt-2 flex justify-between border-t pt-2 text-[13px] font-semibold"><span>Subtotal</span><span>{inr(res.subtotal)}</span></div>
              {mine && mine.stopAt === null ? <div className="mt-2 text-[12px] font-medium text-[#15803d]">{campaign.name} applied: −{inr(mine.discount)}</div> : <div className="mt-2 text-[12px] text-[#b91c1c]">{mine?.reason ?? 'Offer not applied'}</div>}
            </div>
          )}
          {view === 'checkout' && (
            <dl className="space-y-1.5 text-[12.5px]">
              <div className="flex justify-between"><dt>Items ({res.units})</dt><dd>{inr(res.subtotal)}</dd></div>
              {res.evals.filter((e) => e.stopAt === null && e.discount > 0).map((e) => <div key={e.campaign.id} className="flex justify-between text-[#15803d]"><dt>{e.campaign.name}{e.partnerCost > 0 ? ' (partner-funded)' : ''}</dt><dd>−{inr(e.discount)}</dd></div>)}
              <div className="flex justify-between"><dt>Delivery</dt><dd>{res.shipping ? inr(res.shipping) : 'Free'}</dd></div>
              <div className="flex justify-between border-t pt-2 text-[15px] font-bold"><dt>To pay</dt><dd>{inr(res.total)}</dd></div>
              {res.saved > 0 && <div className="rounded-md bg-[#f0fdf4] px-2 py-1 text-center text-[12px] font-medium text-[#15803d]">You save {inr(res.saved)} on this order</div>}
              {res.cashback > 0 && <div className="text-center text-[11.5px] text-[#4b5563]">+ {inr(res.cashback)} cashback after delivery</div>}
            </dl>
          )}
          {view === 'wallet' && (
            <ul className="space-y-2">
              {[campaign, ...others.filter((k) => k.status === 'live' && k.conditions.some((x) => x.kind === 'code'))].slice(0, 4).map((k) => {
                const kc = k.id === campaign.id ? code : k.conditions.find((x) => x.kind === 'code')?.value
                const ev = res.evals.find((e) => e.campaign.id === k.id)
                return (
                  <li key={k.id} className="flex items-center gap-3 rounded-xl border border-dashed p-3" style={{ borderColor: k.id === campaign.id ? b.color.primary : '#e5e7eb' }}>
                    <Ticket size={18} style={{ color: b.color.primary }} />
                    <div className="min-w-0 flex-1"><div className="font-mono text-[12.5px] font-semibold">{kc ?? 'Auto-applied'}</div><div className="truncate text-[11px] text-[#6b7280]">{describeReward(k.reward, seller.skus)}</div></div>
                    <span className={cn('text-[11px] font-medium', ev?.stopAt === null ? 'text-[#15803d]' : 'text-[#9ca3af]')}>{ev?.stopAt === null ? 'Best: applied' : ev?.reason ?? ''}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-ink-3">A mock storefront in the seller's brand, priced by the same engine as the Cart Sandbox. Marketplace pages will look like the marketplace.</p>
    </div>
  )
}

export function Storefront() {
  const { campaigns } = useLaunchCtx()
  const [params, setParams] = useSearchParams()
  const list = campaigns.filter((k) => k.status !== 'archived')
  const id = list.some((k) => k.id === params.get('id')) ? params.get('id')! : list[0]?.id
  const camp = list.find((k) => k.id === id)
  const [view, setView] = useState<View>('listing')
  return (
    <div>
      <PageHeader eyebrow="Shopper preview" title={<>See the offer<br /><span className="text-ink-3">the way a shopper will.</span></>}>
        Listing badge, product page, cart nudge, checkout breakdown and coupon wallet, for any campaign, before it goes live. Built from the
        campaign's own rules and priced by the engine, so what you see here is what the cart will do.
      </PageHeader>
      {camp ? (
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <Card className="h-fit p-4">
            <label className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-ink-3 uppercase">Campaign</label>
            <Select label="Campaign" value={camp.id} onChange={(v) => setParams({ id: v }, { replace: true })} options={list.map((k) => ({ value: k.id, label: k.name }))} className="w-full" />
            <p className="mt-3 text-[12px] leading-snug text-ink-3">Drafts and scheduled offers preview as if they were live today.</p>
          </Card>
          <Spot id="storefront"><StorefrontPreview campaign={camp} view={view} onView={setView} /></Spot>
        </div>
      ) : <Card className="p-8 text-center text-ink-3">No campaigns yet.</Card>}
    </div>
  )
}
