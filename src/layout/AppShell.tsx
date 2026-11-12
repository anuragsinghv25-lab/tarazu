import { useEffect, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import {
  LayoutDashboard, Grid3x3, Scale, ScanSearch, Store, Workflow, ShoppingCart, CalendarDays, Gift, Crown,
  Sparkles, PlayCircle, BookOpen, ChevronDown, Search, SlidersHorizontal, Glasses, Check,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Kbd, Switch } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { useStore } from '@/state/store'
import { seller, heroSkuId } from '@/data/meera'
import { cn } from '@/lib/cn'

const NAV = [
  { section: 'Decide', items: [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/pulse', label: 'Stock Pulse', icon: Grid3x3 },
    { to: `/sku/${heroSkuId}`, label: 'The Scale', icon: Scale, match: '/sku' },
    { to: '/truth', label: 'Truth Lens', icon: ScanSearch },
    { to: '/compare', label: 'Platform compare', icon: Store },
  ] },
  { section: 'Run · Release 2', soon: true, items: [
    { label: 'Campaign builder', icon: Workflow }, { label: 'Cart Sandbox', icon: ShoppingCart },
    { label: 'Season plan', icon: CalendarDays }, { label: 'Bundles', icon: Gift }, { label: 'Loyalty', icon: Crown },
  ] },
  { section: 'Think · Release 3', soon: true, items: [
    { label: 'Ask Tarazu', icon: Sparkles }, { label: 'Story mode', icon: PlayCircle }, { label: 'Case Study', icon: BookOpen },
  ] },
] as const

const SELLERS = [
  { id: 'meera', name: 'Meera', biz: 'Ayurvedic skincare · Jaipur', live: true },
  { id: 'farhan', name: 'Farhan', biz: 'Sarees, marketplace-only · Surat', live: false },
  { id: 'kabir', name: 'Kabir', biz: 'Mobile accessories · Delhi', live: false },
  { id: 'anaya', name: 'Anaya', biz: 'Snacks brand, Brand mode · Indore', live: false },
]

function Sidebar() {
  const { pathname } = useLocation()
  return (
    <aside className="sticky top-0 hidden h-screen w-[244px] shrink-0 flex-col border-r border-rule bg-paper/80 px-4 py-5 backdrop-blur lg:flex">
      <Logo />
      <nav className="mt-8 flex-1 space-y-6 overflow-y-auto">
        {NAV.map((g) => (
          <div key={g.section}>
            <div className="mb-1.5 px-2.5 text-[10.5px] font-semibold tracking-[0.14em] text-ink-3 uppercase">{g.section}</div>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const Icon = it.icon
                if (!('to' in it)) {
                  return (
                    <li key={it.label} className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13.5px] text-ink-3/70" title="Coming in a later release">
                      <Icon size={16} strokeWidth={1.75} /> {it.label}
                    </li>
                  )
                }
                const active = 'match' in it ? pathname.startsWith(it.match) : pathname === it.to
                return (
                  <li key={it.to}>
                    <NavLink to={it.to} className={cn('group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13.5px] transition-colors', active ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-paper-2 hover:text-ink')}>
                      <Icon size={16} strokeWidth={1.75} className={active ? 'text-brass-2' : ''} /> {it.label}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="rounded-xl border border-dashed border-rule p-3 text-[11.5px] leading-snug text-ink-3">
        Prototype · Release 1 of 3. All data is fictional; fees are illustrative.
      </div>
    </aside>
  )
}

function SellerSwitcher() {
  return (
    <Spot id="seller-switcher">
      <Dropdown.Root>
        <Dropdown.Trigger className="flex items-center gap-2.5 rounded-full border border-rule bg-card py-1 pr-3 pl-1 text-left transition-colors hover:border-ink-3/40">
          <span className="display grid h-7 w-7 place-items-center rounded-full bg-brass-soft text-[14px] text-[#7a5414]">M</span>
          <span className="leading-tight">
            <span className="block text-[13px] font-medium text-ink">{seller.name} · {seller.brand}</span>
            <span className="block text-[11px] text-ink-3">{seller.category}</span>
          </span>
          <ChevronDown size={14} className="text-ink-3" />
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content align="start" sideOffset={8} className="z-50 w-[300px] rounded-2xl border border-rule bg-card p-1.5 shadow-[var(--shadow-lift)]">
            <div className="px-2.5 pt-1.5 pb-2 text-[10.5px] font-semibold tracking-[0.14em] text-ink-3 uppercase">Viewing as</div>
            {SELLERS.map((s) => (
              <Dropdown.Item key={s.id} disabled={!s.live} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-55 data-[highlighted]:bg-paper-2">
                <span className="display grid h-8 w-8 place-items-center rounded-full bg-paper-2 text-[15px] text-ink-2">{s.name[0]}</span>
                <span className="flex-1 leading-tight">
                  <span className="block text-[13px] font-medium text-ink">{s.name}</span>
                  <span className="block text-[11.5px] text-ink-3">{s.biz}</span>
                </span>
                {s.live ? <Check size={15} className="text-brass" /> : <span className="text-[10.5px] text-ink-3">Release 2</span>}
              </Dropdown.Item>
            ))}
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
    </Spot>
  )
}

function EventChip() {
  const days = useStore((s) => s.controls.daysToEvent)
  const urgent = days <= 14
  return (
    <Spot id="event-chip" className="hidden md:block">
      <div className={cn('flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px]', urgent ? 'border-loss/25 bg-loss-soft text-loss' : 'border-rule bg-card text-ink-2')}>
        <span className={cn('h-1.5 w-1.5 rounded-full', urgent ? 'bg-loss animate-pulse' : 'bg-brass')} />
        {seller.event} in <span className="num font-semibold">{days}</span> days
      </div>
    </Spot>
  )
}

function Header() {
  const { lensOn, toggleLens, setRoom, setPalette } = useStore()
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/85 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-2.5 md:px-8">
        <div className="lg:hidden"><Logo /></div>
        <div className="hidden sm:block"><SellerSwitcher /></div>
        <EventChip />
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setPalette(true)} className="hidden items-center gap-2 rounded-full border border-rule bg-card px-3 py-1.5 text-[12.5px] text-ink-3 transition-colors hover:text-ink md:flex">
            <Search size={14} /> Jump to anything <Kbd>⌘K</Kbd>
          </button>
          <label className={cn('flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors', lensOn ? 'border-brass/40 bg-brass-soft text-[#6b4a12]' : 'border-rule bg-card text-ink-2')}>
            <Glasses size={15} /> <span className="hidden sm:inline">BA Lens</span>
            <Switch checked={lensOn} onChange={toggleLens} label="BA Lens" />
            <span className="hidden md:inline"><Kbd>B</Kbd></span>
          </label>
          <button onClick={() => setRoom(true)} className="flex items-center gap-2 rounded-full bg-ink px-3.5 py-1.5 text-[12.5px] font-medium text-paper shadow-sm transition-transform hover:-translate-y-px">
            <SlidersHorizontal size={14} className="text-brass-2" /> <span className="hidden sm:inline">Control Room</span>
            <span className="hidden md:inline-flex"><kbd className="num rounded-[5px] border border-paper/20 px-1.5 text-[10.5px] text-paper/60">C</kbd></span>
          </button>
        </div>
      </div>
      <MobileNav />
    </header>
  )
}

function MobileNav() {
  const items = NAV[0].items
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end className={({ isActive }) => cn('shrink-0 rounded-full px-3 py-1 text-[12.5px]', isActive ? 'bg-ink text-paper' : 'text-ink-2')}>
          {it.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { toggleLens, setRoom, setPalette } = useStore()
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, [contenteditable], [role="slider"]')) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(true) }
      else if (e.metaKey || e.ctrlKey || e.altKey) return
      else if (e.key.toLowerCase() === 'b') toggleLens()
      else if (e.key.toLowerCase() === 'c') setRoom(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleLens, setRoom, setPalette])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Header />
        <main className="mx-auto max-w-[1240px] px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  )
}
