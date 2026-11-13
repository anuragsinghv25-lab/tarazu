/* Sales channels: marketplaces show their official logo files (src/assets/marketplaces, see its README);
   generic channels (own website, quick commerce, modern trade, kiranas) use neutral icons.
   No third-party logo is drawn in code. If an official file is missing, the platform name is shown
   with a neutral store icon instead. */
import { Globe, ShoppingBasket, Store, Warehouse, Zap, type LucideIcon } from 'lucide-react'
import whatsapp from '@/assets/channels/whatsapp.svg'
import { cn } from '@/lib/cn'

const files = import.meta.glob('../assets/marketplaces/*.{svg,png,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const fileFor = (name: string) => Object.entries(files).find(([p]) => p.split('/').pop()!.replace(/\.(svg|png|webp)$/, '') === name)?.[1]

export type ChannelId = 'amazon' | 'flipkart' | 'nykaa' | 'meesho' | 'website' | 'quick' | 'modern' | 'kirana' | 'whatsapp'

interface ChannelInfo { id: ChannelId; name: string; kind: 'marketplace' | 'own' | 'retail'; icon: LucideIcon; wordmark?: string; square?: string }

export const CHANNELS: Record<ChannelId, ChannelInfo> = {
  amazon: { id: 'amazon', name: 'Amazon', kind: 'marketplace', icon: Store, wordmark: fileFor('amazon'), square: fileFor('amazon-icon') },
  flipkart: { id: 'flipkart', name: 'Flipkart', kind: 'marketplace', icon: Store, wordmark: fileFor('flipkart'), square: fileFor('flipkart-icon') },
  nykaa: { id: 'nykaa', name: 'Nykaa', kind: 'marketplace', icon: Store, wordmark: fileFor('nykaa'), square: fileFor('nykaa-icon') },
  meesho: { id: 'meesho', name: 'Meesho', kind: 'marketplace', icon: Store, wordmark: fileFor('meesho'), square: fileFor('meesho-icon') },
  website: { id: 'website', name: 'Own website', kind: 'own', icon: Globe },
  quick: { id: 'quick', name: 'Quick commerce', kind: 'retail', icon: Zap },
  modern: { id: 'modern', name: 'Modern trade', kind: 'retail', icon: ShoppingBasket },
  kirana: { id: 'kirana', name: 'Kiranas via distributor', kind: 'retail', icon: Warehouse },
  whatsapp: { id: 'whatsapp', name: 'WhatsApp', kind: 'own', icon: Globe, square: whatsapp },
}

/** Maps the free-text channel names used in seller profiles ("Distributors → kiranas") to a channel. */
export function channelFromLabel(label: string): ChannelId | undefined {
  const l = label.toLowerCase()
  return (['amazon', 'flipkart', 'nykaa', 'meesho', 'whatsapp'] as const).find((k) => l.includes(k))
    ?? (l.includes('website') ? 'website' : l.includes('quick') ? 'quick' : l.includes('modern') ? 'modern' : l.includes('kirana') || l.includes('distributor') ? 'kirana' : undefined)
}

/** A square badge for a channel: the official square mark if present, else the wordmark fitted, else a neutral icon. */
export function ChannelBadge({ id, size = 22, className }: { id: string; size?: number; className?: string }) {
  const ch = CHANNELS[id as ChannelId]
  if (!ch) return null
  const img = ch.square ?? ch.wordmark
  if (img) {
    return (
      <span className={cn('grid shrink-0 place-items-center overflow-hidden border border-rule-2 bg-white', className)} style={{ width: size, height: size, borderRadius: size * 0.26 }}>
        <img src={img} alt="" width={size} height={size} loading="lazy" decoding="async" className="h-[78%] w-[78%] object-contain" />
      </span>
    )
  }
  const Icon = ch.icon
  return (
    <span aria-hidden className={cn('grid shrink-0 place-items-center', ch.kind === 'marketplace' ? 'bg-paper-2 text-ink-3' : 'bg-surface text-primary', className)} style={{ width: size, height: size, borderRadius: size * 0.26 }}>
      <Icon size={size * 0.56} strokeWidth={1.9} />
    </span>
  )
}

/** Channel as a heading: the official wordmark when present (it already says the name), else badge + name. */
export function ChannelTitle({ id, label, height = 20, className }: { id: string; label: string; height?: number; className?: string }) {
  const ch = CHANNELS[id as ChannelId]
  if (ch?.wordmark) return <img src={ch.wordmark} alt={label} height={height} style={{ height }} className={cn('w-auto max-w-[140px] object-contain object-left', className)} />
  return <span className={cn('inline-flex items-center gap-2 whitespace-nowrap', className)}><ChannelBadge id={id} size={height + 4} />{label}</span>
}

/** Small inline label: badge + name, for chips and table cells. */
export function ChannelLabel({ id, label, size = 16, className }: { id: string; label?: string; size?: number; className?: string }) {
  const ch = CHANNELS[id as ChannelId]
  return <span className={cn('inline-flex items-center gap-1.5', className)}>{ch && <ChannelBadge id={id} size={size} />}{label ?? ch?.name ?? id}</span>
}
