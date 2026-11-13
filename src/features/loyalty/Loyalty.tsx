import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { Crown, Lock, ShieldAlert, Users, UserRoundCheck, ArrowRight, Store, MessageCircle } from 'lucide-react'
import { Card, Chip, Eyebrow, Money, PageHeader, Slider, Switch, Count } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { useStore } from '@/state/store'
import { useSeller } from '@/state/hooks'
import { liabilityForecast, programEconomics, winBack } from '@/engine/loyalty'
import { newCampaign } from '@/features/campaigns/templates'
import { SELLER_BY_ID } from '@/data/sellers'
import type { LoyaltyData } from '@/data/sellers/types'
import { dateIn } from '@/lib/dates'
import { inr, inrAxis, inrShort, pct, units } from '@/lib/format'
import { cn } from '@/lib/cn'

export function Loyalty() {
  const seller = useSeller()
  if (!seller.loyalty) return <Locked />
  return <Program key={seller.id} L={seller.loyalty} />
}

function Locked() {
  const seller = useSeller()
  const { setSeller } = useStore()
  const meera = SELLER_BY_ID.meera
  const brand = seller.id === 'anaya'
  return (
    <div>
      <PageHeader eyebrow="Loyalty" title={<>Loyalty needs a customer<br /><span className="text-ink-3">you can recognise.</span></>}>
        {brand
          ? `${seller.name} sells through distributors and shops, so she never sees who buys her sev. Consumer loyalty would need a direct channel, such as a QR code on the pack.`
          : `${seller.name} sells only on marketplaces. The marketplace owns the customer: their name, number and order history. Without that, there's nobody to give points to, refer, or win back.`}
      </PageHeader>
      <Spot id="loyalty-locked">
        <Card className="relative overflow-hidden p-6 md:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background:repeating-linear-gradient(135deg,#0b3d2e_0_2px,transparent_2px_14px)]" />
          <div className="relative grid gap-6 md:grid-cols-[auto_1fr]">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-brass-2"><Lock size={26} /></div>
            <div>
              <h2 className="display text-[26px] text-ink">The opportunity Tarazu shows {seller.name}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {(brand ? [
                  { icon: Store, t: 'QR on every pack', b: 'Scan to register for a free chai sample: the first step to knowing your buyers.' },
                  { icon: MessageCircle, t: 'WhatsApp recipe club', b: 'Monthly recipes and early access to festive hampers; points per scanned pack.' },
                  { icon: Users, t: 'Kirana retailer loyalty', b: 'Points for shops that hit display and stock targets: trade loyalty, not consumer loyalty.' },
                ] : [
                  { icon: MessageCircle, t: 'WhatsApp catalogue', b: 'A packing-slip card invites marketplace buyers to a WhatsApp group with first access to new prints.' },
                  { icon: Store, t: 'Own website for repeat buyers', b: 'Repeat buyers order direct at the same price, saving the 12–16% commission.' },
                  { icon: Crown, t: 'Then: points and referrals', b: `With ${units(5000)} known buyers, a programme like Meera's becomes possible.` },
                ]).map((x) => (
                  <div key={x.t} className="rounded-2xl border border-rule bg-card p-4">
                    <x.icon size={18} className="text-brass" />
                    <div className="mt-2 text-[14px] font-medium text-ink">{x.t}</div>
                    <p className="mt-1 text-[12.5px] leading-snug text-ink-3">{x.b}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setSeller('meera')} className="mt-6 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-paper">See a live programme as {meera.name} <ArrowRight size={14} /></button>
            </div>
          </div>
        </Card>
      </Spot>
    </div>
  )
}

function Program({ L }: { L: LoyaltyData }) {
  const seller = useSeller()
  const { saveCampaign } = useStore()
  const nav = useNavigate()
  const [earn, setEarn] = useState(L.earnPct)
  const [event, setEvent] = useState(false)
  const [offer, setOffer] = useState(0.2)
  const [blocked, setBlocked] = useState<string[]>([])
  const eco = useMemo(() => programEconomics(L, earn, event), [L, earn, event])
  const base = useMemo(() => programEconomics(L, L.earnPct, false), [L])
  const fc = useMemo(() => liabilityForecast(L, earn, event).map((x) => ({ ...x, label: x.m === 0 ? 'now' : dateIn(x.m * 30).toLocaleDateString('en-IN', { month: 'short' }) })), [L, earn, event])
  const wb = useMemo(() => winBack(L, offer), [L, offer])
  const ref = L.referral
  const refCac = ref.give + ref.get
  const funnel = [{ k: 'Invites sent', v: ref.invites }, { k: 'Opened the link', v: ref.clicks }, { k: 'Placed a first order', v: ref.firstOrders }]

  const makeWinBack = () => {
    const camp = newCampaign(seller, 'Personalised offer', { name: `Win-back: ${pct(offer)} for lapsed buyers`, channel: 'website', segment: 'lapsed', conditions: [{ kind: 'cartMin', value: 499 }], reward: { kind: 'pctOff', value: offer, target: 'cart' }, maxDiscount: Math.round(L.aov * offer / 50) * 50, perCustomer: 1, stacking: 'exclusive', priority: 2, budget: Math.round(wb.costOfDiscount / 1000) * 1000, dailyRedemptions: Math.max(1, Math.round(wb.back / 30)) })
    saveCampaign(camp)
    toast('Win-back drafted as a campaign', { description: camp.name })
    nav(`/campaigns?id=${camp.id}`)
  }

  return (
    <div>
      <PageHeader eyebrow={`Loyalty · ${L.program}`} title={<>Keep the buyers<br /><span className="text-ink-3">you already paid to win.</span></>}>
        Points, referrals and win-back offers only work on {seller.name}'s own channel, where she knows who the customer is. Each one
        has a cost that sits on the books until it's used: Tarazu weighs it against the repeat orders it brings.
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Users size={15} />} label="Members" value={<Count value={L.members} />} sub={`${pct(L.activeShare)} bought in the last 6 months`} />
        <Stat icon={<UserRoundCheck size={15} />} label="Orders a year" value={<span className="num">{L.ordersMember} <span className="text-[14px] text-ink-3">vs {L.ordersNonMember}</span></span>} sub="members vs non-members" />
        <Stat icon={<Crown size={15} />} label="Points outstanding" value={<Count value={L.pointsOutstanding} />} sub={`1 point = ₹1 · ${pct(L.breakage)} never redeemed`} />
        <Stat icon={<ShieldAlert size={15} />} label="Liability on the books" value={<Money value={L.pointsOutstanding * (1 - L.breakage)} />} sub="what unredeemed points will cost" tone="loss" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <Spot id="loyalty-economics">
          <Card className="p-5">
            <Eyebrow>Points programme</Eyebrow>
            <div className="mt-3 grid gap-5 md:grid-cols-[1fr_1.1fr]">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[12.5px]"><span className="text-ink-2">Points earned per ₹100</span><span className="num font-semibold text-ink">{Math.round(earn * 100)} pts</span></div>
                  <Slider label="Earn rate" min={0.01} max={0.1} step={0.005} value={earn} onChange={setEarn} className="mt-1.5" />
                </div>
                <label className="flex items-center justify-between gap-3 text-[12.5px] text-ink-2">2× points during {seller.event} <Switch checked={event} onChange={setEvent} label="Event multiplier" /></label>
                <dl className="grid grid-cols-2 gap-y-2 border-t border-dashed border-rule pt-3 text-[12.5px]">
                  <dt className="text-ink-3">Yearly cost</dt><dd className="num text-right text-loss">{inrShort(eco.cost)}</dd>
                  <dt className="text-ink-3">Extra margin from repeat orders</dt><dd className="num text-right text-gain">{inrShort(eco.incMargin)}</dd>
                  <dt className="text-ink-3">Member orders a year</dt><dd className="num text-right text-ink">{eco.ordersMember.toFixed(1)}</dd>
                </dl>
                <div className="rounded-xl bg-paper-2/70 p-3">
                  <div className="text-[11.5px] text-ink-3">Programme return</div>
                  <div className="flex items-baseline gap-2"><Money value={eco.net} signed className={cn('text-[26px] font-semibold', eco.net >= 0 ? 'text-gain' : 'text-loss')} /><span className="num text-[13px] text-ink-3">{eco.roi >= 0 ? '+' : ''}{Math.round(eco.roi * 100)}% ROI</span></div>
                  {Math.abs(eco.net - base.net) > 1000 && <div className={cn('num text-[11.5px]', eco.net > base.net ? 'text-gain' : 'text-loss')}>{eco.net > base.net ? '+' : ''}{inrShort(eco.net - base.net)} vs today's {Math.round(L.earnPct * 100)} pts setting</div>}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-ink-3">Points liability, next 6 months</div>
                <div className="mt-1 h-[210px]">
                  <ResponsiveContainer>
                    <AreaChart data={fc} margin={{ top: 8, right: 4, bottom: 0, left: -6 }}>
                      <defs><linearGradient id="liab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c2421c" stopOpacity={0.28} /><stop offset="1" stopColor="#c2421c" stopOpacity={0.02} /></linearGradient></defs>
                      <CartesianGrid vertical={false} stroke="#e2e8e4" />
                      <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: '#7a8580' }} axisLine={{ stroke: '#cbd5d1' }} tickLine={false} />
                      <YAxis tickFormatter={inrAxis} tick={{ fontSize: 10.5, fill: '#7a8580' }} axisLine={false} tickLine={false} width={48} />
                      <Tooltip contentStyle={{ background: '#fffcf6', border: '1px solid #cbd5d1', borderRadius: 10, fontSize: 12 }} formatter={(v) => [inrShort(Number(v)), 'Liability']} />
                      <Area dataKey="liability" stroke="#c2421c" strokeWidth={2} fill="url(#liab)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-[12px] leading-snug text-ink-3">Every point earned is money owed until it's redeemed or expires. A richer earn rate grows repeat orders, but with diminishing returns, and the liability keeps climbing.</p>
              </div>
            </div>
          </Card>
        </Spot>

        <Spot id="winback">
          <Card className="p-5">
            <Eyebrow>Win-back · {units(L.lapsed)} buyers lapsed 90+ days</Eyebrow>
            <div className="mt-3 flex justify-between text-[12.5px]"><span className="text-ink-2">Comeback offer</span><span className="num font-semibold text-ink">{pct(offer)} off one order</span></div>
            <Slider label="Win-back offer" min={0.05} max={0.4} step={0.01} value={offer} onChange={setOffer} className="mt-1.5" />
            <div className="mt-5 flex items-end gap-4">
              <div className="relative h-24 flex-1 overflow-hidden rounded-xl bg-paper-2">
                <motion.div className="absolute inset-x-0 bottom-0 bg-gain/80" animate={{ height: `${wb.rate * 100 * 2}%` }} transition={{ type: 'spring', stiffness: 100, damping: 18 }} />
                <div className="relative grid h-full place-items-center"><span className="num text-[22px] font-semibold text-ink">{pct(wb.rate)}</span></div>
              </div>
              <div className="flex-[1.4] space-y-1.5 text-[12.5px]">
                <div className="flex justify-between"><span className="text-ink-3">Expected to return</span><span className="num text-ink">{units(wb.back)}</span></div>
                <div className="flex justify-between"><span className="text-ink-3">Discount cost</span><span className="num text-loss">{inrShort(wb.costOfDiscount)}</span></div>
                <div className="flex justify-between"><span className="text-ink-3">Value over 12 months</span><span className="num font-semibold text-gain">{inrShort(wb.value)}</span></div>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-snug text-ink-3">Returns flatten after about 20%: deeper offers mostly pay people who were coming back anyway.</p>
            <button onClick={makeWinBack} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2 text-[13px] font-medium text-paper">Draft this win-back campaign <ArrowRight size={14} /></button>
          </Card>
        </Spot>
      </div>

      <Spot id="referral" className="mt-5">
        <Card className="p-5">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div>
              <Eyebrow>Referral · give {inr(ref.give)}, get {inr(ref.get)}</Eyebrow>
              <div className="mt-4 space-y-2.5">
                {funnel.map((f, i) => (
                  <div key={f.k}>
                    <div className="flex justify-between text-[12.5px]"><span className="text-ink-2">{f.k}</span><span className="num text-ink">{units(f.v)}{i > 0 && <span className="text-ink-3"> · {pct(f.v / funnel[i - 1].v)}</span>}</span></div>
                    <motion.div className="mt-1 h-3 rounded-full bg-brass" initial={{ width: 0 }} animate={{ width: `${(f.v / funnel[0].v) * 100}%` }} transition={{ delay: i * 0.12 }} style={{ opacity: 1 - i * 0.2 }} />
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gain-soft p-3"><div className="text-[11px] text-gain">Cost per new buyer, referral</div><div className="num text-[20px] font-semibold text-gain">{inr(refCac)}</div></div>
                <div className="rounded-xl bg-paper-2 p-3"><div className="text-[11px] text-ink-3">Cost per new buyer, paid ads</div><div className="num text-[20px] font-semibold text-ink">{inr(ref.paidCac)}</div></div>
              </div>
              <p className="mt-3 text-[12.5px] text-ink-2">{ref.firstOrders} referred buyers cost {inrShort(refCac * ref.firstOrders)}; buying them with ads would have cost {inrShort(ref.paidCac * ref.firstOrders)}.</p>
            </div>
            <div>
              <Eyebrow>Self-referral flags</Eyebrow>
              <ul className="mt-3 space-y-2">
                {L.fraud.map((f) => {
                  const off = blocked.includes(f.id)
                  return (
                    <li key={f.id} className={cn('flex items-center gap-3 rounded-xl border p-3 transition-opacity', off ? 'border-rule bg-paper-2/50 opacity-60' : 'border-loss/25 bg-loss-soft/50')}>
                      <ShieldAlert size={16} className={off ? 'text-ink-3' : 'text-loss'} />
                      <div className="min-w-0 flex-1">
                        <div className="num truncate text-[12.5px] text-ink">{f.who}</div>
                        <div className="text-[11.5px] text-ink-3">{f.signal} · {inr(f.amount)} in rewards</div>
                      </div>
                      {off ? <Chip>blocked</Chip> : <button onClick={() => { setBlocked((b) => [...b, f.id]); toast('Rewards held', { description: `${inr(f.amount)} kept from a self-referral ring.` }) }} className="rounded-full bg-loss px-3 py-1 text-[12px] font-medium text-card">Hold rewards</button>}
                    </li>
                  )
                })}
              </ul>
              <p className="mt-3 text-[12px] leading-snug text-ink-3">Flags come from matching device, address and payment handle across "new" accounts. Rewards are held, not cancelled, until someone checks.</p>
            </div>
          </div>
        </Card>
      </Spot>
    </div>
  )
}

function Stat({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub: string; tone?: 'loss' }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-ink-3">{icon}<Eyebrow>{label}</Eyebrow></div>
      <div className={cn('mt-1.5 text-[26px] leading-none font-semibold', tone === 'loss' ? 'text-loss' : 'text-ink')}>{value}</div>
      <div className="mt-1.5 text-[11.5px] text-ink-3">{sub}</div>
    </Card>
  )
}
