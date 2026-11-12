import { create } from 'zustand'
import { toast } from 'sonner'
import type { Controls, ScenarioId } from '@/engine/types'
import { DEFAULT_CONTROLS, SCENARIOS } from '@/engine/scenarios'
import { portfolio, recommend } from '@/engine/engine'
import { skus, getSku, heroSkuId } from '@/data/meera'
import { inrShort, pct, signed } from '@/lib/format'

type Key = keyof Controls

/** Which widgets each control visibly changes — drives the glow and the BA Lens impact chain. */
export const AFFECTS: Record<Key, string[]> = {
  scenario: ['opportunity', 'actions', 'pulse-grid', 'scale', 'curve', 'why', 'truth', 'compare'],
  daysToEvent: ['event-chip', 'actions'],
  elasticityMult: ['curve', 'scale', 'why', 'actions', 'opportunity', 'truth', 'compare'],
  seasonality: ['pulse-grid', 'opportunity', 'scale', 'curve', 'actions', 'truth'],
  competitorPrice: ['pulse-grid', 'scale', 'why', 'actions', 'compare'],
  feeLevel: ['compare', 'scale', 'curve', 'opportunity'],
  pullForward: ['truth', 'scale', 'curve', 'opportunity'],
  stockMult: ['pulse-grid', 'opportunity', 'actions', 'scale', 'why'],
  marginFloor: ['curve', 'scale', 'why', 'actions'],
  goal: ['actions', 'why', 'curve', 'opportunity'],
}

export const CONTROL_LABEL: Record<Key, string> = {
  scenario: 'Scenario', daysToEvent: 'Days to sale event', elasticityMult: 'Price sensitivity',
  seasonality: 'Seasonal demand', competitorPrice: 'Competitor price', feeLevel: 'Platform fees',
  pullForward: 'Pull-forward', stockMult: 'Stock level', marginFloor: 'Margin floor', goal: 'Seller goal',
}

export interface LogEntry { id: number; at: Date; text: string; detail: string }

function snapshot(c: Controls) {
  const p = portfolio(skus, c)
  const hero = recommend(getSku(heroSkuId)!, c)
  return { gain: p.gain, risky: p.counts['at-risk'] + p.counts.slow, promos: p.promos.length, heroD: hero.discount, heroNet: hero.result.net }
}

interface State {
  controls: Controls
  committed: Controls
  lensOn: boolean
  roomOpen: boolean
  paletteOpen: boolean
  pulse: { ids: string[]; n: number }
  log: LogEntry[]
  setControl: <K extends Key>(k: K, v: Controls[K]) => void
  commit: (k: Key) => void
  applyScenario: (id: Exclude<ScenarioId, 'custom'>) => void
  reset: () => void
  toggleLens: () => void
  setRoom: (o: boolean) => void
  setPalette: (o: boolean) => void
}

let logId = 0

export const useStore = create<State>((set, get) => {
  const record = (keys: Key[], before: Controls, after: Controls, label: string) => {
    const a = snapshot(before), b = snapshot(after)
    const bits: string[] = []
    if (Math.round(a.gain) !== Math.round(b.gain)) bits.push(`projected gain ${inrShort(a.gain)} → ${inrShort(b.gain)}`)
    if (a.heroD !== b.heroD) bits.push(`Vitamin C serum markdown ${pct(a.heroD)} → ${pct(b.heroD)}`)
    if (a.risky !== b.risky) bits.push(`risky SKUs ${a.risky} → ${b.risky}`)
    if (a.promos !== b.promos) bits.push(`promotions ${a.promos} → ${b.promos}`)
    const detail = bits.length ? bits.join(' · ') : 'no change to the plan'
    const entry: LogEntry = { id: ++logId, at: new Date(), text: label, detail }
    const ids = [...new Set(keys.flatMap((k) => AFFECTS[k]))]
    set((s) => ({ log: [entry, ...s.log].slice(0, 40), pulse: { ids, n: s.pulse.n + 1 } }))
    toast(label, { description: `${detail}${bits.length ? ` (${signed(b.gain - a.gain)})` : ''}` })
  }

  return {
    controls: DEFAULT_CONTROLS,
    committed: DEFAULT_CONTROLS,
    lensOn: false,
    roomOpen: false,
    paletteOpen: false,
    pulse: { ids: [], n: 0 },
    log: [],
    setControl: (k, v) => set((s) => ({ controls: { ...s.controls, [k]: v, scenario: k === 'scenario' ? (v as ScenarioId) : 'custom' } })),
    commit: (k) => {
      const { committed, controls } = get()
      if (committed[k] === controls[k]) return
      set({ committed: controls })
      record([k], committed, controls, `${CONTROL_LABEL[k]} changed`)
    },
    applyScenario: (id) => {
      const before = get().controls
      const next: Controls = { ...before, ...SCENARIOS[id].controls, scenario: id }
      set({ controls: next, committed: next })
      record(Object.keys(SCENARIOS[id].controls) as Key[], before, next, `Scenario: ${SCENARIOS[id].label}`)
    },
    reset: () => {
      const before = get().controls
      set({ controls: DEFAULT_CONTROLS, committed: DEFAULT_CONTROLS })
      record(['scenario'], before, DEFAULT_CONTROLS, 'Reset to Big Billion Days defaults')
    },
    toggleLens: () => set((s) => ({ lensOn: !s.lensOn })),
    setRoom: (o) => set({ roomOpen: o }),
    setPalette: (o) => set({ paletteOpen: o }),
  }
})
