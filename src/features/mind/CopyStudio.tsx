import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Check, ClipboardCopy, RefreshCw, X } from 'lucide-react'
import { Card, Chip, Eyebrow, PageHeader, Segmented, Switch } from '@/components/ui'
import { Select } from '@/components/ui/form'
import { Spot } from '@/components/Spot'
import { SellerLogo, SellerMark } from '@/brand/sellers'
import { draft, type CopyLang, type Tone } from '@/ai/copy'
import { useCampaigns, useSeller } from '@/state/hooks'
import { cn } from '@/lib/cn'
import { AiByline } from './shared'

export function CopyStudio() {
  const seller = useSeller()
  const campaigns = useCampaigns().filter((k) => k.status !== 'paused')
  const [params, setParams] = useSearchParams()
  const id = params.get('id') && campaigns.some((k) => k.id === params.get('id')) ? params.get('id')! : campaigns[0]?.id
  const camp = campaigns.find((k) => k.id === id)
  const [tone, setTone] = useState<Tone>('festive')
  const [lang, setLang] = useState<CopyLang>('en')
  const [v, setV] = useState(0)
  const [creator, setCreator] = useState(() => !!camp?.conditions.some((k) => k.kind === 'code'))
  const drafts = useMemo(() => (camp ? draft(camp, seller, tone, lang, v, creator) : []), [camp, seller, tone, lang, v, creator])

  if (!camp) return <PageHeader eyebrow="Offer copy studio" title="No campaigns yet">Create one in the Campaign builder first.</PageHeader>
  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); toast('Copied') } catch { toast('Copy failed') } }
  const wa = drafts.find((d) => d.id === 'wa')!

  return (
    <div>
      <PageHeader eyebrow="Offer copy studio" title={<>The words for every channel,<br /><span className="text-ink-3">checked before they ship.</span></>}>
        Pick an approved offer and a tone. Tarazu drafts the deal title, banner, WhatsApp broadcast, SMS and caption from the offer's own
        facts (amount, products, code, end date) and checks each one: length, an honest end date, no unprovable claims, opt-out, ad labels.
      </PageHeader>
      <Spot id="copy-controls">
        <Card className="grid gap-4 p-4 md:grid-cols-[1.4fr_auto_auto_auto] md:items-end">
          <label className="block"><span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-ink-3 uppercase">Offer</span>
            <Select label="Offer" value={camp.id} onChange={(x) => { setParams({ id: x }, { replace: true }); setCreator(!!campaigns.find((k) => k.id === x)?.conditions.some((k) => k.kind === 'code')) }} options={campaigns.map((k) => ({ value: k.id, label: k.name }))} className="w-full" /></label>
          <div><span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-ink-3 uppercase">Tone</span><Segmented<Tone> size="sm" value={tone} onChange={setTone} options={[{ value: 'festive', label: 'Festive' }, { value: 'premium', label: 'Premium' }, { value: 'value', label: 'Value' }, { value: 'urgent', label: 'Deadline' }]} /></div>
          <div><span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-ink-3 uppercase">Language</span><Segmented<CopyLang> size="sm" value={lang} onChange={setLang} options={[{ value: 'en', label: 'English' }, { value: 'hinglish', label: 'Hinglish' }, { value: 'hi', label: 'हिंदी' }]} /></div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[12.5px] text-ink-2"><Switch checked={creator} onChange={setCreator} label="Creator post" /> Creator post</label>
            <button onClick={() => setV((x) => x + 1)} className="flex items-center gap-1.5 rounded-full border border-rule px-3 py-1.5 text-[12.5px] text-ink-2 hover:text-ink"><RefreshCw size={13} /> Another</button>
          </div>
        </Card>
      </Spot>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]">
        <Spot id="copy-drafts">
          <div className="grid gap-4 md:grid-cols-2">
            {drafts.map((d, i) => {
              const ok = d.checks.every((c) => c.ok)
              return (
                <motion.div key={d.id + tone + lang + v} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={d.id === 'wa' ? 'md:col-span-2' : ''}>
                  <Card className="flex h-full flex-col p-4">
                    <div className="flex items-center justify-between gap-2"><Eyebrow>{d.format}</Eyebrow>{ok ? <Chip tone="gain"><Check size={11} /> Ready</Chip> : <Chip tone="warn">Check</Chip>}</div>
                    <p lang={lang === 'hi' ? 'hi' : 'en'} className="mt-2 flex-1 text-[14px] leading-relaxed whitespace-pre-line text-ink">{d.text}</p>
                    <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-dashed border-rule pt-2 text-[11px]">
                      {d.checks.map((c) => <li key={c.label} className={cn('flex items-center gap-1', c.ok ? 'text-ink-3' : 'text-loss')}>{c.ok ? <Check size={11} className="text-gain" /> : <X size={11} />}{c.label}</li>)}
                    </ul>
                    <button onClick={() => copy(d.text)} className="mt-2 flex items-center gap-1.5 self-start text-[12px] font-medium text-brass hover:text-ink"><ClipboardCopy size={12} /> Copy</button>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </Spot>
        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Spot id="copy-preview">
            <Card className="overflow-hidden p-0">
              <div className="flex items-center gap-2 bg-[#075e54] px-4 py-2.5 text-white"><SellerLogoTile /><div className="leading-tight"><div className="text-[13px] font-semibold">{seller.brand}</div><div className="text-[10.5px] opacity-75">Broadcast list · repeat buyers</div></div></div>
              <div className="bg-[#ece5dd] p-4 dark:bg-[#1b2a24]">
                <div className="ml-auto max-w-[92%] rounded-xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 text-[12.5px] leading-relaxed whitespace-pre-line text-[#111] shadow-sm" lang={lang === 'hi' ? 'hi' : 'en'}>
                  {wa.text.replace('{{name}}', 'Priya')}
                  <div className="mt-1 text-right text-[10px] text-[#667]">10:42 ✓✓</div>
                </div>
              </div>
            </Card>
          </Spot>
          <Card className="p-4">
            <Eyebrow>Seller's look</Eyebrow>
            <div className="mt-3"><SellerLogo id={seller.id} size="md" descriptor /></div>
            <p className="mt-3 text-[12px] leading-snug text-ink-3">Copy uses the seller's brand name and stays factual. Tone changes words, never the offer.</p>
          </Card>
          <AiByline className="px-1" />
        </div>
      </div>
    </div>
  )
}

function SellerLogoTile() {
  const seller = useSeller()
  return <span className="grid h-8 w-8 place-items-center rounded-full bg-white"><SellerMark id={seller.id} size={20} framed={false} /></span>
}
