import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Ban, Download, KeyRound, Search } from 'lucide-react'
import { Card, Chip, Eyebrow, PageHeader, Segmented } from '@/components/ui'
import { NumberInput, Select, TextInput } from '@/components/ui/form'
import { Spot } from '@/components/Spot'
import { codeRisk, generateCodes, normaliseCode } from '@/engine/launch'
import { useLaunch } from '@/state/launch'
import { cn } from '@/lib/cn'
import { useLaunchCtx } from './shared'

type Status = 'unused' | 'redeemed' | 'expired' | 'blocked'
const TONE: Record<Status, 'quiet' | 'gain' | 'warn' | 'loss'> = { unused: 'quiet', redeemed: 'gain', expired: 'warn', blocked: 'loss' }

export function CodeStudio() {
  const { campaigns } = useLaunchCtx()
  const { codes, setCodes, blockCode, log } = useLaunch()
  const [params, setParams] = useSearchParams()
  const list = campaigns.filter((k) => k.status !== 'archived')
  const id = list.some((k) => k.id === params.get('id')) ? params.get('id')! : (list.find((k) => codes[k.id]) ?? list[0])?.id
  const camp = list.find((k) => k.id === id)
  const batch = camp ? codes[camp.id] : undefined
  const [prefix, setPrefix] = useState('TZ')
  const [count, setCount] = useState<number | undefined>(500)
  const [label, setLabel] = useState('')
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    if (!batch || !camp) return []
    const all = generateCodes(batch.prefix, batch.count, batch.seed)
    const usedShare = Math.min(0.85, camp.redeemed / Math.max(1, batch.count) + (camp.status === 'live' ? 0.08 : 0))
    return all.map((code, i) => {
      const r = ((i * 2654435761) % 1000) / 1000
      const status: Status = batch.blocked.includes(code) ? 'blocked' : camp.status === 'ended' && r > usedShare ? 'expired' : r < usedShare ? 'redeemed' : 'unused'
      return { code, status }
    })
  }, [batch, camp])
  const counts = rows.reduce<Record<string, number>>((a, r) => { a[r.status] = (a[r.status] ?? 0) + 1; return a }, {})
  const shown = rows.filter((r) => (filter === 'all' || r.status === filter) && (!q || r.code.includes(normaliseCode(q)))).slice(0, 200)

  const create = () => {
    if (!camp || !count) return
    setCodes(camp.id, { prefix: normaliseCode(prefix) || 'TZ', count: Math.min(50000, count), seed: Date.now() % 1000, blocked: [], createdAt: Date.now(), label: label || undefined })
    log(camp.id, { what: `Generated ${Math.min(50000, count).toLocaleString('en-IN')} single-use codes (${normaliseCode(prefix)}-…)` })
    toast(`${Math.min(50000, count).toLocaleString('en-IN')} codes generated`)
  }
  const exportCsv = () => {
    const csv = ['code,status,campaign', ...rows.map((r) => `${r.code},${r.status},"${camp!.name}"`)].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = `${camp!.id}-codes.csv`; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader eyebrow="Code studio" title={<>Codes that can't leak,<br /><span className="text-ink-3">and a record of every one.</span></>}>
        Generate thousands of single-use codes for a campaign: random, non-sequential, collision-checked, with no characters that look alike.
        Track which are used, block one that shows up somewhere it shouldn't, and export the list for an email or a creator.
      </PageHeader>
      {!camp ? <Card className="p-8 text-center text-ink-3">No campaigns yet.</Card> : (
        <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <Card className="p-4">
              <label className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-ink-3 uppercase">Campaign</label>
              <Select label="Campaign" value={camp.id} onChange={(v) => setParams({ id: v }, { replace: true })} options={list.map((k) => ({ value: k.id, label: `${k.name}${codes[k.id] ? ' · codes' : ''}` }))} className="w-full" />
              <div className="mt-3 rounded-lg bg-paper-2/70 p-3 text-[12px]">
                <div className="flex justify-between"><span className="text-ink-3">Today's code setup</span><span className={cn('font-medium', codeRisk(camp).score >= 0.6 ? 'text-loss' : 'text-ink')}>{batch ? 'Single-use codes' : camp.conditions.some((k) => k.kind === 'code') ? `Public code ${camp.conditions.find((k) => k.kind === 'code')!.value}` : 'No code'}</span></div>
                {!batch && codeRisk(camp).score >= 0.6 && <p className="mt-1 text-loss">A public code with no per-customer limit: single-use codes would stop it leaking.</p>}
              </div>
            </Card>
            <Spot id="code-generate">
              <Card className="p-4">
                <Eyebrow>{batch ? 'Replace the batch' : 'Generate a batch'}</Eyebrow>
                <div className="mt-3 space-y-2.5 text-[13px]">
                  <label className="flex items-center justify-between gap-2">Prefix <TextInput mono label="Prefix" value={prefix} onChange={(v) => setPrefix(normaliseCode(v).slice(0, 8))} className="w-28" /></label>
                  <label className="flex items-center justify-between gap-2">How many <NumberInput label="Count" value={count} onChange={setCount} className="w-28" /></label>
                  <label className="flex items-center justify-between gap-2">For (optional) <TextInput label="Label" value={label} onChange={setLabel} placeholder="Email list, a creator…" className="w-40" /></label>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">{generateCodes(prefix || 'TZ', 4, 7).map((x) => <span key={x} className="num rounded border border-dashed border-rule px-1.5 py-0.5 text-[11px] text-ink-2">{x}</span>)}</div>
                <button onClick={create} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2 text-[13px] font-medium text-paper"><KeyRound size={14} /> Generate {count ? Math.min(50000, count).toLocaleString('en-IN') : ''} codes</button>
                <p className="mt-2 text-[11px] leading-snug text-ink-3">31-character alphabet without 0/O or 1/I/L, 6 characters: about 887 million combinations per prefix.</p>
              </Card>
            </Spot>
          </div>
          <Spot id="code-table">
            <Card className="p-0">
              {!batch ? <div className="p-10 text-center text-[13.5px] text-ink-3">No single-use codes for {camp.name} yet. Generate a batch on the left.</div> : (
                <>
                  <div className="flex flex-wrap items-center gap-2 border-b border-rule p-3">
                    <Segmented<Status | 'all'> size="sm" value={filter} onChange={setFilter} options={[{ value: 'all', label: `All ${rows.length.toLocaleString('en-IN')}` }, ...(['unused', 'redeemed', 'expired', 'blocked'] as Status[]).map((s) => ({ value: s, label: `${s} ${(counts[s] ?? 0).toLocaleString('en-IN')}` }))]} />
                    <span className="relative ml-auto"><Search size={13} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-3" /><input aria-label="Find a code" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a code" className="w-40 rounded-full border border-rule bg-paper py-1.5 pr-3 pl-7 text-[12.5px] text-ink outline-none focus:border-brass/60" /></span>
                    <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-full border border-rule px-3 py-1.5 text-[12.5px] text-ink-2 hover:text-ink"><Download size={13} /> CSV</button>
                  </div>
                  <div className="max-h-[520px] overflow-auto">
                    <table className="w-full text-[12.5px]">
                      <thead className="sticky top-0 bg-card text-left text-ink-3"><tr className="border-b border-rule"><th className="px-4 py-2 font-medium">Code</th><th className="px-4 py-2 font-medium">Status</th><th className="px-4 py-2" /></tr></thead>
                      <tbody>
                        {shown.map((r) => (
                          <tr key={r.code} className="border-b border-rule-2">
                            <td className="num px-4 py-1.5 text-ink">{r.code}</td>
                            <td className="px-4 py-1.5"><Chip tone={TONE[r.status]}>{r.status}</Chip></td>
                            <td className="px-4 py-1.5 text-right">{r.status === 'unused' && <button onClick={() => { blockCode(camp.id, r.code); log(camp.id, { what: `Blocked code ${r.code}` }); toast(`${r.code} blocked`) }} className="inline-flex items-center gap-1 text-[11.5px] text-ink-3 hover:text-loss"><Ban size={11} /> Block</button>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rows.length > 200 && <p className="p-3 text-center text-[11.5px] text-ink-3">Showing 200 of {shown.length === 200 ? 'the matching' : ''} codes; the CSV has all {rows.length.toLocaleString('en-IN')}.</p>}
                  </div>
                  {batch.label && <div className="border-t border-rule px-4 py-2 text-[11.5px] text-ink-3">For: {batch.label}</div>}
                </>
              )}
            </Card>
          </Spot>
        </div>
      )}
    </div>
  )
}
