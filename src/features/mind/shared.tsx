import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cpu, Sparkles } from 'lucide-react'
import { makeCtx } from '@/ai/context'
import type { Change, Patch } from '@/ai/watch'
import { useCampaigns, useControls, useSeller } from '@/state/hooks'
import { useStore } from '@/state/store'
import { useMind } from '@/state/mind'
import { cn } from '@/lib/cn'

/** The AI's view of the current seller: engine results for the live controls and campaigns. */
export function useCtx() {
  const seller = useSeller(), c = useControls(), campaigns = useCampaigns()
  return useMemo(() => makeCtx(seller, c, campaigns), [seller, c, campaigns])
}

/** Navigate to a screen and point at an element on it. */
export function useGo() {
  const nav = useNavigate()
  const setFocus = useMind((s) => s.setFocus)
  return (to: string, focus?: string) => {
    nav(to)
    if (focus) {
      setFocus(null)
      setTimeout(() => setFocus(focus), 350)
      setTimeout(() => { if (useMind.getState().focus === focus) setFocus(null) }, 5200)
    }
  }
}

/** Apply a Watchtower or plan change to the seller's campaigns. Returns an undo. */
export function useApply() {
  const { saveCampaign, removeCampaign } = useStore()
  return (changes: (Change | Patch)[]) => {
    const before = useStore.getState().campaigns[useStore.getState().sellerId]
    const undo: (() => void)[] = []
    for (const ch of changes) {
      if (ch.kind === 'create') { saveCampaign(ch.campaign); undo.push(() => removeCampaign(ch.campaign.id)) }
      else {
        const prev = before.find((k) => k.id === ch.id)
        if (!prev) continue
        saveCampaign({ ...prev, ...ch.patch })
        undo.push(() => saveCampaign(prev))
      }
    }
    return () => undo.reverse().forEach((u) => u())
  }
}

/** Minimal markdown: **bold** only, which is all the AI layer writes. */
export function Rich({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return <span className={className}>{parts.map((p, i) => p.startsWith('**') ? <b key={i} className="font-semibold text-ink">{p.slice(2, -2)}</b> : <Fragment key={i}>{p}</Fragment>)}</span>
}

const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false } }

/** Streams text word by word, like a model replying. Instant when motion is reduced or `instant`. */
export function Typewriter({ text, instant, speed = 22, onDone, className }: { text: string; instant?: boolean; speed?: number; onDone?: () => void; className?: string }) {
  const words = useMemo(() => text.split(/(\s+)/), [text])
  const [n, setN] = useState(instant || reduced() ? words.length : 0)
  useEffect(() => {
    if (n >= words.length) { onDone?.(); return }
    const t = setTimeout(() => setN((x) => Math.min(words.length, x + 2)), speed)
    return () => clearTimeout(t)
  }, [n, words.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const shown = words.slice(0, n).join('')
  // Close an unterminated **bold** while streaming.
  const safe = (shown.match(/\*\*/g)?.length ?? 0) % 2 ? `${shown}**` : shown
  return <span className={className} aria-live="polite"><Rich text={safe} />{n < words.length && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-brass-2" />}</span>
}

/** Honest labelling: what is computed vs what is written. */
export function AiByline({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-3', className)}>
      <span className="flex items-center gap-1"><Cpu size={11} /> Numbers: Tarazu engine</span>
      <span className="flex items-center gap-1"><Sparkles size={11} /> Words: scripted AI in this prototype</span>
    </div>
  )
}

/** A short "thinking" trace that ticks through the engine steps before an answer appears. */
export function Thinking({ steps, onDone }: { steps: string[]; onDone: () => void }) {
  const [i, setI] = useState(reduced() ? steps.length : 0)
  useEffect(() => {
    if (i >= steps.length) { const t = setTimeout(onDone, 120); return () => clearTimeout(t) }
    const t = setTimeout(() => setI((x) => x + 1), 380)
    return () => clearTimeout(t)
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <ul className="space-y-1 text-[12px] text-ink-3">
      {steps.slice(0, Math.max(1, i + 1)).map((s, k) => (
        <li key={s} className="flex items-center gap-2">
          <span className={cn('h-1.5 w-1.5 rounded-full', k < i ? 'bg-gain' : 'animate-pulse bg-brass-2')} />{s}
        </li>
      ))}
    </ul>
  )
}

export function Section({ title, children, className }: { title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-ink-3 uppercase">{title}</div>
      {children}
    </section>
  )
}
