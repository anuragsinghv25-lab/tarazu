import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { useStore } from '@/state/store'
import { SELLER_BY_ID, type SellerId } from '@/data/sellers'
import { Avatar } from './AppShell'
import { Eyebrow } from '@/components/ui'
import { cn } from '@/lib/cn'

type Score = Partial<Record<SellerId, number>>
const Q: { q: string; options: { label: string; score: Score; why: string }[] }[] = [
  { q: 'Where do you sell?', options: [
    { label: 'Only on marketplaces', score: { farhan: 3 }, why: 'sells only on marketplaces' },
    { label: 'Marketplaces and my own website', score: { meera: 2, kabir: 2 }, why: 'has an own channel next to marketplaces' },
    { label: 'Through distributors and retail shops', score: { anaya: 4 }, why: 'sells through distributors and retailers' },
  ] },
  { q: 'What do you sell?', options: [
    { label: 'Beauty, wellness, personal care', score: { meera: 3 }, why: 'is in beauty and wellness' },
    { label: 'Fashion and apparel', score: { farhan: 3 }, why: 'is in fashion' },
    { label: 'Electronics and accessories', score: { kabir: 3 }, why: 'is in electronics' },
    { label: 'Food, snacks, daily essentials', score: { anaya: 3 }, why: 'is in food and FMCG' },
  ] },
  { q: 'How often do customers buy again?', options: [
    { label: 'Often: the product runs out', score: { meera: 1, anaya: 1 }, why: 'gets repeat purchases' },
    { label: 'Sometimes: when they upgrade', score: { kabir: 1 }, why: 'sees upgrade purchases' },
    { label: 'Rarely: it is an occasion buy', score: { farhan: 1 }, why: 'sells occasion buys' },
  ] },
  { q: 'What hurts most right now?', options: [
    { label: 'Stock that won\'t sell in time', score: { meera: 2, kabir: 1 }, why: 'is fighting ageing stock' },
    { label: 'Price wars and thin margins', score: { farhan: 2 }, why: 'is in a price war' },
    { label: 'A new model or season replacing old stock', score: { kabir: 2, farhan: 1 }, why: 'must clear before a launch or season change' },
    { label: 'Money paid to retailers I can\'t track', score: { anaya: 2 }, why: 'can\'t track trade spend' },
  ] },
]

export function SellerQuiz() {
  const { quizOpen, setQuiz, setSeller } = useStore()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])

  const done = step >= Q.length
  const totals: Record<SellerId, number> = { meera: 0, farhan: 0, kabir: 0, anaya: 0 }
  answers.forEach((a, i) => Object.entries(Q[i].options[a].score).forEach(([k, v]) => { totals[k as SellerId] += v ?? 0 }))
  const winner = (Object.keys(totals) as SellerId[]).reduce((a, b) => (totals[b] > totals[a] ? b : a), 'meera')
  const w = SELLER_BY_ID[winner]
  const reasons = answers.map((a, i) => Q[i].options[a]).filter((o) => (o.score[winner] ?? 0) > 0).map((o) => o.why)

  const choose = (i: number) => { setAnswers((x) => [...x.slice(0, step), i]); setStep((s) => s + 1) }
  const close = (o: boolean) => { setQuiz(o); if (!o) setTimeout(() => { setStep(0); setAnswers([]) }, 250) }

  return (
    <Dialog.Root open={quizOpen} onOpenChange={close}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[3px]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[94vw] max-w-[540px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-rule bg-paper shadow-[var(--shadow-lift)]">
          <div className="flex items-center justify-between px-6 pt-5">
            <Eyebrow>Which seller are you?</Eyebrow>
            <Dialog.Close className="rounded-full p-1.5 text-ink-3 hover:bg-paper-2 hover:text-ink" aria-label="Close"><X size={17} /></Dialog.Close>
          </div>
          <div className="flex gap-1.5 px-6 pt-3">
            {Q.map((_, i) => <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i < step ? 'bg-brass' : 'bg-rule')} />)}
          </div>
          <div className="relative min-h-[330px] px-6 pt-5 pb-6">
            <AnimatePresence mode="wait">
              {!done ? (
                <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                  <Dialog.Title className="display text-[28px] leading-tight text-ink">{Q[step].q}</Dialog.Title>
                  <div className="mt-5 space-y-2">
                    {Q[step].options.map((o, i) => (
                      <button key={o.label} onClick={() => choose(i)}
                        className={cn('group flex w-full items-center justify-between rounded-2xl border bg-card px-4 py-3 text-left text-[14px] text-ink transition-all hover:-translate-y-px hover:border-primary hover:shadow-[var(--shadow-card)]', answers[step] === i ? 'border-primary' : 'border-rule')}>
                        {o.label}<ArrowRight size={15} className="text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                      </button>
                    ))}
                  </div>
                  {step > 0 && <button onClick={() => setStep((s) => s - 1)} className="mt-4 flex items-center gap-1 text-[12.5px] text-ink-3 hover:text-ink"><ArrowLeft size={13} /> Back</button>}
                </motion.div>
              ) : (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                  <Dialog.Title className="display text-[26px] leading-tight text-ink">Your business looks most like {w.name}'s.</Dialog.Title>
                  <div className="mt-5 flex items-center gap-4 rounded-2xl border border-rule bg-card p-4">
                    <Avatar s={w} size={52} />
                    <div>
                      <div className="text-[15px] font-semibold text-ink">{w.name} · {w.brand}</div>
                      <div className="text-[12.5px] text-ink-3">{w.category}, {w.city}</div>
                    </div>
                  </div>
                  <p className="mt-4 text-[13.5px] leading-relaxed text-ink-2">Like you, {w.name} {reasons.join(', ')}. {w.problem}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <button onClick={() => { setSeller(winner); close(false); nav('/') }} className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-paper">Open Tarazu as {w.name} <ArrowRight size={14} /></button>
                    <button onClick={() => { setStep(0); setAnswers([]) }} className="rounded-full border border-rule bg-card px-4 py-2 text-[13px] text-ink-2 hover:text-ink">Start again</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
