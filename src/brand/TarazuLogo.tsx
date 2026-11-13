import { GEOMETRY as G, toneColors, VIEWBOX, type MarkTone } from './mark'
import { cn } from '@/lib/cn'

/** The Tarazu balance-scale mark. `swing` animates the beam and pans (used by the loader);
 *  `--tz-amp` (degrees) on any ancestor sets how far it swings. */
export function TarazuMark({ size = 32, tone = 'brand', simple, swing, className, title }: { size?: number; tone?: MarkTone; simple?: boolean; swing?: boolean; className?: string; title?: string }) {
  const base = toneColors(tone)
  // In the app the brand tone reads the theme tokens, so the mark turns mint on the night theme.
  const c = tone === 'brand' ? { ...base, structure: 'var(--color-primary)', knock: 'var(--color-paper)' } : base
  const sw = simple ? 3.6 : 2.4
  const line = { fill: 'none', stroke: c.structure, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg width={size} height={(size * 104) / 120} viewBox={VIEWBOX} className={cn('shrink-0', swing && 'tz-swing', className)} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <path d={G.spark} fill={c.spark} className={swing ? 'tz-spark' : undefined} />
      {!simple && <>
        <path d={G.arcLeft} fill="none" stroke={c.spark} strokeWidth={2.6} strokeLinecap="round" />
        <path d={G.arcRight} fill="none" stroke={c.spark} strokeWidth={2.6} strokeLinecap="round" />
      </>}
      <rect x={G.post.x} y={G.post.y} width={G.post.w} height={G.post.h} rx={G.post.rx} fill={c.structure} />
      <path d={G.base} fill={c.structure} />
      <g className={swing ? 'tz-pan-l' : undefined}>
        <path d={G.leftStrings} {...line} />
        <path d={G.leftPan} fill={c.pan} />
        {!simple && <g transform={G.tag.transform}><path d={G.tag.d} fill={c.glyph} /><circle {...G.tag.hole} fill={c.knock} /></g>}
      </g>
      <g className={swing ? 'tz-pan-r' : undefined}>
        <path d={G.rightStrings} {...line} />
        <path d={G.rightPan} fill={c.pan} />
        {!simple && G.bars.map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={0.8} fill={c.glyph} />)}
      </g>
      <rect x={G.beam.x} y={G.beam.y} width={G.beam.w} height={G.beam.h} rx={G.beam.rx} fill={c.structure} className={swing ? 'tz-beam' : undefined} />
      <circle cx={G.finial.cx} cy={G.finial.cy} r={G.finial.r} fill={c.structure} />
    </svg>
  )
}

/** "Tarazu" set in the brand weight, with the amber underline swash from the primary logo. */
export function Wordmark({ size = 22, tone = 'brand', swash = false, className }: { size?: number; tone?: 'brand' | 'onDark'; swash?: boolean; className?: string }) {
  return (
    <span className={cn('relative inline-block font-sans leading-none font-bold tracking-[-0.035em]', tone === 'onDark' ? 'text-white' : 'text-primary', className)} style={{ fontSize: size }}>
      Tarazu
      {swash && <svg className="absolute -bottom-[0.32em] left-[8%] w-[92%]" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden><path d="M2 5 Q50 -1.5 98 3" fill="none" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" /></svg>}
    </span>
  )
}

export const TAGLINE = 'Promotion intelligence for sellers'

/** Horizontal lockup: mark, rule, wordmark and tagline (sidebar, headers). */
export function TarazuLogo({ compact = false, rule = false, tone = 'brand', className }: { compact?: boolean; rule?: boolean; tone?: 'brand' | 'onDark'; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <TarazuMark size={compact ? 30 : 36} tone={tone === 'onDark' ? 'onDark' : 'brand'} title="Tarazu" />
      {!compact && rule && <span aria-hidden className={cn('h-8 w-px', tone === 'onDark' ? 'bg-white/20' : 'bg-rule')} />}
      <span className="leading-none">
        <Wordmark size={compact ? 19 : 23} tone={tone} />
        {!compact && <span className={cn('mt-1 block text-[10px] tracking-[0.01em] whitespace-nowrap', tone === 'onDark' ? 'text-white/60' : 'text-ink-3')}>{TAGLINE}</span>}
      </span>
    </span>
  )
}

/** The rounded app icon, for places that show Tarazu as an app (about cards, the loader on small screens). */
export function AppIcon({ size = 48, tone = 'dark' }: { size?: number; tone?: 'dark' | 'light' }) {
  return (
    <span className={cn('grid shrink-0 place-items-center', tone === 'dark' ? 'bg-primary' : 'border border-rule bg-paper')} style={{ width: size, height: size, borderRadius: size * 0.22 }}>
      <TarazuMark size={size * 0.74} tone={tone === 'dark' ? 'onDark' : 'brand'} />
    </span>
  )
}
