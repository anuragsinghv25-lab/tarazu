import { create } from 'zustand'
import { toast } from 'sonner'
import type { Campaign, Controls, Knobs } from '@/engine/types'
import { portfolio, recommend } from '@/engine/engine'
import { SELLERS, SELLER_BY_ID, controlsFor, isSellerId, skuOf, type SellerId } from '@/data/sellers'
import { inrShort, pct, signed } from '@/lib/format'

type Key = keyof Knobs

/** Which widgets each control visibly changes — drives the glow and the BA Lens impact chain. */
export const AFFECTS: Record<Key, string[]> = {
  scenario: ['opportunity', 'actions', 'pulse-grid', 'scale', 'curve', 'why', 'truth', 'compare', 'calendar'],
  daysToEvent: ['event-chip', 'actions', 'calendar'],
  elasticityMult: ['curve', 'scale', 'why', 'actions', 'opportunity', 'truth', 'compare', 'ladder', 'duel', 'bundle-detail'],
  seasonality: ['pulse-grid', 'opportunity', 'scale', 'curve', 'actions', 'truth', 'ladder'],
  competitorPrice: ['pulse-grid', 'scale', 'why', 'actions', 'compare'],
  feeLevel: ['compare', 'scale', 'curve', 'opportunity', 'duel'],
  pullForward: ['truth', 'scale', 'curve', 'opportunity', 'duel', 'fatigue'],
  stockMult: ['pulse-grid', 'opportunity', 'actions', 'scale', 'why', 'ladder', 'bundles'],
  marginFloor: ['curve', 'scale', 'why', 'actions', 'receipt'],
  goal: ['actions', 'why', 'curve', 'opportunity'],
  strategy: ['truth', 'scale', 'curve', 'fatigue', 'duel', 'opportunity'],
  dataQuality: ['why', 'actions'],
}

export const CONTROL_LABEL: Record<Key, string> = {
  scenario: 'Scenario', daysToEvent: 'Days to event', elasticityMult: 'Price sensitivity',
  seasonality: 'Seasonal demand', competitorPrice: 'Competitor price', feeLevel: 'Platform fees',
  pullForward: 'Pull-forward', stockMult: 'Stock level', marginFloor: 'Margin floor', goal: 'Seller goal',
  strategy: 'Pricing strategy', dataQuality: 'Data quality',
}

export interface LogEntry { id: number; at: Date; text: string; detail: string }

function snapshot(sellerId: SellerId, c: Controls) {
  const s = SELLER_BY_ID[sellerId]
  const p = portfolio(s.skus, c)
  const hero = recommend(skuOf(s, s.heroSkuId)!, c)
  return { gain: p.gain, risky: p.counts['at-risk'] + p.counts.slow, promos: p.promos.length, heroD: hero.discount, heroName: hero.sku.line }
}

function initialSeller(): SellerId {
  try {
    const q = new URLSearchParams(window.location.search).get('seller')
    if (isSellerId(q)) return q
    const saved = window.localStorage.getItem('tarazu.seller')
    if (isSellerId(saved)) return saved
  } catch { /* storage can be unavailable */ }
  return 'meera'
}

const seedCampaigns = () => Object.fromEntries(SELLERS.map((s) => [s.id, s.campaigns.map((c) => ({ ...c }))])) as Record<SellerId, Campaign[]>

interface State {
  sellerId: SellerId
  controls: Controls
  committed: Controls
  campaigns: Record<SellerId, Campaign[]>
  lensOn: boolean
  roomOpen: boolean
  paletteOpen: boolean
  quizOpen: boolean
  pulse: { ids: string[]; n: number }
  log: LogEntry[]
  setSeller: (id: SellerId) => void
  setControl: <K extends Key>(k: K, v: Knobs[K]) => void
  commit: (k: Key) => void
  applyScenario: (id: string) => void
  reset: () => void
  saveCampaign: (c: Campaign) => void
  removeCampaign: (id: string) => void
  resetCampaigns: () => void
  flash: (ids: string[]) => void
  toggleLens: () => void
  setRoom: (o: boolean) => void
  setPalette: (o: boolean) => void
  setQuiz: (o: boolean) => void
}

let logId = 0
const first = initialSeller()

