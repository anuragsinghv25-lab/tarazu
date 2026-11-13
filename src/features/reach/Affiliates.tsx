import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Ban, Check, MessageCircle, ShieldAlert, Store } from 'lucide-react'
import { Card, Chip, Eyebrow, Money, PageHeader, Segmented, Slider, Switch } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { REACH } from '@/data/reach'
import { affiliateLedger, attribute, ATTRIBUTION, commissionPlan, referralSim, resellerVsSitewide, riskOf, SIGNAL_LABEL, type Attribution, type ReferralDesign } from '@/engine/reach'
import { useControls, useSeller } from '@/state/hooks'
import { inrShort, pct, units } from '@/lib/format'
import { cn } from '@/lib/cn'

type Tab = 'affiliates' | 'referrals' | 'resellers'
type Kind = 'creator' | 'content' | 'deal'
const KIND_TONE: Record<Kind, string> = { creator: 'bg-primary', content: 'bg-brass-2', deal: 'bg-warn' }
const KIND_LABEL: Record<Kind, string> = { creator: 'Creators', content: 'Blogs and review sites', deal: 'Coupon, cashback and deal channels' }
const kindOf = (p: string): Kind => (p.startsWith('Creator') ? 'creator' : /blog|review|guide/i.test(p) ? 'content' : 'deal')

export function Affiliates() {
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(() => { const t = params.get('tab'); return t === 'referrals' || t === 'resellers' ? t : 'affiliates' })
  return (
    <div>
      <PageHeader eyebrow="Affiliates and referrals" title={<>Pay people for the sales<br /><span className="text-ink-3">they actually cause.</span></>}>
        Affiliates, referring customers and resellers all earn a cut. The questions are the same as for a discount: who gets paid, for which
        sales, and how much of it would have happened anyway. Coupon sites and self-referrals take credit they didn't earn.
      </PageHeader>
      <Segmented<Tab> value={tab} onChange={(t) => { setTab(t); setParams(t === 'affiliates' ? {} : { tab: t }, { replace: true }) }} options={[{ value: 'affiliates', label: 'Affiliates' }, { value: 'referrals', label: 'Referral 2.0' }, { value: 'resellers', label: 'Resellers' }]} className="mb-5" />
      {tab === 'affiliates' && <AffiliateTab />}
      {tab === 'referrals' && <ReferralTab />}
      {tab === 'resellers' && <ResellerTab />}
    </div>
  )
}

