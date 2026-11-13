import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BadgeCheck, MessageCircle, Star, Users } from 'lucide-react'
import { Card, Chip, Eyebrow, Money, PageHeader, Segmented, Slider, Switch } from '@/components/ui'
import { Select } from '@/components/ui/form'
import { Spot } from '@/components/Spot'
import { REACH } from '@/data/reach'
import { drop, groupBuy } from '@/engine/reach'
import { useSeller } from '@/state/hooks'
import { inrShort, pct, units } from '@/lib/format'
import { cn } from '@/lib/cn'

export function Community() {
  const seller = useSeller()
  const R = REACH[seller.id]
  const base = R.community || 1200
  return (
    <div>
      <PageHeader eyebrow="Community" title={<>Sell to people who<br /><span className="text-ink-3">already know you.</span></>} aside={
        <div className="rounded-xl border border-rule bg-card p-3 text-[12.5px]">
          <div className="flex items-center gap-1.5 text-ink-3"><Users size={13} /> {R.community ? 'WhatsApp community' : 'Office WhatsApp groups'}</div>
          <div className="num mt-0.5 text-[20px] font-semibold text-ink">{units(base)}</div>
          <div className="text-[11.5px] text-ink-3">{R.community ? 'members' : 'reachable through 30 office groups (no community yet)'}</div>
        </div>
      }>
        A community is the cheapest channel a seller owns: no ad auction and no marketplace fee. Drops reward the people who show up first,
        group buys let buyers recruit each other, and reviews bring the next buyer in. None of it needs a sitewide discount.
      </PageHeader>
      <div className="grid gap-5 xl:grid-cols-2">
        <DropPlanner community={base} />
        <GroupBuy community={base} />
        <Reviews />
      </div>
    </div>
  )
}

function DropPlanner({ community }: { community: number }) {
  const seller = useSeller()
  const [skuId, setSkuId] = useState(seller.skus[0].id)
  const sku = seller.skus.find((s) => s.id === skuId) ?? seller.skus[0]
  const [stock, setStock] = useState(Math.min(sku.stock, 300))
  const [early, setEarly] = useState(6)
  const [disc, setDisc] = useState(0.1)
  const r = drop(stock, community, early, disc, sku)
  return (
    <Spot id="community-drop" className="xl:col-span-2">
      <Card className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><Eyebrow>WhatsApp drop</Eyebrow><h3 className="display mt-1 text-[19px] text-ink">Members first, then everyone, at full price</h3></div>
          <Select label="Product" value={skuId} onChange={(v) => { setSkuId(v); const s = seller.skus.find((x) => x.id === v)!; setStock(Math.min(s.stock, 300)) }} options={seller.skus.map((s) => ({ value: s.id, label: `${s.line} ${s.variant}` }))} className="w-[240px]" />
        </div>
        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={r.hours} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid stroke="var(--color-rule-2)" vertical={false} />
                  <XAxis dataKey="h" tick={{ fontSize: 11, fill: 'var(--color-ink-3)' }} tickFormatter={(h) => `${h}h`} interval={5} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-3)' }} domain={[0, stock]} />
                  <ReferenceLine y={stock} stroke="var(--color-rule)" strokeDasharray="4 4" label={{ value: 'Stock', position: 'insideTopRight', fontSize: 11, fill: 'var(--color-ink-3)' }} />
                  {early > 0 && <ReferenceLine x={early} stroke="var(--color-brass-2)" label={{ value: 'Public', position: 'insideTopLeft', fontSize: 11, fill: 'var(--color-brass)' }} />}
                  <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-rule)', borderRadius: 10, fontSize: 12 }} labelFormatter={(h) => `Hour ${h}`} formatter={(v) => [`${v} sold`, '']} />
                  <Area type="monotone" dataKey="sold" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.14} strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[12.5px] sm:grid-cols-4">
              <div><dt className="text-ink-3">Sold in 48h</dt><dd className="num text-[16px] font-semibold text-ink">{units(r.sold)} <span className="text-[12px] font-normal text-ink-3">({pct(r.sellThrough)})</span></dd></div>
              <div><dt className="text-ink-3">Members bought</dt><dd className="num text-[16px] font-semibold text-ink">{units(r.earlyUnits)}</dd></div>
              <div><dt className="text-ink-3">At full price</dt><dd className="num text-[16px] font-semibold text-gain">{pct(r.fullPriceShare)}</dd></div>
              <div><dt className="text-ink-3">Revenue</dt><dd><Money value={r.revenue} className="text-[16px] font-semibold text-ink" /></dd></div>
            </dl>
          </div>
          <div className="space-y-3 text-[12.5px]">
            <div><div className="flex justify-between"><span className="text-ink-2">Units in the drop</span><span className="num font-semibold text-ink">{stock}</span></div><Slider label="Units" min={20} max={Math.max(40, sku.stock)} step={10} value={stock} onChange={setStock} className="mt-1.5" /></div>
            <div><div className="flex justify-between"><span className="text-ink-2">Members-only window</span><span className="num font-semibold text-ink">{early} h</span></div><Slider label="Early hours" min={0} max={24} step={1} value={early} onChange={setEarly} className="mt-1.5" /></div>
            <div><div className="flex justify-between"><span className="text-ink-2">Members' price</span><span className="num font-semibold text-ink">{disc ? `${pct(disc)} off` : 'Full price'}</span></div><Slider label="Early discount" min={0} max={0.3} step={0.01} value={disc} onChange={setDisc} className="mt-1.5" /></div>
            <div className="rounded-xl bg-surface p-3 text-[12.5px] text-ink dark:bg-paper-2">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] tracking-wider text-ink-3 uppercase"><MessageCircle size={12} /> Community message</div>
              <p>New drop: {sku.line} {sku.variant}, only {stock} made. {early > 0 ? `Members get ${early} hours first${disc ? ` at ${pct(disc)} off` : ''}. ` : ''}Opens 8 pm tonight.</p>
            </div>
          </div>
        </div>
      </Card>
    </Spot>
  )
}

