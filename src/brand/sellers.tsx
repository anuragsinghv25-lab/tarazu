/* Demo seller identities. All four businesses are fictional; their marks are original drawings.
   Each identity has a mark, a two-line wordmark, a descriptor and a small colour set, and is used
   wherever a seller appears: switcher, palette, quiz, seller cards, receipts and Brand mode. */
import type { SellerId } from '@/data/sellers/types'
import { cn } from '@/lib/cn'

export interface SellerBrand {
  id: SellerId
  name: string
  /** Wordmark lines as set in the logo. */
  lines: [string, string?]
  descriptor: string
  font: 'display' | 'sans'
  color: { ink: string; primary: string; accent: string; soft: string; tint: string }
}

export const SELLER_BRANDS: Record<SellerId, SellerBrand> = {
  meera: {
    id: 'meera', name: 'Saanjh Botanicals', lines: ['Saanjh', 'Botanicals'], descriptor: 'Ayurvedic skincare', font: 'display',
    color: { ink: '#1f4a2b', primary: '#2f6b3a', accent: '#8db255', soft: '#eef4e2', tint: '#f6f9ef' },
  },
  farhan: {
    id: 'farhan', name: 'Rangreza Weaves', lines: ['Rangreza', 'Weaves'], descriptor: 'Ethnic fashion', font: 'display',
    color: { ink: '#5e1a2c', primary: '#7a1f35', accent: '#c0603f', soft: '#fbe9e4', tint: '#fdf4f1' },
  },
  kabir: {
    id: 'kabir', name: 'VoltLane', lines: ['VoltLane'], descriptor: 'Phone accessories', font: 'sans',
    color: { ink: '#13294b', primary: '#13294b', accent: '#2f7fe8', soft: '#e6effb', tint: '#f3f7fd' },
  },
  anaya: {
    id: 'anaya', name: 'Malwa Bites', lines: ['Malwa', 'Bites'], descriptor: 'Snacks & beverages', font: 'display',
    color: { ink: '#5b2a12', primary: '#b85c1a', accent: '#f0912f', soft: '#fdeedd', tint: '#fef7ee' },
  },
}

/** Saanjh: two leaves on one stem, the evening (saanjh) herb garden. */
function SaanjhMark({ b }: { b: SellerBrand }) {
  return (
    <>
      <path d="M23 43 C22 31 26 17 40 6 C43.5 21 37 35 23 43Z" fill={b.color.primary} />
      <path d="M21.5 42 C13 38.5 7 29 9 17.5 C19.5 21 24 31 21.5 42Z" fill={b.color.accent} />
      <path d="M23.5 42 C25 32 29.5 21 37 11" fill="none" stroke={b.color.soft} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M21 40 C18.5 33 14.5 26.5 11 21.5" fill="none" stroke={b.color.soft} strokeWidth="1.1" strokeLinecap="round" opacity=".85" />
    </>
  )
}

/** Rangreza (the dyer): a bandhani lattice, nine tied diamonds with a dye dot each. */
function RangrezaMark({ b }: { b: SellerBrand }) {
  const cells = []
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const cx = 12 + i * 12, cy = 12 + j * 12, on = (i + j) % 2 === 0
    cells.push(
      <g key={`${i}-${j}`} transform={`translate(${cx} ${cy}) rotate(45)`}>
        <rect x="-4.6" y="-4.6" width="9.2" height="9.2" rx="1.4" fill={on ? b.color.primary : b.color.accent} />
        <circle r="1.25" fill={b.color.soft} />
      </g>,
    )
  }
  return <>{cells}</>
}

/** VoltLane: a bolt with a speed lane. */
function VoltMark({ b }: { b: SellerBrand }) {
  return (
    <>
      <path d="M29.5 3 L10 27 H22.5 L18 45 L38.5 19.5 H26 Z" fill={b.color.primary} strokeLinejoin="round" stroke={b.color.primary} strokeWidth="1.2" />
      <path d="M4 33 H11 M2 38.5 H9" stroke={b.color.accent} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M29.5 3 L22.5 17.5 H31" fill="none" stroke={b.color.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
    </>
  )
}

