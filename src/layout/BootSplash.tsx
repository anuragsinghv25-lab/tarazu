import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BarChart3, Check, Layers, Tag } from 'lucide-react'
import { TarazuMark } from '@/brand/TarazuLogo'
import { SellerMark } from '@/brand/sellers'
import { useSeller } from '@/state/hooks'
import { useStore } from '@/state/store'

/* The Tarazu loading screen. index.html paints a static copy (same classes, styles inlined there)
   the instant the page opens; this component takes it over without a visible change and drives it
   with real work: loading every screen's code, waiting for the brand fonts, then letting the first
   screen render behind it. The scale swings while work is pending and settles level when done.
   The full sequence plays once per browser session; later loads just fade the static splash out. */

const KEY = 'tarazu.booted'
const STEPS = [
  { label: 'Analysing promotions', icon: Tag },
  { label: 'Accounting for all costs', icon: Layers },
  { label: 'Estimating real impact', icon: BarChart3 },
]
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
const seen = () => { try { return !!sessionStorage.getItem(KEY) } catch { return false } }

export function BootSplash({ preload }: { preload: (() => Promise<unknown>)[] }) {
  const seller = useSeller()
  const campaigns = useStore((s) => s.campaigns[seller.id]?.length ?? seller.campaigns.length)
  const quick = useRef(seen())
  const [progress, setProgress] = useState(quick.current ? 100 : 6)
  const [step, setStep] = useState(quick.current ? 3 : 0)
  const [closing, setClosing] = useState(false)
  const [gone, setGone] = useState(false)

  // Take over from the static splash in index.html (same markup, so nothing jumps).
  useLayoutEffect(() => { document.getElementById('boot')?.remove() }, [])

  useEffect(() => {
    let live = true
    const finish = async () => {
      await wait(quick.current ? 60 : 380)
      if (!live) return
      setClosing(true)
      try { sessionStorage.setItem(KEY, '1') } catch { /* private mode: replay next time */ }
      await wait(480)
      if (live) setGone(true)
    }
    if (quick.current) { finish(); return () => { live = false } }

    const run = async () => {
      const t0 = performance.now()
      const floor = (ms: number) => wait(Math.max(0, ms - (performance.now() - t0)))
      // 1 · fetch every screen's code so navigation after this is instant
      let loaded = 0
      await Promise.race([
        Promise.all(preload.map((p) => p().catch(() => undefined).then(() => { loaded++; if (live) setProgress(6 + (loaded / preload.length) * 34) }))),
        wait(5000),
      ])
      await floor(520)
      if (!live) return
      setStep(1); setProgress((p) => Math.max(p, 44))
      // 2 · brand fonts, so numbers render in their final widths
      await Promise.race([document.fonts?.ready ?? Promise.resolve(), wait(2500)])
      await floor(1000)
      if (!live) return
      setStep(2); setProgress(76)
      // 3 · let the first screen compute and paint behind the splash
      await frame()
      await new Promise((r) => ('requestIdleCallback' in window ? window.requestIdleCallback(r, { timeout: 800 }) : setTimeout(r, 120)))
      await floor(1500)
      if (!live) return
      setStep(3); setProgress(100)
      finish()
    }
    run()
    return () => { live = false }
  }, [preload])

  if (gone) return null
  const isAnaya = seller.id === 'anaya'
  const messages = [
    `Analysing ${seller.skus.length} products and ${campaigns} live promotions…`,
    isAnaya ? 'Accounting for trade margins, deductions and returns…' : `Accounting for ${Object.keys(seller.market.channels).length} channels' fees, returns and cannibalisation…`,
    `Estimating what ${seller.history.label.split(' · ')[0]} really earned…`,
    `Balanced. Opening ${seller.brand}.`,
  ]
  const amp = step >= 3 ? 0 : 6 - step * 1.6

  return (
    <div className={`boot${closing ? ' is-done' : ''}`} role="status" aria-live="polite" aria-busy={step < 3}>
      <div className="boot-inner">
        <svg className="boot-halo" viewBox="0 0 360 260" aria-hidden><defs><radialGradient id="bh2" cx="50%" cy="45%" r="50%"><stop offset="0" stopColor="#f59e0b" stopOpacity=".16" /><stop offset="1" stopColor="#f59e0b" stopOpacity="0" /></radialGradient></defs><circle cx="180" cy="120" r="120" fill="url(#bh2)" /><path d="M40 210 A150 150 0 0 1 120 40" fill="none" stroke="#0b3d2e" strokeOpacity=".12" strokeWidth="2" strokeLinecap="round" /><path d="M320 210 A150 150 0 0 0 240 40" fill="none" stroke="#0b3d2e" strokeOpacity=".12" strokeWidth="2" strokeLinecap="round" /><path d="M60 228 A170 170 0 0 1 150 28" fill="none" stroke="#f59e0b" strokeOpacity=".25" strokeWidth="1.5" strokeLinecap="round" /><path d="M300 228 A170 170 0 0 0 210 28" fill="none" stroke="#f59e0b" strokeOpacity=".25" strokeWidth="1.5" strokeLinecap="round" /></svg>
        <div className="boot-mark" style={{ ['--tz-amp' as string]: amp }}><TarazuMark swing size={132} /></div>
        <div className="boot-word">Tarazu</div>
        <div className="boot-tag">Promotion Intelligence for Sellers</div>
        <div className="boot-seller"><SellerMark id={seller.id} size={22} /> Preparing {seller.brand} for {seller.name}</div>
        <div className="boot-bar" role="progressbar" aria-label="Loading Tarazu" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{ width: `${progress}%` }} /></div>
        <div className="boot-msg">{messages[Math.min(step, 3)]}</div>
        <ol className="boot-steps" aria-hidden>
          {STEPS.map((s, i) => {
            const Icon = i < step ? Check : s.icon
            return (
              <li key={s.label} className={i < step ? 'is-done' : i === step ? 'is-active' : ''}>
                <span className="ico"><Icon size={19} strokeWidth={1.8} /></span>
                {s.label}
              </li>
            )
          })}
        </ol>
      </div>
      <svg className="boot-waves" viewBox="0 0 1440 150" preserveAspectRatio="none" aria-hidden><path d="M0 70 C240 20 420 40 640 66 C900 96 1120 30 1440 52 V150 H0Z" fill="#0b3d2e" fillOpacity=".14" /><path d="M0 96 C260 58 520 64 760 90 C1000 116 1220 70 1440 84 V150 H0Z" fill="#0b3d2e" /><path d="M0 96 C260 58 520 64 760 90 C1000 116 1220 70 1440 84" fill="none" stroke="#f59e0b" strokeWidth="2.5" /><path d="M0 124 C300 104 560 112 820 128 C1060 142 1260 118 1440 122 V150 H0Z" fill="#062a1f" fillOpacity=".55" /></svg>
    </div>
  )
}
