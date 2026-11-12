import { Command } from 'cmdk'
import * as Dialog from '@radix-ui/react-dialog'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Grid3x3, Scale, ScanSearch, Store, Glasses, SlidersHorizontal, Zap, Package } from 'lucide-react'
import { useStore } from '@/state/store'
import { SCENARIOS } from '@/engine/scenarios'
import { skus, heroSkuId } from '@/data/meera'

export function CommandPalette() {
  const { paletteOpen, setPalette, toggleLens, setRoom, applyScenario } = useStore()
  const nav = useNavigate()
  const run = (fn: () => void) => { setPalette(false); setTimeout(fn, 10) }
  const item = 'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] text-ink-2 data-[selected=true]:bg-paper-2 data-[selected=true]:text-ink'
  const group = 'px-1 pb-1 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-ink-3 [&_[cmdk-group-heading]]:uppercase'

  return (
    <Dialog.Root open={paletteOpen} onOpenChange={setPalette}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-[14vh] left-1/2 z-50 w-[92vw] max-w-[560px] -translate-x-1/2 overflow-hidden rounded-2xl border border-rule bg-card shadow-[var(--shadow-lift)] data-[state=open]:animate-[fadeIn_.16s]">
          <Dialog.Title className="sr-only">Jump to anything</Dialog.Title>
          <Command loop>
            <Command.Input autoFocus placeholder="Jump to a screen, a product, or a scenario…" className="w-full border-b border-rule bg-transparent px-4 py-3.5 text-[15px] text-ink outline-none placeholder:text-ink-3" />
            <Command.List className="max-h-[56vh] overflow-y-auto py-2">
              <Command.Empty className="px-4 py-6 text-center text-[13px] text-ink-3">Nothing matches.</Command.Empty>
              <Command.Group heading="Screens" className={group}>
                <Command.Item className={item} onSelect={() => run(() => nav('/'))}><LayoutDashboard size={15} /> Overview</Command.Item>
                <Command.Item className={item} onSelect={() => run(() => nav('/pulse'))}><Grid3x3 size={15} /> Stock Pulse</Command.Item>
                <Command.Item className={item} onSelect={() => run(() => nav(`/sku/${heroSkuId}`))}><Scale size={15} /> The Scale</Command.Item>
                <Command.Item className={item} onSelect={() => run(() => nav('/truth'))}><ScanSearch size={15} /> Truth Lens</Command.Item>
                <Command.Item className={item} onSelect={() => run(() => nav('/compare'))}><Store size={15} /> Platform compare</Command.Item>
              </Command.Group>
              <Command.Group heading="Prototype" className={group}>
                <Command.Item className={item} onSelect={() => run(toggleLens)}><Glasses size={15} /> Toggle BA Lens</Command.Item>
                <Command.Item className={item} onSelect={() => run(() => setRoom(true))}><SlidersHorizontal size={15} /> Open Control Room</Command.Item>
                {(Object.keys(SCENARIOS) as (keyof typeof SCENARIOS)[]).map((id) => (
                  <Command.Item key={id} className={item} value={`scenario ${SCENARIOS[id].label}`} onSelect={() => run(() => applyScenario(id))}>
                    <Zap size={15} className="text-brass" /> Scenario: {SCENARIOS[id].label}
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Products" className={group}>
                {skus.map((s) => (
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