/** Malwa Bites: a samosa, crimped edge and all. */
function MalwaMark({ b }: { b: SellerBrand }) {
  return (
    <>
      <path d="M24 6.5 L42 38 Q43.2 41.5 39.5 41.5 H8.5 Q4.8 41.5 6 38 Z" fill={b.color.accent} stroke={b.color.accent} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 8.5 L17.5 40.5" stroke={b.color.primary} strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
      <path d="M7.5 38.6 Q9.5 36.2 11.5 38.6 Q13.5 36.2 15.5 38.6 Q17.5 36.2 19.5 38.6 Q21.5 36.2 23.5 38.6 Q25.5 36.2 27.5 38.6 Q29.5 36.2 31.5 38.6 Q33.5 36.2 35.5 38.6 Q37.5 36.2 39.5 38.6" fill="none" stroke={b.color.primary} strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
      <circle cx="27.5" cy="25" r="1.3" fill={b.color.primary} opacity=".5" /><circle cx="31.5" cy="31" r="1.1" fill={b.color.primary} opacity=".45" /><circle cx="24" cy="31.5" r="1" fill={b.color.primary} opacity=".4" />
    </>
  )
}

const MARKS: Record<SellerId, (p: { b: SellerBrand }) => React.ReactElement> = { meera: SaanjhMark, farhan: RangrezaMark, kabir: VoltMark, anaya: MalwaMark }

/** The seller's mark. `framed` puts it on its soft tile (the seller's avatar everywhere in the app). */
export function SellerMark({ id, size = 28, framed = true, className }: { id: SellerId; size?: number; framed?: boolean; className?: string }) {
  const b = SELLER_BRANDS[id]
  const M = MARKS[id]
  const svg = (
    <svg viewBox="0 0 48 48" width={framed ? size * 0.72 : size} height={framed ? size * 0.72 : size} aria-hidden>
      <M b={b} />
    </svg>
  )
  if (!framed) return <span className={cn('inline-grid shrink-0', className)} role="img" aria-label={b.name}>{svg}</span>
  return (
    <span role="img" aria-label={b.name} className={cn('grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size, borderRadius: Math.max(6, size * 0.28), background: b.color.soft, boxShadow: `inset 0 0 0 1px ${b.color.primary}1f` }}>
      {svg}
    </span>
  )
}

/** Mark + wordmark, as on the seller's own packaging. */
export function SellerLogo({ id, size = 'md', descriptor = false, className }: { id: SellerId; size?: 'sm' | 'md' | 'lg'; descriptor?: boolean; className?: string }) {
  const b = SELLER_BRANDS[id]
  const s = { sm: { mark: 26, text: 14 }, md: { mark: 36, text: 18 }, lg: { mark: 50, text: 24 } }[size]
  const twoLine = b.lines.length > 1 && size !== 'sm'
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <SellerMark id={id} size={s.mark} framed={false} />
      <span className="leading-none">
        <span className={cn('block', b.font === 'display' ? 'font-display font-semibold tracking-[-0.02em]' : 'font-sans font-bold tracking-[-0.04em]')} style={{ color: b.color.ink, fontSize: s.text, lineHeight: twoLine ? 0.98 : 1 }}>
          {twoLine ? <>{b.lines[0]}<br />{b.lines[1]}</> : b.name}
        </span>
        {descriptor && <span className="mt-1.5 block text-[9.5px] font-medium tracking-[0.16em] uppercase" style={{ color: b.color.ink, opacity: 0.7 }}>{b.descriptor}</span>}
      </span>
    </span>
  )
}

export const sellerBrand = (id: SellerId) => SELLER_BRANDS[id]
