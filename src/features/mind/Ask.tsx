import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, ArrowUp, ChevronDown, RotateCcw } from 'lucide-react'
import { Card, Eyebrow, PageHeader } from '@/components/ui'
import { Spot } from '@/components/Spot'
import { TarazuMark } from '@/brand/TarazuLogo'
import { SellerMark } from '@/brand/sellers'
import { answer, suggestions, type AiAnswer } from '@/ai/ask'
import { useMind } from '@/state/mind'
import { useSeller } from '@/state/hooks'
import { inrShort } from '@/lib/format'
import { cn } from '@/lib/cn'
import { AiByline, Thinking, Typewriter, useCtx, useGo } from './shared'

export function Ask() {
  const seller = useSeller()
  const x = useCtx()
  const turns = useMind((s) => s.chats[seller.id])
  const { say, clearChat } = useMind()
  const [q, setQ] = useState('')
  const [fresh, setFresh] = useState<number | null>(null)
  const [params, setParams] = useSearchParams()
  const end = useRef<HTMLDivElement>(null)

  const ask = (text: string) => {
    const t = text.trim()
    if (!t) return
    say(seller.id, 'user', t)
    setFresh(useMind.getState().chats[seller.id].at(-1)!.id)
    setQ('')
  }
  // Deep link: /ask?q=…
  useEffect(() => {
    const pre = params.get('q')
    if (pre) { ask(pre); setParams({}, { replace: true }) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [turns.length])

  const sugg = suggestions(x)
  return (
    <div>
      <PageHeader eyebrow="Ask Tarazu" title={<>Ask in your own words.<br /><span className="text-ink-3">Answers come with the numbers.</span></>}>
        English, Hindi or Hinglish. Every figure comes from the same engine as the rest of Tarazu, so the answers change when you move
        anything in the Control Room. Tap an answer to open the screen that shows it.
      </PageHeader>
      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <Spot id="ask-chat">
          <Card className="flex min-h-[520px] flex-col p-0">
            <div className="flex-1 space-y-5 p-5">
              {turns.length === 0 && (
                <div className="py-6 text-center">
                  <TarazuMark size={64} className="mx-auto" />
                  <div className="display mt-3 text-[22px] text-ink">Namaste, {seller.name}. What should we weigh?</div>
                  <div className="mx-auto mt-4 flex max-w-xl flex-wrap justify-center gap-2">
                    {sugg.map((s) => <button key={s} onClick={() => ask(s)} className="rounded-full border border-rule bg-paper px-3 py-1.5 text-[12.5px] text-ink-2 transition-colors hover:border-brass/50 hover:text-ink">{s}</button>)}
                  </div>
                </div>
              )}
              {turns.map((t) => <Turn key={t.id} q={t.text} live={t.id === fresh} onAsk={ask} />)}
              <div ref={end} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); ask(q) }} className="sticky bottom-0 flex items-center gap-2 rounded-b-[var(--radius-card)] border-t border-rule bg-card/95 p-3 backdrop-blur">
              <label htmlFor="ask-input" className="sr-only">Ask Tarazu</label>
              <input id="ask-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`e.g. ${sugg[0]}`} autoComplete="off"
                className="min-w-0 flex-1 rounded-full border border-rule bg-paper px-4 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-3 focus:border-brass/60" />
              <button type="submit" disabled={!q.trim()} aria-label="Send" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-paper disabled:opacity-40"><ArrowUp size={17} /></button>
            </form>
          </Card>
        </Spot>
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card className="p-4">
            <div className="flex items-center gap-2.5"><SellerMark id={seller.id} size={30} /><div className="leading-tight"><div className="text-[13px] font-semibold text-ink">{seller.brand}</div><div className="text-[11.5px] text-ink-3">What Tarazu can see</div></div></div>
            <dl className="mt-3 space-y-1.5 text-[12.5px]">
              <div className="flex justify-between"><dt className="text-ink-3">Products</dt><dd className="num text-ink">{seller.skus.length}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-3">Campaigns</dt><dd className="num text-ink">{x.campaigns.length}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-3">Stuck stock</dt><dd className="num text-loss">{inrShort(x.p.stuck)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-3">Plan gain</dt><dd className="num text-gain">+{inrShort(x.p.gain)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-3">Channels</dt><dd className="text-right text-ink">{Object.keys(seller.market.channels).length}</dd></div>
            </dl>
          </Card>
          <Card className="p-4">
            <Eyebrow>Try asking</Eyebrow>
            <ul className="mt-2 space-y-1">
              {sugg.map((s) => <li key={s}><button onClick={() => ask(s)} className="w-full rounded-lg px-2 py-1.5 text-left text-[12.5px] text-ink-2 hover:bg-paper-2 hover:text-ink">{s}</button></li>)}
            </ul>
            {turns.length > 0 && <button onClick={() => { clearChat(seller.id); setFresh(null) }} className="mt-2 flex items-center gap-1.5 px-2 text-[12px] text-ink-3 hover:text-ink"><RotateCcw size={12} /> Clear conversation</button>}
          </Card>
          <AiByline className="px-1" />
        </aside>
      </div>
    </div>
  )
}

