import * as RSlider from '@radix-ui/react-slider'
import * as RSwitch from '@radix-ui/react-switch'
import NumberFlow from '@number-flow/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-[var(--radius-card)] border border-rule bg-card shadow-[var(--shadow-card)]', className)} {...rest}>
      {children}
    </div>
  )
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3', className)}>{children}</div>
}

export function PageHeader({ eyebrow, title, children, aside }: { eyebrow: string; title: ReactNode; children?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="display mt-1.5 text-[34px] leading-[1.05] font-[420] text-ink md:text-[42px]">{title}</h1>
        {children && <p className="mt-2.5 text-[15px] leading-relaxed text-ink-2">{children}</p>}
      </div>
      {aside}
    </div>
  )
}

type Tone = 'ink' | 'gain' | 'loss' | 'warn' | 'brass' | 'quiet'
const TONES: Record<Tone, string> = {
  ink: 'bg-primary text-paper border-primary',
  gain: 'bg-gain-soft text-gain border-gain/20',
  loss: 'bg-loss-soft text-loss border-loss/20',
  warn: 'bg-warn-soft text-[#92400e] border-warn/25',
  brass: 'bg-brass-soft text-[#92400e] border-brass/25',
  quiet: 'bg-paper-2 text-ink-2 border-rule',
}
export function Chip({ tone = 'quiet', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-medium whitespace-nowrap', TONES[tone], className)}>{children}</span>
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="num rounded-[5px] border border-rule bg-paper px-1.5 py-px text-[10.5px] text-ink-3">{children}</kbd>
}

/** Animated rupee figure in Indian units: ₹6.8 L, ₹38.4 K. */
export function Money({ value, className, signed = false, digits = 1 }: { value: number; className?: string; signed?: boolean; digits?: number }) {
  const a = Math.abs(value)
  const [v, unit] = a >= 1e7 ? [a / 1e7, ' Cr'] : a >= 1e5 ? [a / 1e5, ' L'] : a >= 1e3 ? [a / 1e3, ' K'] : [a, '']
  const sign = value < 0 ? '−' : signed && value > 0 ? '+' : ''
  return (
    <NumberFlow
      className={cn('tnum', className)}
      value={v}
      prefix={`${sign}₹`}
      suffix={unit}
      format={{ maximumFractionDigits: unit ? digits : 0, minimumFractionDigits: unit ? digits : 0 }}
      locales="en-IN"
    />
  )
}

export function Count({ value, className, suffix, digits = 0 }: { value: number; className?: string; suffix?: string; digits?: number }) {
  return <NumberFlow className={cn('num', className)} value={value} suffix={suffix} format={{ maximumFractionDigits: digits, minimumFractionDigits: digits }} locales="en-IN" />
}

export function Slider({ value, min, max, step, onChange, onCommit, className, label }: {
  value: number; min: number; max: number; step: number; onChange: (v: number) => void; onCommit?: (v: number) => void; className?: string; label: string
}) {
  return (
    <RSlider.Root
      className={cn('relative flex h-6 w-full touch-none items-center select-none', className)}
      value={[value]} min={min} max={max} step={step}
      onValueChange={(v) => onChange(v[0])}
      onValueCommit={(v) => onCommit?.(v[0])}
      aria-label={label}
    >
      <RSlider.Track className="relative h-[5px] grow overflow-hidden rounded-full bg-paper-2 shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]">
        <RSlider.Range className="absolute h-full rounded-full bg-gradient-to-r from-brass to-brass-2" />
      </RSlider.Track>
      <RSlider.Thumb className="block h-[18px] w-[18px] cursor-grab rounded-full border-[2.5px] border-brass-2 bg-primary shadow-[0_2px_8px_rgba(11,61,46,0.35)] transition-transform hover:scale-110 active:cursor-grabbing active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brass-2/30" />
    </RSlider.Root>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <RSwitch.Root
      checked={checked} onCheckedChange={onChange} aria-label={label}
      className="relative h-[20px] w-[36px] shrink-0 rounded-full bg-rule transition-colors data-[state=checked]:bg-brass"
    >
      <RSwitch.Thumb className="block h-[16px] w-[16px] translate-x-[2px] rounded-full bg-card shadow transition-transform data-[state=checked]:translate-x-[18px]" />
    </RSwitch.Root>
  )
}

export function Segmented<T extends string | number>({ value, options, onChange, className, size = 'md' }: {
  value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; className?: string; size?: 'sm' | 'md'
}) {
  return (
    <div className={cn('inline-flex rounded-full border border-rule bg-paper-2/70 p-0.5', className)} role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o.value)} role="radio" aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-full font-medium transition-all',
            size === 'sm' ? 'px-2.5 py-0.5 text-[11.5px]' : 'px-3 py-1 text-[12.5px]',
            o.value === value ? 'bg-primary text-paper shadow-sm' : 'text-ink-2 hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export const HEALTH_META = {
  'at-risk': { label: 'At risk', tone: 'loss' as Tone, color: '#c2421c', soft: '#f9e0d4', speed: '1.1s' },
  slow: { label: 'Slow mover', tone: 'warn' as Tone, color: '#d97706', soft: '#fcebc7', speed: '2.2s' },
  healthy: { label: 'Healthy', tone: 'quiet' as Tone, color: '#7a8580', soft: '#f6ecd9', speed: '0s' },
  fast: { label: 'Fast mover', tone: 'gain' as Tone, color: '#1e7b4f', soft: '#e7f3ec', speed: '0s' },
}
