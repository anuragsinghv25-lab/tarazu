import { create } from 'zustand'
import type { Campaign, CampaignStatus } from '@/engine/types'
import { DEFAULT_POLICY, GUARDS, type Guard, type Policy } from '@/engine/launch'
import { useStore } from './store'

/* Release 4 state: who is acting (maker or checker), the approval policy, every campaign's audit
   trail and versions, generated code batches and the live guardrails. Campaigns themselves stay in
   the main store, so every other screen sees status changes immediately. */

export type Role = 'maker' | 'checker'
export interface AuditEvent { at: number; who: string; what: string; from?: CampaignStatus; to?: CampaignStatus; note?: string }
export interface CodeBatch { prefix: string; count: number; seed: number; blocked: string[]; createdAt: number; label?: string }
export interface GuardEvent { at: number; campaignId: string; campaign: string; guard: Guard['id']; reason: string; action: string }

const PEOPLE: Record<Role, string> = { maker: 'You (maker)', checker: 'Approver' }

interface LaunchState {
  role: Role
  policy: Policy
  audit: Record<string, AuditEvent[]>
  versions: Record<string, Campaign[]>
  codes: Record<string, CodeBatch>
  guards: Record<Guard['id'], { on: boolean; threshold: number }>
  events: GuardEvent[]
  setRole: (r: Role) => void
  setPolicy: (p: Partial<Policy>) => void
  log: (id: string, e: Omit<AuditEvent, 'at' | 'who'> & { who?: string }) => void
  /** Save a campaign as a new version, logging what changed. */
  commit: (c: Campaign, what: string, note?: string) => void
  /** Move a campaign through the lifecycle, with an audit entry. */
  move: (c: Campaign, to: CampaignStatus, note?: string) => void
  setCodes: (id: string, b: CodeBatch | null) => void
  blockCode: (id: string, code: string) => void
  setGuard: (id: Guard['id'], g: Partial<{ on: boolean; threshold: number }>) => void
  record: (e: Omit<GuardEvent, 'at'>) => void
}

export const useLaunch = create<LaunchState>((set, get) => ({
  role: 'maker',
  policy: DEFAULT_POLICY,
  audit: {},
  versions: {},
  codes: {},
  guards: Object.fromEntries(GUARDS.map((g) => [g.id, { on: true, threshold: g.threshold }])) as LaunchState['guards'],
  events: [],
  setRole: (role) => set({ role }),
  setPolicy: (p) => set((s) => ({ policy: { ...s.policy, ...p } })),
  log: (id, e) => set((s) => ({ audit: { ...s.audit, [id]: [{ at: Date.now(), who: e.who ?? PEOPLE[s.role], ...e }, ...(s.audit[id] ?? [])] } })),
  commit: (c, what, note) => {
    const prev = get().versions[c.id] ?? []
    const v = { ...c, launch: { ...c.launch, version: prev.length + 1 } }
    useStore.getState().saveCampaign(v)
    set((s) => ({ versions: { ...s.versions, [c.id]: [...prev, v] } }))
    get().log(c.id, { what: `${what} (v${prev.length + 1})`, note })
  },
  move: (c, to, note) => {
    const from = c.status
    const next: Campaign = { ...c, status: to, startDay: to === 'live' && c.startDay > 0 ? 0 : c.startDay, endDay: to === 'ended' ? Math.min(c.endDay, 0) : c.endDay }
    useStore.getState().saveCampaign(next)
    get().log(c.id, { what: `Moved to ${to}`, from, to, note })
  },
  setCodes: (id, b) => set((s) => { const codes = { ...s.codes }; if (b) codes[id] = b; else delete codes[id]; return { codes } }),
  blockCode: (id, code) => set((s) => ({ codes: { ...s.codes, [id]: { ...s.codes[id], blocked: [...s.codes[id].blocked, code] } } })),
  setGuard: (id, g) => set((s) => ({ guards: { ...s.guards, [id]: { ...s.guards[id], ...g } } })),
  record: (e) => set((s) => ({ events: [{ ...e, at: Date.now() }, ...s.events].slice(0, 40) })),
}))

/** A believable history for campaigns that existed before this session. */
export function seededAudit(c: Campaign): AuditEvent[] {
  const day = 86400000, now = Date.now()
  const created = now + Math.min(-2, c.startDay - 3) * day
  const out: AuditEvent[] = [{ at: created, who: 'You (maker)', what: 'Created (v1)' }]
  if (c.status !== 'draft') out.unshift({ at: created + day * 0.5, who: 'Approver', what: 'Approved', from: 'review', to: 'approved' })
  if (c.status === 'live' || c.status === 'paused' || c.status === 'ended') out.unshift({ at: now + c.startDay * day, who: 'Tarazu', what: 'Went live on schedule', from: 'scheduled', to: 'live' })
  if (c.status === 'paused') out.unshift({ at: now - day * 0.3, who: 'You (maker)', what: 'Paused', from: 'live', to: 'paused' })
  return out
}