export const useStore = create<State>((set, get) => {
  const record = (keys: Key[], before: Controls, after: Controls, label: string) => {
    const id = get().sellerId
    const a = snapshot(id, before), b = snapshot(id, after)
    const bits: string[] = []
    if (Math.round(a.gain) !== Math.round(b.gain)) bits.push(`projected gain ${inrShort(a.gain)} → ${inrShort(b.gain)}`)
    if (a.heroD !== b.heroD) bits.push(`${a.heroName} offer ${pct(a.heroD)} → ${pct(b.heroD)}`)
    if (a.risky !== b.risky) bits.push(`risky SKUs ${a.risky} → ${b.risky}`)
    if (a.promos !== b.promos) bits.push(`promotions ${a.promos} → ${b.promos}`)
    const detail = bits.length ? bits.join(' · ') : 'no change to the plan'
    const entry: LogEntry = { id: ++logId, at: new Date(), text: label, detail }
    const ids = [...new Set(keys.flatMap((k) => AFFECTS[k]))]
    set((s) => ({ log: [entry, ...s.log].slice(0, 40), pulse: { ids, n: s.pulse.n + 1 } }))
    toast(label, { description: `${detail}${bits.length ? ` (${signed(b.gain - a.gain)})` : ''}` })
  }

  return {
    sellerId: first,
    controls: controlsFor(SELLER_BY_ID[first]),
    committed: controlsFor(SELLER_BY_ID[first]),
    campaigns: seedCampaigns(),
    lensOn: false,
    roomOpen: false,
    paletteOpen: false,
    quizOpen: false,
    pulse: { ids: [], n: 0 },
    log: [],
    setSeller: (id) => {
      if (id === get().sellerId) return
      const s = SELLER_BY_ID[id]
      const c = controlsFor(s)
      try { window.localStorage.setItem('tarazu.seller', id) } catch { /* ignore */ }
      set((st) => ({ sellerId: id, controls: c, committed: c, log: [{ id: ++logId, at: new Date(), text: `Viewing as ${s.name}`, detail: `${s.brand}, ${s.city} · ${s.category}` }, ...st.log].slice(0, 40) }))
      toast(`Now viewing as ${s.name}`, { description: `${s.brand}, ${s.city}` })
    },
    setControl: (k, v) => set((s) => ({ controls: { ...s.controls, [k]: v, scenario: k === 'scenario' ? (v as string) : 'custom' } })),
    commit: (k) => {
      const { committed, controls } = get()
      if (committed[k] === controls[k]) return
      set({ committed: controls })
      record([k], committed, controls, `${CONTROL_LABEL[k]} changed`)
    },
    applyScenario: (id) => {
      const s = SELLER_BY_ID[get().sellerId]
      const p = s.presets.find((x) => x.id === id)
      if (!p) return
      const before = get().controls
      const next: Controls = { ...controlsFor(s), ...p.controls, scenario: id }
      set({ controls: next, committed: next })
      record((Object.keys(p.controls) as Key[]).concat('scenario'), before, next, `Scenario: ${p.label}`)
    },
    reset: () => {
      const s = SELLER_BY_ID[get().sellerId]
      const before = get().controls
      const c = controlsFor(s)
      set({ controls: c, committed: c })
      record(['scenario'], before, c, `Reset to ${s.name}'s defaults`)
    },
    saveCampaign: (c) => set((st) => {
      const list = st.campaigns[st.sellerId]
      const next = list.some((x) => x.id === c.id) ? list.map((x) => (x.id === c.id ? c : x)) : [...list, c]
      return { campaigns: { ...st.campaigns, [st.sellerId]: next } }
    }),
    removeCampaign: (id) => set((st) => ({ campaigns: { ...st.campaigns, [st.sellerId]: st.campaigns[st.sellerId].filter((x) => x.id !== id) } })),
    resetCampaigns: () => set((st) => ({ campaigns: { ...st.campaigns, [st.sellerId]: SELLER_BY_ID[st.sellerId].campaigns.map((c) => ({ ...c })) } })),
    flash: (ids) => set((s) => ({ pulse: { ids, n: s.pulse.n + 1 } })),
    toggleLens: () => set((s) => ({ lensOn: !s.lensOn })),
    setRoom: (o) => set({ roomOpen: o }),
    setPalette: (o) => set({ paletteOpen: o }),
    setQuiz: (o) => set({ quizOpen: o }),
  }
})