function Turn({ q, live, onAsk }: { q: string; live: boolean; onAsk: (q: string) => void }) {
  const x = useCtx()
  const a = useMemo(() => answer(q, x), [q, x])
  const [phase, setPhase] = useState<'think' | 'type' | 'done'>(live ? 'think' : 'done')
  return (
    <div className="space-y-3">
      <div className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[14px] text-paper">{q}</div></div>
      <div className="flex gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-rule bg-paper"><TarazuMark size={20} /></span>
        <div className="min-w-0 flex-1">
          {phase === 'think' ? <Thinking steps={a.trace} onDone={() => setPhase('type')} /> : (
            <>
              <p className="text-[14px] leading-relaxed text-ink-2"><Typewriter text={a.text} instant={phase === 'done'} onDone={() => setPhase('done')} /></p>
              {phase === 'done' && <Body a={a} onAsk={onAsk} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Body({ a, onAsk }: { a: AiAnswer; onAsk: (q: string) => void }) {
  const go = useGo()
  const [open, setOpen] = useState(false)
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-3">
      {a.rows && (
        <ul className="divide-y divide-rule-2 overflow-hidden rounded-xl border border-rule bg-paper/60">
          {a.rows.map((r) => {
            const inner = (
              <>
                <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-ink">{r.label}</span>{r.sub && <span className="block truncate text-[11.5px] text-ink-3">{r.sub}</span>}</span>
                <span className={cn('num shrink-0 text-[13px] font-semibold', r.tone === 'gain' ? 'text-gain' : r.tone === 'loss' ? 'text-loss' : r.tone === 'brass' ? 'text-brass' : 'text-ink')}>{r.value}</span>
                {r.to && <ArrowRight size={13} className="shrink-0 text-ink-3" />}
              </>
            )
            return <li key={r.label}>{r.to ? <button onClick={() => go(r.to!, 'scale')} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-paper-2">{inner}</button> : <div className="flex items-center gap-3 px-3 py-2">{inner}</div>}</li>
          })}
        </ul>
      )}
      {a.actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {a.actions.map((ac) => <button key={ac.label} onClick={() => go(ac.to, ac.focus)} className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-paper">{ac.label} <ArrowRight size={13} /></button>)}
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 text-[11.5px] text-ink-3 hover:text-ink">
        <ChevronDown size={12} className={cn('transition-transform', open && 'rotate-180')} /> How I worked this out
      </button>
      {open && <ol className="ml-4 list-decimal space-y-0.5 text-[11.5px] text-ink-3">{a.trace.map((t) => <li key={t}>{t}</li>)}</ol>}
      {a.followups.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {a.followups.map((f) => <button key={f} onClick={() => onAsk(f)} className="rounded-full border border-rule px-2.5 py-1 text-[12px] text-ink-2 hover:border-brass/50 hover:text-ink">{f}</button>)}
        </div>
      )}
    </motion.div>
  )
}
