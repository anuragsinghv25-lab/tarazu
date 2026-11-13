import { useMemo } from 'react'
import { motion } from 'motion/react'
import type { Campaign, CampaignStatus, Cart } from '@/engine/types'
import { STATUS_LABEL, estimate } from '@/engine/launch'
import { cartContext } from '@/features/sandbox/presets'
import { useCampaigns, useControls, useSeller } from '@/state/hooks'
import { inrShort } from '@/lib/format'
import { cn } from '@/lib/cn'

export const STATUS_TONE: Record<CampaignStatus, string> = {
  draft: 'bg-paper-2 text-ink-3', review: 'bg-brass-soft text-brass-ink', approved: 'bg-gain-soft text-gain', rejected: 'bg-loss-soft text-loss',
  scheduled: 'bg-brass-soft text-brass-ink', live: 'bg-gain-soft text-gain', paused: 'bg-warn-soft text-brass-ink', ended: 'bg-paper-2 text-ink-3', archived: 'bg-paper-2 text-ink-4',
}

export function StatusChip({ s, className }: { s: CampaignStatus; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', STATUS_TONE[s], className)}>{s === 'live' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gain" />}{STATUS_LABEL[s]}</span>
}

/** Seller, controls, campaigns and a checkout context builder: what every launch screen needs. */
export function useLaunchCtx() {
  const seller = useSeller(), c = useControls(), campaigns = useCampaigns()
  const ctx = useMemo(() => (cart: Cart) => cartContext(seller, c, cart), [seller, c])
  return { seller, c, campaigns, ctx }
}

/** A small Scale that stays beside the wizard: what the draft gives away vs what it earns. */
export function MiniScale({ campaign }: { campaign: Campaign }) {
  const seller = useSeller(), c = useControls()
  const e = useMemo(() => estimate(campaign, seller, c), [campaign, seller, c])
  const tilt = Math.max(-12, Math.min(12, (e.net / Math.max(1, e.given + e.earned)) * 30))
  return (
    <div>
      <svg viewBox="0 0 200 92" className="w-full" aria-hidden>
        <rect x="97" y="22" width="6" height="58" rx="2" fill="var(--color-primary)" />
        <path d="M78 88 Q78 78 100 78 Q122 78 122 88 Z" fill="var(--color-primary)" />
        <motion.g animate={{ rotate: -tilt }} style={{ originX: '100px', originY: '24px' }} transition={{ type: 'spring', stiffness: 90, damping: 14 }}>
          <rect x="18" y="21" width="164" height="5" rx="2.5" fill="var(--color-primary)" />
          <path d="M28 26 L14 52 M28 26 L42 52" stroke="var(--color-primary)" strokeWidth="1.6" />
          <path d="M172 26 L158 52 M172 26 L186 52" stroke="var(--color-primary)" strokeWidth="1.6" />
          <path d="M10 52 H46 A18 10 0 0 1 10 52 Z" fill="var(--color-loss)" opacity=".85" />
          <path d="M154 52 H190 A18 10 0 0 1 154 52 Z" fill="var(--color-gain)" opacity=".9" />
        </motion.g>
        <circle cx="100" cy="23" r="4" fill="var(--color-primary)" />
      </svg>
      <div className="mt-1 grid grid-cols-2 text-[11px]">
        <div><div className="text-ink-3">Given away</div><div className="num text-[14px] font-semibold text-loss">{inrShort(e.given)}</div></div>
        <div className="text-right"><div className="text-ink-3">Earned</div><div className="num text-[14px] font-semibold text-gain">{inrShort(e.earned)}</div></div>
      </div>
      <div className="mt-2 flex items-baseline justify-between border-t border-dashed border-rule pt-2">
        <span className="text-[11.5px] text-ink-3">Net over the run</span>
        <span className={cn('num text-[20px] font-semibold', e.net >= 0 ? 'text-gain' : 'text-loss')}>{e.net >= 0 ? '+' : '−'}{inrShort(Math.abs(e.net))}</span>
      </div>
      <div className="mt-1 text-[10.5px] leading-snug text-ink-3">{e.method === 'scale' ? `The Scale on ${e.skus} product${e.skus > 1 ? 's' : ''} it discounts` : 'Cost per use against orders this audience wouldn\'t have placed'}</div>
    </div>
  )
}
