import { useEffect, useMemo } from 'react'
import { motion, useSpring, useTransform } from 'motion/react'
import { Card, Eyebrow } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { useControls, usePortfolio, useSeller } from '@/state/hooks'
import { pct } from '@/lib/format'
import { STRATEGY } from '@/engine/engine'

/** Promo fatigue: how much of the business only moves on discount. */
export function promoDependency(share: number[], strategy: keyof typeof STRATEGY) {
  const recent = share.slice(-8)
  const base = recent.reduce((a, b) => a + b, 0) / recent.length
  const adj = strategy === 'hilo' ? 0.08 : strategy === 'edlp' ? -0.12 : 0
  return Math.min(0.95, Math.max(0.03, base + adj))
}

export const fatigueBand = (v: number) =>
  v < 0.25 ? { label: 'Healthy', note: 'Most buyers pay full price.', color: '#1e7b4f' }
    : v < 0.5 ? { label: 'Watch it', note: 'A growing share only buys on offer.', color: '#d97706' }
      : { label: 'Trained to wait', note: 'Buyers have learned to hold out for the next sale.', color: '#c2421c' }

const R = 74, CX = 96, CY = 92
const arc = (a0: number, a1: number) => {
  const p = (a: number) => [CX - R * Math.cos(a * Math.PI), CY - R * Math.sin(a * Math.PI)]
  const [x0, y0] = p(a0), [x1, y1] = p(a1)
  return `M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1}`
}

export function FatigueCard() {
  const seller = useSeller()
  const c = useControls()
  const p = usePortfolio()
  const now = promoDependency(seller.promoShare, c.strategy)
  // If Tarazu's plan runs: only the recommended SKUs are on offer.
  const planned = useMemo(() => {
    const total = p.recs.reduce((a, r) => a + (r.discount > 0 ? r.result.promoUnits : r.result.baseUnits), 0)
    const onOffer = p.promos.reduce((a, r) => a + r.result.promoUnits, 0)
    return total ? onOffer / total : 0
  }, [p])
  const band = fatigueBand(now)

  const v = useSpring(0, { stiffness: 50, damping: 12 })
  useEffect(() => { v.set(now) }, [now, v])
  const angle = useTransform(v, (x) => -90 + x * 180)

  return (
    <Spot id="fatigue">
      <Card className="p-5">
        <Eyebrow>Promo fatigue · last 8 weeks</Eyebrow>
        <div className="mt-2 flex items-center gap-4">
          <svg viewBox="0 0 192 108" className="w-[150px] shrink-0" role="img" aria-label={`Promo dependency ${pct(now)}`}>
            <path d={arc(0, 0.25)} stroke="var(--color-gain)" strokeWidth="12" fill="none" strokeOpacity=".85" />
            <path d={arc(0.25, 0.5)} stroke="var(--color-warn)" strokeWidth="12" fill="none" strokeOpacity=".85" />
            <path d={arc(0.5, 1)} stroke="var(--color-loss)" strokeWidth="12" fill="none" strokeOpacity=".85" />
            <motion.g style={{ rotate: angle, originX: `${CX}px`, originY: `${CY}px` }}>
              <line x1={CX} y1={CY} x2={CX} y2={CY - R + 8} stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
            </motion.g>
            <circle cx={CX} cy={CY} r="7" fill="var(--color-primary)" />
            <circle cx={CX} cy={CY} r="3" fill="var(--color-brass-2)" />
          </svg>
          <div>
            <div className="num text-[30px] leading-none font-semibold" style={{ color: band.color }}>{pct(now)}</div>
            <div className="mt-1 text-[13px] font-medium text-ink">{band.label}</div>
            <div className="text-[12px] leading-snug text-ink-3">of units sold on discount. {band.note}</div>
          </div>
        </div>
        <div className="mt-3 flex h-9 items-end gap-1">
          {seller.promoShare.map((x, i) => (
            <motion.div key={i} className="flex-1 rounded-sm" style={{ background: fatigueBand(x).color, opacity: i >= 4 ? 0.9 : 0.4 }}
              initial={{ height: 0 }} animate={{ height: `${Math.max(8, x * 100)}%` }} transition={{ delay: i * 0.03 }} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10.5px] text-ink-3"><span>12 weeks ago</span><span>this week</span></div>
        <p className="mt-3 border-t border-dashed border-rule pt-3 text-[12.5px] leading-snug text-ink-2">
          With Tarazu's plan, about <b className="num font-semibold text-ink">{pct(planned)}</b> of units sell on offer
          {planned < now ? `, down ${Math.round((now - planned) * 100)} points.` : '.'}
        </p>
      </Card>
    </Spot>
  )
}
