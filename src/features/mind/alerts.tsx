import { useMemo } from 'react'
import { Segmented } from '@/components/ui'
import { scan } from '@/ai/watch'
import { useMind, type Autonomy } from '@/state/mind'
import { useSeller } from '@/state/hooks'
import { useCtx } from './shared'

export const AUTONOMY: Record<Autonomy, { label: string; note: string }> = {
  suggest: { label: 'Suggest only', note: 'Tarazu flags and explains. You make every change yourself.' },
  ask: { label: 'Ask before acting', note: 'Tarazu prepares each change; one tap from you puts it live.' },
  act: { label: 'Act within guardrails', note: 'Tarazu applies safe changes itself and tells you, with undo. Anything outside the guardrails still waits for you.' },
}

/** Alerts for the current seller with their status. Shared by the page and the header bell. */
export function useAlerts() {
  const seller = useSeller()
  const x = useCtx()
  const g = useMind((s) => s.guardrails)
  const status = useMind((s) => s.alerts)
  const list = useMemo(() => scan(x, g), [x, g])
  return list.map((a) => ({ ...a, key: `${seller.id}:${a.id}`, status: status[`${seller.id}:${a.id}`] ?? 'open' }))
}

export function AutonomyDial({ compact }: { compact?: boolean }) {
  const { autonomy, setAutonomy } = useMind()
  return (
    <div>
      <Segmented<Autonomy> size="sm" value={autonomy} onChange={setAutonomy} className={compact ? '' : 'w-full'}
        options={[{ value: 'suggest', label: 'Suggest' }, { value: 'ask', label: 'Ask first' }, { value: 'act', label: 'Act' }]} />
      {!compact && <p className="mt-2 text-[12px] leading-snug text-ink-3">{AUTONOMY[autonomy].note}</p>}
    </div>
  )
}

