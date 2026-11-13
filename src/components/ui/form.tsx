import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Select<T extends string>({ value, onChange, options, className, label }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string; label: string
}) {
  return (
    <span className={cn('relative inline-flex', className)}>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value as T)}
        className="w-full cursor-pointer appearance-none rounded-lg border border-rule bg-card py-1.5 pr-7 pl-2.5 text-[13px] text-ink transition-colors outline-none hover:border-ink-3/50 focus:border-brass">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-ink-3" />
    </span>
  )
}

export function NumberInput({ value, onChange, prefix, suffix, min = 0, step = 1, className, label, placeholder }: {
  value: number | undefined; onChange: (v: number | undefined) => void; prefix?: string; suffix?: string; min?: number; step?: number; className?: string; label: string; placeholder?: string
}) {
  return (
    <span className={cn('inline-flex items-center rounded-lg border border-rule bg-card px-2 py-1 text-[13px] transition-colors focus-within:border-brass hover:border-ink-3/50', className)}>
      {prefix && <span className="mr-1 text-ink-3">{prefix}</span>}
      <input aria-label={label} type="number" min={min} step={step} value={value ?? ''} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        className="num w-full min-w-0 bg-transparent text-ink outline-none placeholder:text-ink-3 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
      {suffix && <span className="ml-1 shrink-0 text-ink-3">{suffix}</span>}
    </span>
  )
}

export function TextInput({ value, onChange, className, label, placeholder, mono }: { value: string; onChange: (v: string) => void; className?: string; label: string; placeholder?: string; mono?: boolean }) {
  return (
    <input aria-label={label} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
      className={cn('rounded-lg border border-rule bg-card px-2.5 py-1.5 text-[13px] text-ink transition-colors outline-none placeholder:text-ink-3 hover:border-ink-3/50 focus:border-brass', mono && 'num uppercase', className)} />
  )
}

export function FieldRow({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="w-[112px] shrink-0 text-[12px] text-ink-3">{label}</span>
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      {hint && <div className="w-full pl-[124px] text-[11.5px] text-ink-3">{hint}</div>}
    </div>
  )
}
