import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { AlertTriangle, Camera, Check, Clapperboard, Link2, Megaphone, PlayCircle, Plus, Users, X } from 'lucide-react'
import { Card, Chip, Eyebrow, Money, PageHeader, Segmented, Slider, Switch } from '@/components/ui'
import { NumberInput } from '@/components/ui/form'
import { Spot } from '@/components/Spot'
import { REACH, type Creator } from '@/data/reach'
import { budgetSplit, creatorSim, defaultDeal, disclosure, MODELS, rankCreators, type Deal, type PayModel } from '@/engine/reach'
import { newCampaign } from '@/features/campaigns/templates'
import { useLaunch } from '@/state/launch'
import { useStore } from '@/state/store'
import { useSeller } from '@/state/hooks'
import { fmtDay } from '@/lib/dates'
import { inrShort, pct, units } from '@/lib/format'
import { cn } from '@/lib/cn'

const MODEL_LABEL: Record<PayModel, string> = { flat: 'Flat fee', commission: 'Commission', seeding: 'Free product', hybrid: 'Fee + commission' }
const TIER_TONE = { nano: 'gain', micro: 'brass', macro: 'warn', celebrity: 'loss' } as const
const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n))
const PlatformIcon = ({ p }: { p: Creator['platform'] }) => (p === 'YouTube' ? <PlayCircle size={13} /> : p === 'Instagram' ? <Camera size={13} /> : <Megaphone size={13} />)

