import { create } from 'zustand'
import type { SellerId } from '@/data/sellers'

/* Release 3 state: the AI layer, story mode and theme. Kept apart from the engine store so the
   engine's controls and campaigns stay the single source of numbers. */

export type Autonomy = 'suggest' | 'ask' | 'act'
export type AlertStatus = 'open' | 'approved' | 'dismissed' | 'auto' | 'snoozed'
export type Theme = 'light' | 'dark'

export interface ChatTurn { id: number; role: 'user' | 'ai'; text: string; at: number }

export interface Guardrails { maxMarkdown: number; maxSpend: number; protectBestsellers: boolean }

const read = <T,>(k: string, fallback: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback } catch { return fallback } }
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* storage unavailable */ } }

function initialTheme(): Theme {
  const saved = read<Theme | null>('tarazu.theme', null)
  if (saved) return saved
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' } catch { return 'light' }
}

interface MindState {
  autonomy: Autonomy
  guardrails: Guardrails
  alerts: Record<string, AlertStatus>
  /** What Tarazu did on its own (autonomy = act), newest first. */
  actions: { id: string; at: number; text: string; undo?: () => void }[]
  chats: Record<SellerId, ChatTurn[]>
  story: { on: boolean; step: number }
  focus: string | null
  theme: Theme
  setAutonomy: (a: Autonomy) => void
  setGuardrails: (g: Partial<Guardrails>) => void
  setAlert: (id: string, s: AlertStatus) => void
  logAction: (a: { id: string; text: string; undo?: () => void }) => void
  clearAction: (id: string) => void
  say: (seller: SellerId, role: ChatTurn['role'], text: string) => void
  clearChat: (seller: SellerId) => void
  startStory: () => void
  setStep: (n: number) => void
  endStory: () => void
  setFocus: (id: string | null) => void
  setTheme: (t: Theme) => void
}

let turn = 0

export const useMind = create<MindState>((set) => ({
  autonomy: read<Autonomy>('tarazu.autonomy', 'ask'),
  guardrails: read<Guardrails>('tarazu.guardrails', { maxMarkdown: 0.3, maxSpend: 15000, protectBestsellers: true }),
  alerts: {},
  actions: [],
  chats: { meera: [], farhan: [], kabir: [], anaya: [] },
  story: { on: false, step: 0 },
  focus: null,
  theme: initialTheme(),
  setAutonomy: (a) => { write('tarazu.autonomy', a); set({ autonomy: a }) },
  setGuardrails: (g) => set((s) => { const next = { ...s.guardrails, ...g }; write('tarazu.guardrails', next); return { guardrails: next } }),
  setAlert: (id, st) => set((s) => ({ alerts: { ...s.alerts, [id]: st } })),
  logAction: (a) => set((s) => ({ actions: [{ ...a, at: Date.now() }, ...s.actions.filter((x) => x.id !== a.id)].slice(0, 30) })),
  clearAction: (id) => set((s) => ({ actions: s.actions.filter((x) => x.id !== id) })),
  say: (seller, role, text) => set((s) => ({ chats: { ...s.chats, [seller]: [...s.chats[seller], { id: ++turn, role, text, at: Date.now() }] } })),
  clearChat: (seller) => set((s) => ({ chats: { ...s.chats, [seller]: [] } })),
  startStory: () => set({ story: { on: true, step: 0 } }),
  setStep: (n) => set((s) => ({ story: { ...s.story, step: n } })),
  endStory: () => set({ story: { on: false, step: 0 }, focus: null }),
  setFocus: (id) => set({ focus: id }),
  setTheme: (t) => { write('tarazu.theme', t); document.documentElement.dataset.theme = t; set({ theme: t }) },
}))

// Apply the theme before first render (index.html also does this inline to avoid a flash).
try { document.documentElement.dataset.theme = useMind.getState().theme } catch { /* SSR-safe */ }