function AffiliateTab() {
  const seller = useSeller(), c = useControls()
  const R = REACH[seller.id]
  const plan = useMemo(() => commissionPlan(seller, c), [seller, c])
  const [model, setModel] = useState<Attribution>('last')
  const [hold, setHold] = useState(14)
  const [blocked, setBlocked] = useState<string[]>([])
  const rate = 0.08
  const paid = attribute(R.journeys, model, rate)
  const max = Math.max(...(['last', 'first', 'linear'] as Attribution[]).flatMap((m) => attribute(R.journeys, m, rate).map((x) => x.paid)))
  const ledger = affiliateLedger(R.affiliates, seller, rate, hold)
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Spot id="affiliate-commission">
        <Card className="h-full p-5">
          <Eyebrow>Commission by category</Eyebrow>
          <h3 className="display mt-1 text-[19px] text-ink">Pay more where stock needs to move</h3>
          <ul className="mt-3 divide-y divide-rule-2">
            {plan.map((p) => (
              <li key={p.category} className="grid grid-cols-[1fr_auto] items-center gap-3 py-2 text-[12.5px]">
                <div><div className="text-ink">{p.category}</div><div className="text-[11.5px] text-ink-3">{p.why} · {pct(p.risky)} of products at risk · {pct(p.margin)} margin</div></div>
                <span className={cn('num text-[15px] font-semibold', p.rate >= 0.12 ? 'text-brass' : 'text-ink')}>{pct(p.rate)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </Spot>
      <Spot id="affiliate-attribution">
        <Card className="h-full p-5">
          <Eyebrow>Who gets the credit?</Eyebrow>
          <h3 className="display mt-1 text-[19px] text-ink">The same {R.journeys.length} orders, three ways to pay</h3>
          <Segmented<Attribution> size="sm" value={model} onChange={setModel} options={(Object.keys(ATTRIBUTION) as Attribution[]).map((m) => ({ value: m, label: ATTRIBUTION[m] }))} className="mt-3" />
          <ul className="mt-4 space-y-2">
            {paid.map((p) => (
              <li key={p.partner} className="grid grid-cols-[170px_1fr_60px] items-center gap-2 text-[12.5px]">
                <span className="truncate text-ink-2">{p.partner}</span>
                <span className="h-3 overflow-hidden rounded-full bg-paper-2"><motion.span layout className={cn('block h-full', KIND_TONE[kindOf(p.partner)])} animate={{ width: `${(p.paid / max) * 100}%` }} /></span>
                <span className="num text-right text-ink">{inrShort(p.paid)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-3 text-[11.5px] text-ink-3">{(['creator', 'content', 'deal'] as const).map((k) => <span key={k} className="flex items-center gap-1.5"><span className={cn('h-2 w-2 rounded-full', KIND_TONE[k])} />{KIND_LABEL[k]}</span>)}</div>
          <p className="mt-2 text-[12px] leading-snug text-ink-3">{model === 'last' ? 'Last click pays whoever was last before checkout, often a coupon or cashback site that the buyer visited only to find a code. Creators and content sites that started the journey get nothing.' : model === 'first' ? 'First click pays whoever introduced the buyer. Fairer to creators and content, but ignores the nudge that closed the sale.' : 'Shared equally splits each order across everyone who touched it. A reasonable default when data is thin.'}</p>
        </Card>
      </Spot>
      <Spot id="affiliate-ledger" className="xl:col-span-2">
        <Card className="p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><Eyebrow>This week's affiliate ledger</Eyebrow><h3 className="display mt-1 text-[19px] text-ink">Hold commission until returns are known</h3></div>
            <div className="w-[260px] text-[12.5px]"><div className="flex justify-between"><span className="text-ink-2">Hold for</span><span className="num font-semibold text-ink">{hold} days</span></div><Slider label="Hold days" min={0} max={30} step={1} value={hold} onChange={setHold} className="mt-1.5" /></div>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] text-[12.5px]">
              <thead className="text-left text-ink-3"><tr className="border-b border-rule"><th className="py-2 pr-2 font-medium">Partner</th><th className="px-2 py-2 text-right font-medium">Orders/wk</th><th className="px-2 py-2 text-right font-medium">Earned</th><th className="px-2 py-2 text-right font-medium">Self-referral</th><th className="px-2 py-2 text-right font-medium">Held</th><th className="px-2 py-2 text-right font-medium">Payable now</th><th className="py-2 pl-2" /></tr></thead>
              <tbody>
                {ledger.map((a) => {
                  const off = blocked.includes(a.id)
                  return (
                    <tr key={a.id} className={cn('border-b border-rule-2 align-top', off && 'opacity-45')}>
                      <td className="py-2 pr-2"><div className="text-ink">{a.name}</div><div className="text-[11px] text-ink-3">{a.kind}{a.flag ? ` · ${a.flag}` : ''}</div></td>
                      <td className="num px-2 py-2 text-right text-ink-2">{a.ordersPerWeek}</td>
                      <td className="num px-2 py-2 text-right text-ink">{inrShort(a.gross)}</td>
                      <td className={cn('num px-2 py-2 text-right', a.selfReferral > 0.12 ? 'text-loss' : 'text-ink-3')}>{pct(a.selfReferral)}</td>
                      <td className="num px-2 py-2 text-right text-ink-3">{inrShort(a.held)}</td>
                      <td className="num px-2 py-2 text-right font-semibold text-ink">{off ? '—' : inrShort(a.payable)}</td>
                      <td className="py-2 pl-2 text-right">{a.selfReferral > 0.12 || a.kind === 'Coupon site' ? <button onClick={() => { setBlocked((b) => (off ? b.filter((x) => x !== a.id) : [...b, a.id])); toast(off ? `${a.name} restored` : `${a.name} paused`) }} className="inline-flex items-center gap-1 text-[11.5px] text-ink-3 hover:text-loss"><Ban size={11} /> {off ? 'Restore' : 'Pause'}</button> : null}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11.5px] text-ink-3">Self-referral: affiliates (often cashback apps) earning commission on their own members' purchases that would have happened anyway. Held commission is released when the return window closes.</p>
        </Card>
      </Spot>
    </div>
  )
}

function ReferralTab() {
  const seller = useSeller()
  const R = REACH[seller.id]
  const base = Math.round(seller.avgOrder * 0.1 / 25) * 25
  const [d, setD] = useState<ReferralDesign>({ give: base, get: base, tiered: true, channel: 'whatsapp', releaseAfterReturns: true })
  const customers = seller.loyalty?.members ? seller.loyalty.members * 2 : 15000
  const r = referralSim(d, seller, customers)
  const [decided, setDecided] = useState<Record<string, 'approved' | 'blocked'>>({})
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <Spot id="referral-design">
        <Card className="p-5">
          <Eyebrow>Design the programme</Eyebrow>
          <h3 className="display mt-1 text-[19px] text-ink">Give {inrShort(d.give)}, get {inrShort(d.get)}</h3>
          <div className="mt-4 space-y-3 text-[12.5px]">
            <div><div className="flex justify-between"><span className="text-ink-2">Friend gets</span><span className="num font-semibold text-ink">{inrShort(d.give)}</span></div><Slider label="Friend gets" min={0} max={Math.round(seller.avgOrder * 0.3)} step={25} value={d.give} onChange={(give) => setD({ ...d, give })} className="mt-1.5" /></div>
            <div><div className="flex justify-between"><span className="text-ink-2">Referrer gets</span><span className="num font-semibold text-ink">{inrShort(d.get)}</span></div><Slider label="Referrer gets" min={0} max={Math.round(seller.avgOrder * 0.3)} step={25} value={d.get} onChange={(get) => setD({ ...d, get })} className="mt-1.5" /></div>
            <div className="flex flex-wrap items-center gap-2">Shared by <Segmented size="sm" value={d.channel} onChange={(channel) => setD({ ...d, channel })} options={[{ value: 'whatsapp', label: 'WhatsApp' }, { value: 'link', label: 'Link' }, { value: 'sms', label: 'SMS' }]} /></div>
            <label className="flex items-center justify-between text-ink-2">Third referral earns more (tiered)<Switch checked={d.tiered} onChange={(tiered) => setD({ ...d, tiered })} label="Tiered" /></label>
            <label className="flex items-center justify-between text-ink-2">Pay the referrer only after the return window<Switch checked={d.releaseAfterReturns} onChange={(releaseAfterReturns) => setD({ ...d, releaseAfterReturns })} label="Hold rewards" /></label>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-y-1 border-t border-dashed border-rule pt-3 text-[12.5px]">
            <dt className="text-ink-3">Customers who refer</dt><dd className="num text-right text-ink">{units(r.referrers)}</dd>
            <dt className="text-ink-3">Friends who order</dt><dd className="num text-right text-ink">{units(r.friends)}</dd>
            <dt className="text-ink-3">Lost to fraud</dt><dd className="num text-right text-loss">{units(r.fraud)}</dd>
            <dt className="text-ink-3">Rewards paid</dt><dd className="num text-right text-ink">{inrShort(r.cost)}</dd>
            <dt className="text-ink-3">Per new buyer</dt><dd className={cn('num text-right font-semibold', r.perNewBuyer < R.adsCac ? 'text-gain' : 'text-loss')}>{inrShort(r.perNewBuyer)} <span className="font-normal text-ink-3">vs ads {inrShort(R.adsCac)}</span></dd>
          </dl>
          <div className="mt-3 flex items-end justify-between rounded-xl bg-paper-2/70 p-3"><span className="text-[12.5px] text-ink-2">Net over a quarter</span><Money value={r.net} signed className={cn('text-[22px] font-semibold', r.net >= 0 ? 'text-gain' : 'text-loss')} /></div>
          <div className="mt-3 rounded-xl border border-rule bg-paper/60 p-3 text-[12.5px]">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] tracking-wider text-ink-3 uppercase"><MessageCircle size={12} /> What the friend receives</div>
            <p className="text-ink">"I shop at {seller.brand} and thought you'd like it. Here's {inrShort(d.give)} off your first order: {seller.brand.toLowerCase().replace(/[^a-z]/g, '')}.in/r/PRIYA25"</p>
          </div>
        </Card>
      </Spot>
      <Spot id="referral-fraud">
        <Card className="p-5">
          <Eyebrow>Fraud queue</Eyebrow>
          <h3 className="display mt-1 text-[19px] text-ink">Rewards that look farmed</h3>
          <ul className="mt-3 space-y-2">
            {R.referrals.map((e) => {
              const risk = riskOf(e)
              const st = decided[e.id]
              return (
                <li key={e.id} className={cn('rounded-xl border p-3', risk === 'block' ? 'border-loss/30 bg-loss-soft/40' : risk === 'review' ? 'border-warn/30 bg-warn-soft/30' : 'border-rule-2')}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[13px] text-ink">{e.referrer} → {e.friend}</div>
                    <Chip tone={risk === 'block' ? 'loss' : risk === 'review' ? 'warn' : 'gain'}>{risk === 'block' ? 'Likely fraud' : risk === 'review' ? 'Check' : 'Looks genuine'}</Chip>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-[11.5px] text-ink-3">{e.signals.length ? e.signals.map((x) => <span key={x} className="rounded bg-paper-2 px-1.5 py-0.5">{SIGNAL_LABEL[x]}</span>) : 'No signals'}<span>· orders {inrShort(e.value)} · {e.daysAgo ? `${e.daysAgo}d ago` : 'today'}</span></div>
                  <div className="mt-2 flex gap-2">
                    {st ? <span className={cn('text-[12px] font-medium', st === 'approved' ? 'text-gain' : 'text-loss')}>{st === 'approved' ? 'Reward approved' : 'Blocked; reward withheld'}</span> : <>
                      <button onClick={() => setDecided({ ...decided, [e.id]: 'approved' })} className="flex items-center gap-1 rounded-full border border-rule px-2.5 py-1 text-[12px] text-ink-2 hover:text-ink"><Check size={12} /> Approve</button>
                      <button onClick={() => setDecided({ ...decided, [e.id]: 'blocked' })} className="flex items-center gap-1 rounded-full border border-loss/40 px-2.5 py-1 text-[12px] text-loss"><ShieldAlert size={12} /> Block</button>
                    </>}
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-[11.5px] text-ink-3">Signals: the same device, address or payment method on both sides, or many sign-ups in a short time. Two or more signals, or a burst, is blocked by default.</p>
        </Card>
      </Spot>
    </div>
  )
}

function ResellerTab() {
  const seller = useSeller()
  const R = REACH[seller.id]
  const count = R.resellers?.count ?? 150
  const [margin, setMargin] = useState(0.15)
  const [site, setSite] = useState(0.3)
  const r = resellerVsSitewide(seller, margin, site, count)
  const max = Math.max(Math.abs(r.rNet), Math.abs(r.sNet))
  return (
    <Spot id="resellers">
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <Eyebrow>{R.resellers ? `${count} resellers on WhatsApp` : `If ${seller.name} started with ${count} resellers`}</Eyebrow>
          <h3 className="display mt-1 text-[21px] text-ink">A reseller margin, or a {pct(site)} sitewide sale?</h3>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-2">Resellers buy at a margin and sell in their own WhatsApp groups, to buyers {seller.brand} doesn't reach. A sitewide sale gives the same discount to everyone, including people who would have paid full price.</p>
          <div className="mt-5 space-y-3">
            {[{ label: `Reseller network at ${pct(margin)} margin`, v: r.rNet, sub: `${units(r.rOrders)} orders a week` }, { label: `${pct(site)} off sitewide`, v: r.sNet, sub: `${units(r.sOrders)} extra orders a week` }].map((x, i) => (
              <div key={x.label} className="grid items-center gap-3 md:grid-cols-[230px_1fr_100px]">
                <span className="text-[13px] text-ink">{x.label}<span className="block text-[11.5px] text-ink-3">{x.sub}</span></span>
                <span className="relative h-5"><span className="absolute inset-y-0 left-1/2 w-px bg-rule" /><motion.span className={cn('absolute inset-y-0 rounded', x.v >= 0 ? 'left-1/2 bg-gain' : 'right-1/2 bg-loss/85')} animate={{ width: `${(Math.abs(x.v) / max) * 50}%` }} transition={{ delay: i * 0.1 }} /></span>
                <Money value={x.v} signed className={cn('text-right text-[15px] font-semibold', x.v >= 0 ? 'text-gain' : 'text-loss')} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11.5px] text-ink-3">Weekly net after margin, returns and the discount given to buyers who'd have bought anyway. Reseller payouts count as a channel cost, like a marketplace commission.</p>
        </Card>
        <Card className="h-fit p-5">
          <div className="flex items-center gap-2 text-brass"><Store size={15} /><Eyebrow className="text-brass">Settings</Eyebrow></div>
          <div className="mt-3 space-y-4 text-[12.5px]">
            <div><div className="flex justify-between"><span className="text-ink-2">Reseller margin</span><span className="num font-semibold text-ink">{pct(margin)}</span></div><Slider label="Reseller margin" min={0.05} max={0.35} step={0.01} value={margin} onChange={setMargin} className="mt-1.5" /></div>
            <div><div className="flex justify-between"><span className="text-ink-2">Sitewide discount</span><span className="num font-semibold text-ink">{pct(site)}</span></div><Slider label="Sitewide" min={0.05} max={0.5} step={0.01} value={site} onChange={setSite} className="mt-1.5" /></div>
          </div>
          {seller.id === 'farhan' && <p className="mt-4 rounded-lg bg-gain-soft/70 p-2.5 text-[12px] text-gain">Farhan's weekly 30% sitewide habit is the comparison: the reseller network earns more and trains nobody to wait.</p>}
        </Card>
      </div>
    </Spot>
  )
}
