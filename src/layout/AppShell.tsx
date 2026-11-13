import { useEffect, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import {
  LayoutDashboard, Grid3x3, Scale, ScanSearch, Store, Workflow, ShoppingCart, CalendarDays, Gift, Crown, Building2,
  Sparkles, PlayCircle, BookOpen, ChevronDown, Search, SlidersHorizontal, Glasses, Check, Users, Wand2, Radar, FileText, PenLine, Bell, Moon, Sun, Rocket, KanbanSquare, KeyRound, FlaskConical, Megaphone, Handshake, MessagesSquare, Target, Coins, Network, Repeat, TestTubes,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { SellerMark } from '@/brand/sellers'
import { useMind } from '@/state/mind'
import { useAlerts } from '@/features/mind/alerts'
import { Kbd, Switch } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { useStore } from '@/state/store'
import { useCampaigns, useSeller } from '@/state/hooks'
import { SELLERS, type SellerDef } from '@/data/sellers'
import { cn } from '@/lib/cn'

type Item = { to?: string; label: string; icon: typeof LayoutDashboard; match?: string; badge?: string; alert?: boolean; run?: () => void }

function useNav(): { section: string; soon?: boolean; items: Item[] }[] {
  const seller = useSeller()
  const alerts = useAlerts().filter((a) => a.status === 'open').length
  const startStory = useMind((s) => s.startStory)
  const inReview = useCampaigns().filter((k) => k.status === 'review').length
  return [
    { section: 'Decide', items: [
      { to: '/', label: 'Overview', icon: LayoutDashboard },
      { to: '/pulse', label: 'Stock Pulse', icon: Grid3x3 },
      { to: `/sku/${seller.heroSkuId}`, label: 'The Scale', icon: Scale, match: '/sku' },
      { to: '/truth', label: 'Truth Lens', icon: ScanSearch },
      { to: '/compare', label: 'Platform compare', icon: Store },
    ] },
    { section: 'Run', items: [
      { to: '/campaigns', label: 'Campaign builder', icon: Workflow },
      { to: '/sandbox', label: 'Cart Sandbox', icon: ShoppingCart },
      { to: '/plan', label: 'Season plan', icon: CalendarDays },
      { to: '/bundles', label: 'Bundles', icon: Gift },
      { to: '/loyalty', label: 'Loyalty', icon: Crown, badge: seller.ownChannel ? undefined : 'locked' },
      { to: '/brand', label: 'Brand mode', icon: Building2, badge: seller.id === 'anaya' ? undefined : 'Anaya' },
    ] },
    { section: 'Launch', items: [
      { to: '/launch', label: 'Launch flow', icon: Rocket },
      { to: '/lifecycle', label: 'Lifecycle', icon: KanbanSquare, badge: inReview ? String(inReview) : undefined },
      { to: '/codes', label: 'Code studio', icon: KeyRound },
      { to: '/storefront', label: 'Shopper preview', icon: Store },
      { to: '/edge-cases', label: 'Edge-case lab', icon: FlaskConical },
    ] },
    { section: 'Reach', items: [
      { to: '/creators', label: 'Creator hub', icon: Megaphone },
      { to: '/affiliates', label: 'Affiliates & referrals', icon: Handshake },
      { to: '/community', label: 'Community', icon: MessagesSquare },
    ] },
    { section: 'Edge', items: [
      { to: '/uplift', label: 'Uplift targeting', icon: Target },
      { to: '/ads-vs-discount', label: 'Ads vs discount', icon: Coins },
      { to: '/ondc', label: 'ONDC channel', icon: Network },
      { to: '/commitments', label: 'Subscribe & pre-order', icon: Repeat },
      { to: '/experiments', label: 'Experiments', icon: TestTubes },
    ] },
    { section: 'Think', items: [
      { to: '/ask', label: 'Ask Tarazu', icon: Sparkles },
      { to: '/brief', label: 'Brief to plan', icon: Wand2 },
      { to: '/watchtower', label: 'Watchtower', icon: Radar, badge: alerts ? String(alerts) : undefined, alert: true },
      { to: '/debrief', label: 'Sale debrief', icon: FileText },
      { to: '/copy', label: 'Offer copy', icon: PenLine },
    ] },
    { section: 'Explore', items: [
      { to: '/sellers', label: 'Demo sellers', icon: Users },
      { label: 'Story mode', icon: PlayCircle, run: startStory },
      { to: '/case-study', label: 'Case Study', icon: BookOpen },
    ] },
  ]
}

function Sidebar() {
  const { pathname } = useLocation()
  const nav = useNav()
  return (
    <aside className="sticky top-0 hidden h-screen w-[244px] shrink-0 flex-col border-r border-rule bg-paper/80 px-4 py-5 backdrop-blur lg:flex">
      <Logo />
      <nav aria-label="Main" className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 pb-4 [mask-image:linear-gradient(to_bottom,black_calc(100%-28px),transparent)]">
        {nav.map((g) => (
          <div key={g.section}>
            <div className="mb-1 px-2.5 text-[10.5px] font-semibold tracking-[0.14em] text-ink-3 uppercase">{g.section}</div>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const Icon = it.icon
                if (!it.to) {
                  return (
                    <li key={it.label}>
                      <button onClick={it.run} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[5px] text-left text-[13px] text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink">
                        <Icon size={16} strokeWidth={1.75} /> <span className="flex-1">{it.label}</span><span className="text-[10px] text-ink-3">▶</span>
                      </button>
                    </li>
                  )
                }
                const active = it.match ? pathname.startsWith(it.match) : pathname === it.to
                return (
                  <li key={it.label}>
                    <NavLink to={it.to} className={cn('group flex items-center gap-2.5 rounded-lg px-2.5 py-[5px] text-[13px] transition-colors', active ? 'bg-primary text-paper' : 'text-ink-2 hover:bg-paper-2 hover:text-ink')}>
                      <Icon size={16} strokeWidth={1.75} className={active ? 'text-brass-2' : ''} />
                      <span className="flex-1">{it.label}</span>
                      {it.badge && <span className={cn('rounded-full px-1.5 py-px text-[9.5px] font-medium', it.alert ? 'num bg-loss text-white' : active ? 'bg-paper/15 text-paper/70' : 'bg-paper-2 text-ink-3')}>{it.badge}</span>}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="mt-2 rounded-lg border border-dashed border-rule px-2.5 py-2 text-[10.5px] leading-snug text-ink-3" title="All sellers, brands and data are fictional; fees are illustrative; the AI is scripted on engine numbers.">
        Prototype · Release 6 of 6 · fictional sellers and data
      </div>
    </aside>
  )
}

/** A seller's avatar is their brand mark on its soft tile (see src/brand/sellers). */
export function Avatar({ s, size = 28 }: { s: SellerDef; size?: number }) {
  return <SellerMark id={s.id} size={size} />
}

function SellerSwitcher() {
  const seller = useSeller()
  const { setSeller, setQuiz } = useStore()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const pick = (s: SellerDef) => {
    setSeller(s.id)
    if (pathname.startsWith('/sku')) nav(`/sku/${s.heroSkuId}`)
  }
  return (
    <Spot id="seller-switcher">
      <Dropdown.Root>
        <Dropdown.Trigger className="flex items-center gap-2.5 rounded-full border border-rule bg-card py-1 pr-3 pl-1 text-left transition-colors hover:border-ink-3/40">
          <Avatar s={seller} />
          <span className="leading-tight">
            <span className="block text-[13px] font-medium text-ink">{seller.name} · {seller.brand}</span>
            <span className="block max-w-[180px] truncate text-[11px] text-ink-3">{seller.category}</span>
          </span>
          <ChevronDown size={14} className="text-ink-3" />
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content align="start" sideOffset={8} className="z-50 w-[330px] rounded-2xl border border-rule bg-card p-1.5 shadow-[var(--shadow-lift)]">
            <div className="px-2.5 pt-1.5 pb-2 text-[10.5px] font-semibold tracking-[0.14em] text-ink-3 uppercase">Viewing as</div>
            {SELLERS.map((s) => (
              <Dropdown.Item key={s.id} onSelect={() => pick(s)} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 outline-none data-[highlighted]:bg-paper-2">
                <Avatar s={s} size={32} />
                <span className="flex-1 leading-tight">
                  <span className="block text-[13px] font-medium text-ink">{s.name} · {s.brand}</span>
                  <span className="block text-[11.5px] text-ink-3">{s.category}, {s.city}</span>
                </span>
                {s.id === seller.id && <Check size={15} className="text-brass" />}
              </Dropdown.Item>
            ))}
            <Dropdown.Separator className="my-1 h-px bg-rule" />
            <Dropdown.Item onSelect={() => setQuiz(true)} className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] text-ink-2 outline-none data-[highlighted]:bg-paper-2 data-[highlighted]:text-ink">
              <Wand2 size={15} className="text-brass" /> Which seller are you? Find the closest match
            </Dropdown.Item>
            <Dropdown.Item onSelect={() => nav('/sellers')} className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] text-ink-2 outline-none data-[highlighted]:bg-paper-2 data-[highlighted]:text-ink">
              <Users size={15} className="text-brass" /> Compare all four sellers
            </Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
    </Spot>
  )
}

function EventChip() {
  const days = useStore((s) => s.controls.daysToEvent)
  const seller = useSeller()
  const urgent = days <= 14
  return (
    <Spot id="event-chip" className="hidden xl:block">
      <div className={cn('flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] whitespace-nowrap', urgent ? 'border-loss/25 bg-loss-soft text-loss' : 'border-rule bg-card text-ink-2')}>
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
        <div className="lg:hidden"><Logo compact /></div>
        <div className="hidden sm:block"><SellerSwitcher /></div>
        <EventChip />
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setPalette(true)} className="hidden items-center gap-2 rounded-full border border-rule bg-card px-3 py-1.5 text-[12.5px] text-ink-3 transition-colors hover:text-ink md:flex">
            <Search size={14} /> <span className="hidden whitespace-nowrap 2xl:inline">Jump to anything</span> <Kbd>⌘K</Kbd>
          </button>
          <HeaderBell />
          <ThemeToggle />
          <label className={cn('flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors', lensOn ? 'border-brass/40 bg-brass-soft text-[var(--color-brass-ink)]' : 'border-rule bg-card text-ink-2')}>
            <Glasses size={15} /> <span className="hidden whitespace-nowrap xl:inline">BA Lens</span>
            <Switch checked={lensOn} onChange={toggleLens} label="BA Lens" />
            <span className="hidden md:inline"><Kbd>B</Kbd></span>
          </label>
          <button onClick={() => setRoom(true)} className="flex items-center gap-2 rounded-full bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-paper shadow-sm transition-transform hover:-translate-y-px">
            <SlidersHorizontal size={14} className="text-brass-2" /> <span className="hidden whitespace-nowrap sm:inline">Control Room</span>
            <span className="hidden md:inline-flex"><kbd className="num rounded-[5px] border border-paper/20 px-1.5 text-[10.5px] text-paper/60">C</kbd></span>
          </button>
        </div>
      </div>
      <MobileNav />
    </header>
  )
}

function HeaderBell() {
  const open = useAlerts().filter((a) => a.status === 'open')
  const urgent = open.some((a) => a.severity === 'urgent')
  return (
    <NavLink to="/watchtower" aria-label={`Watchtower: ${open.length} open alerts`} className="relative grid h-[34px] w-[34px] place-items-center rounded-full border border-rule bg-card text-ink-2 transition-colors hover:text-ink">
      <Bell size={15} />
      {open.length > 0 && <span className={cn('num absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9.5px] font-semibold text-white', urgent ? 'bg-loss' : 'bg-warn')}>{open.length}</span>}
    </NavLink>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useMind()
  const dark = theme === 'dark'
  return (
    <button onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={dark ? 'Switch to light mode' : 'Switch to night market (dark) mode'} title={dark ? 'Light mode' : 'Night market mode'}
      className="grid h-[34px] w-[34px] place-items-center rounded-full border border-rule bg-card text-ink-2 transition-colors hover:text-ink">
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}

function MobileNav() {
  const nav = useNav()
  const items = nav.flatMap((g) => g.items).filter((it) => it.to)
  const { pathname } = useLocation()
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden">
      <div className="shrink-0 sm:hidden"><MobileSeller /></div>
      {items.map((it) => {
        const active = it.match ? pathname.startsWith(it.match) : pathname === it.to
        return (
          <NavLink key={it.label} to={it.to!} className={cn('shrink-0 rounded-full px-3 py-1 text-[12.5px]', active ? 'bg-primary text-paper' : 'text-ink-2')}>
            {it.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

function MobileSeller() {
  const seller = useSeller()
  const setQuiz = useStore((s) => s.setQuiz)
  return (
    <button onClick={() => setQuiz(true)} className="flex items-center gap-1.5 rounded-full border border-rule bg-card py-0.5 pr-2.5 pl-0.5 text-[12px] text-ink">
      <Avatar s={seller} size={22} /> {seller.name}
    </button>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { toggleLens, setRoom, setPalette } = useStore()
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable], [role="slider"]')) return
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