export function CreatorHub() {
  const seller = useSeller()
  const R = REACH[seller.id]
  const ranked = useMemo(() => rankCreators(R.creators, seller, R.adsCac), [R, seller])
  const [sel, setSel] = useState(ranked[0].c.id)
  const current = R.creators.find((c) => c.id === sel) ?? ranked[0].c
  return (
    <div>
      <PageHeader eyebrow="Creator hub" title={<>Creators are a promotion too.<br /><span className="text-ink-3">Weigh them like one.</span></>}
        aside={<div className="hidden text-right md:block"><div className="text-[11px] tracking-wider text-ink-3 uppercase">Paid ads cost</div><div className="num text-[26px] font-semibold text-ink">{inrShort(R.adsCac)}</div><div className="text-[11.5px] text-ink-3">per new buyer</div></div>}>
        A creator post has a cost (a fee, a commission, free product, the discount code) and brings orders, some of which would have
        happened anyway and some of which leak to coupon sites. Tarazu peels each creator like a sale, so you can compare them with each other and with ads.
      </PageHeader>
      <Spot id="creator-split"><Split /></Spot>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_400px]">
        <Spot id="creator-roster">
          <Card className="p-0">
            <div className="flex items-center justify-between border-b border-rule px-4 py-3"><Eyebrow>Roster · ranked by expected net</Eyebrow><span className="text-[11.5px] text-ink-3">{R.creators.length} creators · all invented</span></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-[12.5px]">
                <thead className="text-left text-ink-3"><tr className="border-b border-rule"><th className="px-4 py-2 font-medium">Creator</th><th className="px-2 py-2 font-medium">Followers</th><th className="px-2 py-2 font-medium">Engaged</th><th className="px-2 py-2 font-medium">Fit</th><th className="px-2 py-2 font-medium">Best deal</th><th className="px-2 py-2 text-right font-medium">Per new buyer</th><th className="px-4 py-2 text-right font-medium">Net</th></tr></thead>
                <tbody>
                  {ranked.map(({ c, r, best, fit }) => (
                    <tr key={c.id} onClick={() => setSel(c.id)} className={cn('cursor-pointer border-b border-rule-2 hover:bg-paper-2/60', sel === c.id && 'bg-surface')}>
                      <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><Initials name={c.name} /><div><div className="flex items-center gap-1.5 text-ink"><PlatformIcon p={c.platform} />{c.handle}</div><div className="text-[11px] text-ink-3">{c.niche} · <Chip tone={TIER_TONE[c.tier]}>{c.tier}</Chip></div></div></div></td>
                      <td className="num px-2 py-2.5 text-ink">{compact(c.followers)}</td>
                      <td className="num px-2 py-2.5 text-ink-2">{pct(c.engagement)}</td>
                      <td className="px-2 py-2.5"><div className="flex items-center gap-1.5"><span className="h-1.5 w-12 overflow-hidden rounded-full bg-rule-2"><span className="block h-full bg-primary" style={{ width: `${fit}%` }} /></span><span className="num text-[11.5px] text-ink-2">{fit}</span></div></td>
                      <td className="px-2 py-2.5 text-ink-2">{MODEL_LABEL[best]}</td>
                      <td className={cn('num px-2 py-2.5 text-right font-medium', r.perNewBuyer < R.adsCac ? 'text-gain' : 'text-loss')}>{inrShort(r.perNewBuyer)}</td>
                      <td className="px-4 py-2.5 text-right"><Money value={r.net} signed className={cn('font-semibold', r.net >= 0 ? 'text-gain' : 'text-loss')} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-4 py-3 text-[11.5px] text-ink-3">Green: cheaper per new buyer than paid ads ({inrShort(R.adsCac)}). Fit blends audience match, engagement, fake-follower risk and how much past codes leaked.</p>
          </Card>
        </Spot>
        <div className="xl:sticky xl:top-24 xl:self-start"><Spot id="creator-deal"><Detail key={current.id} c={current} /></Spot></div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Spot id="creator-disclosure"><Disclosure c={current} /></Spot>
        <Spot id="creator-calendar"><Calendar ranked={ranked.slice(0, 5).map((x) => x.c)} /></Spot>
      </div>
    </div>
  )
}

function Initials({ name }: { name: string }) {
  const i = name.split(' ').map((x) => x[0]).join('').slice(0, 2)
  return <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brass-soft text-[11px] font-semibold text-brass-ink">{i}</span>
}

function Split() {
  const seller = useSeller()
  const R = REACH[seller.id]
  const b = useMemo(() => budgetSplit(R.creators, seller, R.adsCac), [R, seller])
  if (!b) return null
  const rows = [
    { label: `One ${b.celeb.tier === 'celebrity' ? 'celebrity' : 'big creator'}: ${b.celeb.handle}`, nb: b.one.newBuyers, per: b.one.perNewBuyer, net: b.one.net, leaked: b.one.leaked },
    { label: `${b.n} micro and nano creators`, nb: b.many.newBuyers, per: b.many.perNewBuyer, net: b.many.net, leaked: b.many.leaked },
  ]
  const max = Math.max(...rows.map((r) => r.nb))
  return (
    <Card className="border-beam p-5">
      <Eyebrow>Same {inrShort(b.budget)} budget</Eyebrow>
      <h2 className="display mt-1 text-[22px] text-ink">One big name, or {b.n} small creators?</h2>
      <div className="mt-4 space-y-3">
        {rows.map((r, i) => (
          <div key={r.label} className="grid items-center gap-3 md:grid-cols-[260px_1fr_auto]">
            <span className="text-[13px] text-ink">{r.label}</span>
            <div className="h-6 overflow-hidden rounded-md bg-paper-2"><motion.div initial={{ width: 0 }} animate={{ width: `${(r.nb / max) * 100}%` }} transition={{ delay: i * 0.15 }} className={cn('flex h-full items-center px-2 text-[11.5px] font-medium text-white', i ? 'bg-gain' : 'bg-loss/80')}>{units(r.nb)} new buyers</motion.div></div>
            <span className="num text-right text-[12.5px] text-ink-2">{inrShort(r.per)} per new buyer · {units(r.leaked)} leaked uses</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12.5px] leading-snug text-ink-3">Small creators have audiences that trust them and match {seller.brand}'s buyers. Big names reach more people, but fewer of them are buyers, more are fake or inactive, and their public codes travel to coupon sites. Paid ads cost {inrShort(R.adsCac)} per new buyer.</p>
    </Card>
  )
}

function Detail({ c }: { c: Creator }) {
  const seller = useSeller()
  const R = REACH[seller.id]
  const [d, setD] = useState<Deal>(() => ({ ...defaultDeal(c), model: rankCreators([c], seller, R.adsCac)[0].best }))
  const r = useMemo(() => creatorSim(c, d, seller, R.adsCac), [c, d, seller, R])
  const { saveCampaign } = useStore()
  const { commit, setCodes } = useLaunch()
  const nav = useNavigate()
  const code = c.handle.replace(/[^a-z]/gi, '').slice(0, 8).toUpperCase() + Math.round(d.discount * 100)
  const slug = seller.brand.toLowerCase().replace(/[^a-z]/g, '')
  const peel = [
    { label: 'Orders with the code', v: r.orders, tone: 'bg-ink-3' },
    { label: 'Leaked to coupon sites', v: -r.leaked, tone: 'bg-loss/80' },
    { label: 'Would have bought anyway', v: -r.anyway, tone: 'bg-warn' },
    { label: 'Truly new orders', v: r.incremental, tone: 'bg-gain' },
  ]
  const create = () => {
    const k = newCampaign(seller, 'Creator code', {
      name: `Creator: ${c.handle} ${pct(d.discount)} off`, status: 'draft', startDay: 2, endDay: 16, stacking: 'exclusive', perCustomer: 1,
      reward: { kind: 'pctOff', value: d.discount, target: 'cart' }, conditions: d.uniqueCodes ? [] : [{ kind: 'code', value: code }],
      budget: Math.max(3000, Math.round((r.discountGiven + r.commission) / 1000) * 1000), dailyRedemptions: Math.max(1, Math.round(r.orders / 14)),
      funding: 'seller', note: `${MODEL_LABEL[d.model]} deal with ${c.name}`,
      launch: { goal: 'creator', codes: d.uniqueCodes ? { mode: 'bulk', prefix: code.slice(0, 6), count: Math.max(200, Math.round(r.orders * 3)) } : { mode: 'public', prefix: code }, channels: ['website'].filter((x) => seller.market.channels[x]) },
    })
    saveCampaign(k); commit(k, `Created from the Creator hub for ${c.handle}`)
    if (d.uniqueCodes) setCodes(k.id, { prefix: code.slice(0, 6), count: Math.max(200, Math.round(r.orders * 3)), seed: 2, blocked: [], createdAt: Date.now(), label: c.handle })
    toast('Creator campaign drafted', { description: 'Finish it in the Launch flow.' })
    nav(`/launch?id=${k.id}`)
  }
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3"><Initials name={c.name} /><div className="min-w-0 flex-1"><div className="text-[15px] font-semibold text-ink">{c.name}</div><div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-3"><PlatformIcon p={c.platform} />{c.handle} · {compact(c.followers)} · {c.language}</div></div><Chip tone={TIER_TONE[c.tier]}>{c.tier}</Chip></div>
      {c.fakeRisk > 0.12 && <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-warn-soft/70 px-2.5 py-1.5 text-[12px] text-brass-ink"><AlertTriangle size={13} /> About {pct(c.fakeRisk)} of followers look fake or inactive: {units(r.fakeLoss)} views that will never buy.</p>}
      <div className="mt-4 space-y-3 text-[12.5px]">
        <Segmented<PayModel> size="sm" value={d.model} onChange={(model) => setD({ ...d, model })} options={MODELS[c.tier].map((m) => ({ value: m, label: MODEL_LABEL[m] }))} />
        {MODELS[c.tier].length < 4 && <p className="text-[11.5px] text-ink-3">{c.tier === 'celebrity' ? 'Celebrities work on flat fees only.' : 'Big creators don\'t post for free product.'}</p>}
        {(d.model === 'flat' || d.model === 'hybrid') && <label className="flex items-center justify-between">Fee {d.model === 'hybrid' ? '(half up front)' : ''}<NumberInput label="Fee" value={d.fee} onChange={(v) => setD({ ...d, fee: v ?? 0 })} prefix="₹" className="w-28" /></label>}
        {(d.model === 'commission' || d.model === 'hybrid') && <div><div className="flex justify-between"><span>Commission on sales</span><span className="num font-semibold text-ink">{pct(d.commission)}</span></div><Slider label="Commission" min={0.03} max={0.25} step={0.01} value={d.commission} onChange={(commission) => setD({ ...d, commission })} className="mt-1.5" /></div>}
        {(d.model === 'seeding' || d.model === 'hybrid') && <label className="flex items-center justify-between">Products sent<NumberInput label="Seed units" value={d.seedUnits} onChange={(v) => setD({ ...d, seedUnits: v ?? 1 })} className="w-20" /></label>}
        <div><div className="flex justify-between"><span>Follower discount</span><span className="num font-semibold text-ink">{pct(d.discount)}</span></div><Slider label="Discount" min={0} max={0.3} step={0.01} value={d.discount} onChange={(discount) => setD({ ...d, discount })} className="mt-1.5" /></div>
        <label className="flex items-center justify-between">Single-use codes (stop leaks)<Switch checked={d.uniqueCodes} onChange={(uniqueCodes) => setD({ ...d, uniqueCodes })} label="Single-use codes" /></label>
      </div>
      <div className="mt-4 space-y-1.5">
        {peel.map((p) => (
          <div key={p.label} className="grid grid-cols-[150px_1fr_44px] items-center gap-2 text-[12px]">
            <span className="text-ink-2">{p.label}</span>
            <span className="h-2.5 overflow-hidden rounded-full bg-paper-2"><motion.span className={cn('block h-full', p.tone)} animate={{ width: `${(Math.abs(p.v) / Math.max(1, r.orders)) * 100}%` }} /></span>
            <span className="num text-right text-ink">{Math.round(p.v) < 0 ? '−' : ''}{units(Math.abs(p.v))}</span>
          </div>
        ))}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-y-1 border-t border-dashed border-rule pt-3 text-[12px]">
        <dt className="text-ink-3">Fee + commission</dt><dd className="num text-right text-ink">{inrShort(r.fee + r.commission)}</dd>
        <dt className="text-ink-3">Free product</dt><dd className="num text-right text-ink">{inrShort(r.seeding)}</dd>
        <dt className="text-ink-3">Discount given</dt><dd className="num text-right text-ink">{inrShort(r.discountGiven)}</dd>
        <dt className="text-ink-3">Per new buyer</dt><dd className={cn('num text-right font-semibold', r.perNewBuyer < R.adsCac ? 'text-gain' : 'text-loss')}>{inrShort(r.perNewBuyer)} <span className="font-normal text-ink-3">vs ads {inrShort(R.adsCac)}</span></dd>
      </dl>
      <div className="mt-3 flex items-end justify-between rounded-xl bg-paper-2/70 p-3"><span className="text-[12.5px] text-ink-2">Net over two weeks</span><Money value={r.net} signed className={cn('text-[22px] font-semibold', r.net >= 0 ? 'text-gain' : 'text-loss')} /></div>
      <div className="mt-3 space-y-1 text-[12px] text-ink-2">
        <div className="flex items-center gap-1.5"><Link2 size={12} className="text-ink-3" /><span className="num truncate">{slug}.in/?ref={c.handle.slice(1)}</span></div>
        <div className="flex items-center gap-1.5"><Clapperboard size={12} className="text-ink-3" />{c.rightsDays ? `Can reuse their video in ads for ${c.rightsDays} more days` : 'No rights to reuse their content in ads'}</div>
      </div>
      <button onClick={create} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2 text-[13px] font-medium text-paper"><Plus size={14} /> Draft a creator campaign</button>
    </Card>
  )
}

function Disclosure({ c }: { c: Creator }) {
  const seller = useSeller()
  const [text, setText] = useState(`My ${c.niche.toLowerCase()} pick this week: ${seller.brand} ✨ Use my code for ${seller.name}'s festive offer. Link in bio! #${seller.brand.replace(/\s/g, '')} #indianbrands #musthave`)
  const r = disclosure(text)
  return (
    <Card className="h-full p-5">
      <Eyebrow>Disclosure check</Eyebrow>
      <h3 className="display mt-1 text-[19px] text-ink">Is the post clearly labelled as an ad?</h3>
      <textarea aria-label="Caption" value={text} onChange={(e) => setText(e.target.value)} rows={4} className="mt-3 w-full resize-none rounded-xl border border-rule bg-paper px-3 py-2 text-[13px] text-ink outline-none focus:border-brass/60" />
      <ul className="mt-2 space-y-1 text-[12.5px]">{r.checks.map((x) => <li key={x.label} className={cn('flex items-center gap-1.5', x.ok ? 'text-ink-2' : 'text-loss')}>{x.ok ? <Check size={13} className="text-gain" /> : <X size={13} />}{x.label}</li>)}</ul>
      {!r.ok && <button onClick={() => setText(`#ad ${text.replace(/#ad\b\s*/gi, '')}`)} className="mt-3 rounded-full border border-rule px-3 py-1.5 text-[12.5px] text-ink-2 hover:text-ink">Add #ad upfront</button>}
      <p className="mt-3 text-[11.5px] leading-snug text-ink-3">Based on ASCI's influencer guidelines and the Consumer Affairs "Endorsements Know-hows!" (2023): a clear label, placed where people see it first. Not legal advice.</p>
    </Card>
  )
}

function Calendar({ ranked }: { ranked: Creator[] }) {
  const seller = useSeller()
  const events = seller.calendar.filter((e) => e.kind === 'event' && e.day >= 0 && e.day < 45)
  const ev = events[0]
  const posts = ranked.map((c, i) => ({ c, day: ev ? Math.max(1, ev.day - 6 + i * 2 - (i === ranked.length - 1 ? -9 : 0)) : 5 + i * 4 }))
  const W = 45
  return (
    <Card className="h-full p-5">
      <Eyebrow>Content calendar · next 45 days</Eyebrow>
      <h3 className="display mt-1 text-[19px] text-ink">Posts land before the sale, not after it</h3>
      <div className="relative mt-4 h-[150px] rounded-xl border border-rule-2 bg-paper/50">
        {events.map((e) => <div key={e.label} className="absolute inset-y-0 bg-brass-soft/70" style={{ left: `${(e.day / W) * 100}%`, width: `${(Math.max(1, e.length) / W) * 100}%` }}><span className="absolute top-1 left-1 text-[10px] whitespace-nowrap text-brass-ink">{e.label}</span></div>)}
        {posts.map((p, i) => {
          const late = ev && p.day > ev.day + ev.length
          return (
            <div key={p.c.id} className="absolute flex items-center gap-1" style={{ left: `${(p.day / W) * 100}%`, top: 26 + i * 23 }}>
              <span className={cn('h-2.5 w-2.5 rounded-full', late ? 'bg-loss' : 'bg-primary')} />
              <span className={cn('text-[10.5px] whitespace-nowrap', late ? 'text-loss' : 'text-ink-2')}>{p.c.handle} · {fmtDay(p.day)}{late ? ' · after the sale' : ''}</span>
            </div>
          )
        })}
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-ink-3"><Users size={12} /> Posts 2–6 days before an event warm buyers up. A post after the sale ends sends people to full prices.</p>
    </Card>
  )
}