function GroupBuy({ community }: { community: number }) {
  const seller = useSeller()
  const sku = useMemo(() => [...seller.skus].sort((a, b) => b.price - b.cost - (a.price - a.cost))[0], [seller])
  const [deep, setDeep] = useState(0.2)
  const tiers = [2, 3, 5, 8].map((size, i) => ({ size, price: Math.round(sku.price * (1 - deep * (0.4 + i * 0.2))) }))
  const interested = Math.round(community * 0.12)
  const rows = groupBuy(sku, tiers, interested)
  const best = rows.reduce((a, b) => (b.net > a.net ? b : a))
  const max = Math.max(...rows.map((r) => Math.abs(r.net)))
  return (
    <Spot id="community-group">
      <Card className="h-full p-5">
        <Eyebrow>Group buy</Eyebrow>
        <h3 className="display mt-1 text-[19px] text-ink">The smallest group that still makes money</h3>
        <p className="mt-1 text-[12.5px] text-ink-3">{sku.line} {sku.variant}, list {inrShort(sku.price)}. {units(interested)} people likely to start a group.</p>
        <div className="mt-3 text-[12.5px]"><div className="flex justify-between"><span className="text-ink-2">Deepest group price</span><span className="num font-semibold text-ink">{pct(deep)} off</span></div><Slider label="Depth" min={0.05} max={0.4} step={0.01} value={deep} onChange={setDeep} className="mt-1.5" /></div>
        <ul className="mt-4 space-y-2.5">
          {rows.map((r) => (
            <li key={r.size} className="grid grid-cols-[86px_1fr_80px] items-center gap-2 text-[12.5px]">
              <span className="text-ink">{r.size} people<span className="block text-[11px] text-ink-3">{inrShort(r.price)} · {pct(r.complete)} fill</span></span>
              <span className="relative h-4"><span className="absolute inset-y-0 left-1/2 w-px bg-rule" /><motion.span className={cn('absolute inset-y-0 rounded', r.net >= 0 ? 'left-1/2 bg-gain' : 'right-1/2 bg-loss/85')} animate={{ width: `${(Math.abs(r.net) / max) * 50}%` }} /></span>
              <Money value={r.net} signed className={cn('text-right font-semibold', r === best ? 'text-gain' : r.net >= 0 ? 'text-ink' : 'text-loss')} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] leading-snug text-ink-3">Bigger groups get a better price but fill less often; an unfilled group sells nothing. Groups of {best.size} make the most here. {seller.id === 'anaya' ? 'Office groups fill well at 3 to 5: one person orders for the floor.' : ''}</p>
      </Card>
    </Spot>
  )
}

const REWARDS = [
  { id: 'any', label: 'Any honest review', ok: true, note: 'The same reward whatever the rating. Allowed under BIS IS 19000:2022 if the review is tagged as incentivised.' },
  { id: 'photo', label: 'Photo or video review', ok: true, note: 'A larger reward for more effort is fine, as long as the rating does not change it.' },
  { id: 'five', label: '5-star reviews only', ok: false, note: 'Paying for a rating is a deceptive review under IS 19000:2022 and the CCPA dark-pattern guidelines. Marketplaces remove these reviews.' },
  { id: 'edit', label: 'Reward for changing a bad review', ok: false, note: 'Same problem: the reward depends on the opinion. Fix the issue and ask, without a reward.' },
]

function Reviews() {
  const seller = useSeller()
  const [pick, setPick] = useState('any')
  const [tag, setTag] = useState(true)
  const [reward, setReward] = useState<'points' | 'coupon' | 'sample'>('coupon')
  const r = REWARDS.find((x) => x.id === pick)!
  const amount = Math.round(seller.avgOrder * 0.08 / 10) * 10
  return (
    <Spot id="community-reviews">
      <Card className="h-full p-5">
        <Eyebrow>UGC and review rewards</Eyebrow>
        <h3 className="display mt-1 text-[19px] text-ink">Reward the review, never the rating</h3>
        <ul className="mt-3 space-y-1.5">
          {REWARDS.map((x) => (
            <li key={x.id}><button onClick={() => setPick(x.id)} className={cn('flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-[12.5px]', pick === x.id ? 'border-primary bg-surface/60 dark:bg-paper-2' : 'border-rule-2 hover:border-rule')}>
              <span className="text-ink">{x.label}</span><Chip tone={x.ok ? 'gain' : 'loss'}>{x.ok ? 'Allowed' : 'Not allowed'}</Chip>
            </button></li>
          ))}
        </ul>
        <p className={cn('mt-3 rounded-lg p-2.5 text-[12px] leading-snug', r.ok ? 'bg-gain-soft/60 text-ink-2' : 'bg-loss-soft/60 text-loss-ink')}>{r.note}</p>
        {r.ok && <div className="mt-3 space-y-2.5 text-[12.5px]">
          <div className="flex flex-wrap items-center gap-2 text-ink-2">Reward <Segmented size="sm" value={reward} onChange={setReward} options={[{ value: 'coupon', label: `${inrShort(amount)} coupon` }, { value: 'points', label: `${amount} points` }, { value: 'sample', label: 'Free sample' }]} /></div>
          <label className="flex items-center justify-between text-ink-2">Show "received a reward" on the review<Switch checked={tag} onChange={setTag} label="Disclose" /></label>
          <div className="rounded-xl border border-rule bg-paper/60 p-3">
            <div className="flex items-center gap-1 text-warn">{[0, 1, 2, 3].map((i) => <Star key={i} size={12} fill="currentColor" />)}<Star size={12} /></div>
            <p className="mt-1 text-ink">"Good, but the box arrived dented. Product itself is lovely."</p>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-3"><BadgeCheck size={12} className="text-gain" /> Verified buyer{tag ? ' · Received a reward for reviewing' : ''}</div>
          </div>
          {!tag && <p className="text-[12px] text-loss">Without the tag, the review breaks the disclosure rule even though the reward is honest.</p>}
        </div>}
      </Card>
    </Spot>
  )
}
