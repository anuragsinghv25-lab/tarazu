import { Command } from 'cmdk'
import * as Dialog from '@radix-ui/react-dialog'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Grid3x3, Scale, ScanSearch, Store, Glasses, SlidersHorizontal, Zap, Package, Workflow, ShoppingCart,
  CalendarDays, Gift, Crown, Building2, Users, Wand2, Sparkles, Radar, FileText, PenLine, BookOpen, PlayCircle, Moon,
} from 'lucide-react'
import { useState } from 'react'
import { useMind } from '@/state/mind'
import { useStore } from '@/state/store'
import { useSeller } from '@/state/hooks'
import { SELLERS } from '@/data/sellers'
import { Avatar } from './AppShell'

const SCREENS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/pulse', label: 'Stock Pulse', icon: Grid3x3 },
  { to: '/truth', label: 'Truth Lens', icon: ScanSearch },
  { to: '/compare', label: 'Platform compare', icon: Store },
  { to: '/campaigns', label: 'Campaign builder', icon: Workflow },
  { to: '/sandbox', label: 'Cart Sandbox', icon: ShoppingCart },
  { to: '/plan', label: 'Season plan, clearance and scenario duel', icon: CalendarDays },
  { to: '/bundles', label: 'Bundle Matchmaker', icon: Gift },
  { to: '/loyalty', label: 'Loyalty, referrals and win-back', icon: Crown },
  { to: '/brand', label: 'Brand mode: trade spend and gross-to-net', icon: Building2 },
  { to: '/sellers', label: 'Demo sellers and coverage', icon: Users },
  { to: '/ask', label: 'Ask Tarazu', icon: Sparkles },
  { to: '/brief', label: 'Brief to plan', icon: Wand2 },
  { to: '/watchtower', label: 'Watchtower alerts and autonomy', icon: Radar },
  { to: '/debrief', label: 'Sale debrief', icon: FileText },
  { to: '/copy', label: 'Offer copy studio', icon: PenLine },
  { to: '/case-study', label: 'Case Study', icon: BookOpen },
]

export function CommandPalette() {
  const { paletteOpen, setPalette, toggleLens, setRoom, applyScenario, setSeller, setQuiz } = useStore()
  const seller = useSeller()
  const nav = useNavigate()
  const run = (fn: () => void) => { setPalette(false); setTimeout(fn, 10) }
  const [q, setQ] = useState('')
  const { startStory, theme, setTheme } = useMind()
  const item = 'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] text-ink-2 data-[selected=true]:bg-paper-2 data-[selected=true]:text-ink'
  const group = 'px-1 pb-1 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-ink-3 [&_[cmdk-group-heading]]:uppercase'

  return (
    <Dialog.Root open={paletteOpen} onOpenChange={setPalette}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-[14vh] left-1/2 z-50 w-[92vw] max-w-[580px] -translate-x-1/2 overflow-hidden rounded-2xl border border-rule bg-card shadow-[var(--shadow-lift)] data-[state=open]:animate-[fadeIn_.16s]">
          <Dialog.Title className="sr-only">Jump to anything</Dialog.Title>
          <Command loop>
            <Command.Input autoFocus value={q} onValueChange={setQ} placeholder="Jump anywhere, or ask Tarazu a question…" className="w-full border-b border-rule bg-transparent px-4 py-3.5 text-[15px] text-ink outline-none placeholder:text-ink-3" />
            <Command.List className="max-h-[56vh] overflow-y-auto py-2">
              <Command.Empty className="px-4 py-6 text-center text-[13px] text-ink-3">Nothing matches.</Command.Empty>
              {q.trim().length > 3 && (
                <Command.Group heading="Ask" className={group}>
                  <Command.Item value={`ask ${q}`} className={item} onSelect={() => run(() => { nav(`/ask?q=${encodeURIComponent(q)}`); setQ('') })}><Sparkles size={15} className="text-brass" /> Ask Tarazu: “{q}”</Command.Item>
                </Command.Group>
              )}
              <Command.Group heading="Screens" className={group}>
                {SCREENS.slice(0, 2).map((s) => <Command.Item key={s.to} className={item} onSelect={() => run(() => nav(s.to))}><s.icon size={15} /> {s.label}</Command.Item>)}
                <Command.Item className={item} onSelect={() => run(() => nav(`/sku/${seller.heroSkuId}`))}><Scale size={15} /> The Scale</Command.Item>
                {SCREENS.slice(2).map((s) => <Command.Item key={s.to} className={item} onSelect={() => run(() => nav(s.to))}><s.icon size={15} /> {s.label}</Command.Item>)}
              </Command.Group>
              <Command.Group heading="View as seller" className={group}>
                {SELLERS.map((s) => (
                  <Command.Item key={s.id} className={item} value={`seller ${s.name} ${s.brand} ${s.category}`} onSelect={() => run(() => setSeller(s.id))}>
                    <Avatar s={s} size={20} /> <span className="flex-1">{s.name} · {s.brand}</span><span className="text-[11.5px] text-ink-3">{s.city}</span>
                  </Command.Item>
                ))}
                <Command.Item className={item} onSelect={() => run(() => setQuiz(true))}><Wand2 size={15} className="text-brass" /> Which seller are you?</Command.Item>
              </Command.Group>
              <Command.Group heading="Prototype" className={group}>
                <Command.Item className={item} onSelect={() => run(toggleLens)}><Glasses size={15} /> Toggle BA Lens</Command.Item>
                <Command.Item className={item} onSelect={() => run(() => setRoom(true))}><SlidersHorizontal size={15} /> Open Control Room</Command.Item>
                <Command.Item className={item} onSelect={() => run(startStory)}><PlayCircle size={15} /> Play story mode</Command.Item>
                <Command.Item className={item} onSelect={() => run(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}><Moon size={15} /> {theme === 'dark' ? 'Light mode' : 'Night market (dark) mode'}</Command.Item>
                {seller.presets.map((p) => (
                  <Command.Item key={p.id} className={item} value={`scenario ${p.label}`} onSelect={() => run(() => applyScenario(p.id))}>
                    <Zap size={15} className="text-brass" /> Scenario: {p.label}
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading={`${seller.name}'s products`} className={group}>
                {seller.skus.map((s) => (
                  <Command.Item key={s.id} className={item} value={`${s.name} ${s.category}`} onSelect={() => run(() => nav(`/sku/${s.id}`))}>
                    <Package size={15} /> <span className="flex-1">{s.name}</span><span className="text-[11.5px] text-ink-3">{s.category}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
