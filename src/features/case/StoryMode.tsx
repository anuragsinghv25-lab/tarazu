import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { TarazuMark } from '@/brand/TarazuLogo'
import { recommend } from '@/engine/engine'
import { useMind } from '@/state/mind'
import { useControls, usePortfolio, useSeller, useTruth } from '@/state/hooks'
import { inrShort, pct } from '@/lib/format'
import { channelCompare } from '@/ai/context'
import { useCtx } from '@/features/mind/shared'
import { cn } from '@/lib/cn'

/* Story mode: a guided 3-minute walk through the product on the current seller's data.
   Each step opens a screen, points at one element and says why it matters, in numbers. */

interface Step { to: string; spot: string; kicker: string; title: string; body: string }

function useSteps(): Step[] {
  const s = useSeller(), c = useControls(), p = usePortfolio(), t = useTruth(), x = useCtx()
  return useMemo(() => {
    const hero = s.skus.find((k) => k.id === s.heroSkuId)!
    const rec = recommend(hero, c)
    const best = channelCompare(x, hero, rec.discount || 0.15)[0]
    const up = t.promoUnits / Math.max(1, t.baseUnits) - 1
    return [
      { to: '/', spot: 'opportunity', kicker: 'The problem', title: `${inrShort(p.stuck)} stuck, ${s.event} in ${c.daysToEvent} days`, body: `${s.name} runs ${s.brand} in ${s.city}. ${s.problem}` },
      { to: '/pulse', spot: 'pulse-grid', kicker: 'See it', title: `${p.counts['at-risk'] + p.counts.slow} products need attention`, body: 'Every product is a tile, coloured by risk. The ones that won\'t sell in time breathe faster. Nobody has to read a spreadsheet to find them.' },
      { to: '/truth', spot: 'truth-peel', kicker: 'The trap', title: `${s.history.label.split(' · ')[0]}: units up ${pct(up)}, profit ${inrShort(t.net)}`, body: 'The blanket sale looked like a win. Peeled apart, most of it was discount handed to buyers who would have paid full price, sales stolen from other products and next month\'s sales pulled forward.' },
      { to: `/sku/${hero.id}`, spot: 'scale', kicker: 'Decide', title: rec.discount ? `${hero.line}: ${pct(rec.discount)} is the sweet spot` : `${hero.line}: leave it at full price`, body: `The Scale weighs what a discount gives away against what it earns. ${rec.cliff ? `Past ${pct(rec.cliff)} it starts losing money.` : 'Drag the slider and watch the beam tip.'}` },
      { to: '/compare', spot: 'compare-cards', kicker: 'Where to run it', title: `${best.label} earns most on this deal`, body: 'The same offer earns very differently on each channel once commission, deal fees, shipping and each channel\'s buyers are counted.' },
      { to: '/plan', spot: 'calendar', kicker: 'The plan', title: `${p.promos.length} targeted offers, ${p.holds} products at full price`, body: 'The season plan puts every recommended offer on the calendar around the sale event, with clearance ladders for stock that must go.' },
      { to: '/watchtower', spot: 'alerts', kicker: 'Keep watch', title: 'The AI flags what needs a decision', body: 'Aged stock, a rival\'s price cut, a leaking code, a budget burning too fast. Each alert has the money at stake and one action. The autonomy dial sets how much Tarazu does on its own.' },
      { to: '/', spot: 'opportunity', kicker: 'The outcome', title: `${inrShort(t.planNet)} instead of ${inrShort(t.net)}`, body: `On the same event, Tarazu's targeted plan beats the blanket sale by ${inrShort(t.planNet - t.net)}, and frees ${inrShort(p.freed)} of cash for new stock.` },
    ]
  }, [s, c, p, t, x])
}

export function StoryMode() {
  const { story, setStep, endStory, setFocus } = useMind()
  const steps = useSteps()
  const nav = useNavigate()
  const step = steps[Math.min(story.step, steps.length - 1)]

  useEffect(() => {
    if (!story.on) return
    nav(step.to)
    setFocus(null)
    const t = setTimeout(() => setFocus(step.spot), 450)
    return () => clearTimeout(t)
  }, [story.on, story.step]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!story.on) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') setStep(Math.max(0, story.step - 1))
      else if (e.key === 'Escape') endStory()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => (story.step >= steps.length - 1 ? endStory() : setStep(story.step + 1))

  return (
    <AnimatePresence>
      {story.on && (
        <motion.div role="dialog" aria-label="Story mode" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-[560px] rounded-2xl border border-rule bg-card p-4 shadow-[var(--shadow-lift)] md:bottom-6">
          <div className="flex items-center gap-2">
            <TarazuMark size={22} />
            <span className="text-[11px] font-semibold tracking-[0.14em] text-brass uppercase">Story mode · {step.kicker}</span>
            <span className="num ml-auto text-[11.5px] text-ink-3">{story.step + 1} / {steps.length}</span>
            <button onClick={endStory} aria-label="Exit story mode" className="grid h-7 w-7 place-items-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-ink"><X size={15} /></button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={story.step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
              <div className="display mt-2 text-[20px] leading-snug text-ink">{step.title}</div>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{step.body}</p>
            </motion.div>
          </AnimatePresence>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex flex-1 gap-1">{steps.map((_, i) => <button key={i} onClick={() => setStep(i)} aria-label={`Step ${i + 1}`} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= story.step ? 'bg-brass-2' : 'bg-rule-2')} />)}</div>
            <button onClick={() => setStep(Math.max(0, story.step - 1))} disabled={story.step === 0} className="grid h-8 w-8 place-items-center rounded-full border border-rule text-ink-2 disabled:opacity-40" aria-label="Previous"><ArrowLeft size={14} /></button>
            <button onClick={next} className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-paper">{story.step >= steps.length - 1 ? 'Finish' : 'Next'} <ArrowRight size={13} /></button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
