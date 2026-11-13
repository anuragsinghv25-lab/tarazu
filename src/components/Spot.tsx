import { useEffect, useRef, useState, type ReactNode } from 'react'
import * as HoverCard from '@radix-ui/react-hover-card'
import { annotate } from 'rough-notation'
import { useStore, AFFECTS, CONTROL_LABEL } from '@/state/store'
import { LENS } from '@/content/lens'
import { cn } from '@/lib/cn'

const AFFECTED_BY: Record<string, string[]> = {}
for (const [k, ids] of Object.entries(AFFECTS)) for (const id of ids) (AFFECTED_BY[id] ??= []).push(CONTROL_LABEL[k as keyof typeof CONTROL_LABEL])

/**
 * Wraps any element that should
 *  - glow when a Control Room change affects it, and
 *  - explain itself when the BA Lens is on (hand-drawn box + hover card).
 */
export function Spot({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const lensOn = useStore((s) => s.lensOn)
  const pulse = useStore((s) => s.pulse)
  const [glow, setGlow] = useState(0)
  const note = LENS[id]

  useEffect(() => {
    if (pulse.n && pulse.ids.includes(id)) setGlow((g) => g + 1)
  }, [pulse.n]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!lensOn || !note || !ref.current) return
    const a = annotate(ref.current, { type: 'box', color: '#b07d2b', padding: 5, strokeWidth: 1.4, animationDuration: 700, iterations: 1 })
    const t = setTimeout(() => a.show(), 60)
    return () => { clearTimeout(t); a.remove() }
  }, [lensOn, note])

  const body = (
    <div ref={ref} className={cn('relative rounded-[var(--radius-card)]', className)} data-spot={id}>
      {children}
      {glow > 0 && <span key={glow} aria-hidden className="pointer-events-none absolute inset-0 animate-glow rounded-[inherit]" />}
      {lensOn && note && (
        <span aria-hidden className="pointer-events-none absolute -top-2 -right-2 z-20 grid h-5 w-5 place-items-center">
          <span className="absolute inset-0 animate-marker rounded-full bg-brass-2/50" />
          <span className="display relative grid h-4 w-4 place-items-center rounded-full bg-brass text-[10px] font-semibold text-card italic">i</span>
        </span>
      )}
    </div>
  )

  if (!lensOn || !note) return body
  const by = AFFECTED_BY[id]
  return (
    <HoverCard.Root openDelay={250} closeDelay={80}>
      <HoverCard.Trigger asChild>{body}</HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content side="top" align="start" sideOffset={10} collisionPadding={16}
          className="z-50 w-[340px] origin-[var(--radix-hover-card-content-transform-origin)] rounded-2xl border border-rule bg-card p-4 shadow-[var(--shadow-lift)] data-[state=open]:animate-[fadeIn_.18s_ease-out]">
          <div className="flex items-start justify-between gap-3">
            <div className="display text-[19px] leading-tight text-ink">{note.title}</div>
            <span className="rounded-full border border-brass/30 bg-brass-soft px-2 py-0.5 text-[10.5px] font-semibold tracking-wide text-[#7a5414] uppercase">{note.scope}-have</span>
          </div>
          <dl className="mt-3 space-y-2.5 text-[12.5px] leading-snug">
            <Row k="Pain point">{note.pain}</Row>
            <Row k="User story">{note.story}</Row>
            {note.rule && <Row k="Business rule">{note.rule}</Row>}
            <Row k="KPI">{note.kpi}</Row>
            {note.design && <Row k="Design call">{note.design}</Row>}
          </dl>
          {by && (
            <div className="mt-3 border-t border-dashed border-rule pt-2.5 text-[11.5px] text-ink-3">
              <span className="font-medium text-ink-2">Changes when you move:</span> {by.join(' · ')}
            </div>
          )}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[86px_1fr] gap-2">
      <dt className="text-[10.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase pt-px">{k}</dt>
      <dd className="text-ink-2">{children}</dd>
    </div>
  )
}
