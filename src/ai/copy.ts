/* Offer copy studio: drafts the words for an approved offer in each format a seller needs, in the
   seller's tone and language, and checks every draft against honest-selling rules before it ships.
   Facts in the copy (amount, products, code, end date) come from the campaign itself. */
import type { Campaign, Reward } from '@/engine/types'
import type { SellerDef } from '@/data/sellers'
import { fmtDay } from '@/lib/dates'

export type Tone = 'festive' | 'premium' | 'value' | 'urgent'
export type CopyLang = 'en' | 'hinglish' | 'hi'

export interface Draft { id: string; format: string; limit: number; text: string; checks: { ok: boolean; label: string }[] }

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

interface Facts { offer: string; offerHi: string; what: string; cond: string; condHi: string; code?: string; ends: string; endDay: number; brand: string; capped: boolean; event: string }

function facts(c: Campaign, s: SellerDef): Facts {
  const sku = (id: string) => s.skus.find((k) => k.id === id)
  const r: Reward = c.reward
  const target = (ref?: string, kind?: string) => (ref ? (kind === 'category' || !sku(ref) ? ref.toLowerCase() : sku(ref)!.line) : '')
  let offer = '', offerHi = '', what = ''
  switch (r.kind) {
    case 'pctOff': offer = `${Math.round(r.value * 100)}% off`; offerHi = `${Math.round(r.value * 100)}% की छूट`; what = r.target === 'cart' ? '' : target(r.ref, r.target === 'category' ? 'category' : 'sku'); break
    case 'amountOff': offer = `${inr(r.value)} off`; offerHi = `${inr(r.value)} की छूट`; break
    case 'tiered': { const top = r.tiers[r.tiers.length - 1]; offer = `up to ${inr(top.off)} off`; offerHi = `${inr(top.off)} तक की छूट`; break }
    case 'bxgy': offer = `buy ${r.buy}, get ${r.get} free`; offerHi = `${r.buy} खरीदें, ${r.get} मुफ़्त`; what = target(r.ref, r.refKind); break
    case 'multiBuy': offer = `${r.qty} for ${inr(r.price)}`; offerHi = `${r.qty} सिर्फ़ ${inr(r.price)} में`; what = target(r.ref, r.refKind); break
    case 'freeItem': offer = `a free ${sku(r.sku)?.line ?? 'gift'}`; offerHi = `${sku(r.sku)?.line ?? 'तोहफ़ा'} मुफ़्त`; break
    case 'freeShipping': offer = 'free delivery'; offerHi = 'मुफ़्त डिलीवरी'; break
    case 'bundlePrice': offer = `${r.skus.map((id) => sku(id)?.line).join(' + ')} for ${inr(r.price)}`; offerHi = `${r.skus.map((id) => sku(id)?.line).join(' + ')} सिर्फ़ ${inr(r.price)} में`; break
    case 'points': offer = `${r.multiplier}× points`; offerHi = `${r.multiplier}× पॉइंट्स`; break
    case 'cashback': offer = `${Math.round(r.pct * 100)}% cashback`; offerHi = `${Math.round(r.pct * 100)}% कैशबैक`; break
  }
  const min = c.conditions.find((k) => k.kind === 'cartMin')
  const code = c.conditions.find((k) => k.kind === 'code')?.value
  if (!what) {
    const has = c.conditions.find((k) => k.kind === 'hasSku' || k.kind === 'hasCategory')
    if (has) what = has.kind === 'hasSku' ? sku(has.value)?.line ?? '' : has.value.toLowerCase()
  }
  return {
    offer, offerHi, what, code, brand: s.brand, endDay: c.endDay, ends: fmtDay(c.endDay), event: s.event,
    cond: min ? `on orders above ${inr(min.value)}` : '', condHi: min ? `${inr(min.value)} से ऊपर के ऑर्डर पर` : '',
    capped: c.maxDiscount !== undefined || c.perCustomer !== undefined || c.totalRedemptions !== undefined,
  }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const pick = <T,>(arr: T[], v: number) => arr[v % arr.length]

function en(f: Facts, tone: Tone, v: number) {
  const on = f.what ? ` on ${f.what}` : ''
  const codeLine = f.code ? ` Use code ${f.code}.` : ''
  const tc = f.capped ? ' T&C apply.' : ''
  const titles: Record<Tone, string[]> = {
    festive: [`${cap(f.offer)}${on} this ${f.event}`, `${f.brand} festive offer: ${f.offer}${on}`],
    premium: [`${cap(f.offer)}${on}, for a short while`, `A quiet offer from ${f.brand}: ${f.offer}${on}`],
    value: [`${cap(f.offer)}${on} ${f.cond}`.trim(), `Save more: ${f.offer}${on}`],
    urgent: [`${cap(f.offer)}${on}, ends ${f.ends}`, `Last days: ${f.offer}${on}`],
  }
  const heads: Record<Tone, string[]> = { festive: ['Celebrate with us', 'The festive edit'], premium: ['Made slowly. Priced kindly.', 'A small thank-you'], value: [cap(f.offer), 'More for less'], urgent: [`Ends ${f.ends}`, 'Last few days'] }
  const title = pick(titles[tone], v)
  const head = pick(heads[tone], v)
  const sub = `${cap(f.offer)}${on} ${f.cond}`.replace(/\s+/g, ' ').trim() + `. Until ${f.ends}.`
  const wa = [
    `Hi {{name}}, ${tone === 'festive' ? `${f.event} is here!` : tone === 'premium' ? `a small thank-you from ${f.brand}.` : tone === 'urgent' ? `a quick heads-up from ${f.brand}.` : `good news from ${f.brand}.`}`,
    `You get ${f.offer}${on} ${f.cond}`.replace(/\s+/g, ' ').trim() + '.' + codeLine,
    `The offer ends on ${f.ends}.${tc}`,
    'Reply STOP to stop these messages.',
  ].join('\n\n')
  const sms = `${f.brand}: ${cap(f.offer)}${on} ${f.cond}`.replace(/\s+/g, ' ').trim() + `.${codeLine} Till ${f.ends}.${tc} STOP to opt out`
  const ig = `${pick([head, title], v)} ✨\n\n${cap(f.offer)}${on} ${f.cond}`.replace(/ +/g, ' ').trim() + `.${codeLine}\nOffer ends ${f.ends}.${tc}\n\n#${f.brand.replace(/\s+/g, '')} #${tone === 'festive' ? 'FestiveOffer' : 'Offer'}`
  return { title, banner: `${head}\n${sub}`, wa, sms, ig }
}

function hinglish(f: Facts, tone: Tone, v: number) {
  const on = f.what ? ` ${f.what} pe` : ''
  const codeLine = f.code ? ` Code ${f.code} lagao.` : ''
  const cond = f.cond ? `, ${f.cond.replace('on orders above ', '')}+ ke order pe` : ''
  const tc = f.capped ? ' T&C lagu.' : ''
  const titles: Record<Tone, string[]> = {
    festive: [`Is ${f.event}${on} ${f.offer}!`, `${f.brand} ka festive offer: ${f.offer}${on}`],
    premium: [`${cap(f.offer)}${on}, bas kuch din`, `${f.brand} ki taraf se: ${f.offer}${on}`],
    value: [`${cap(f.offer)}${on}${cond}`, `Zyada bachat: ${f.offer}${on}`],
    urgent: [`${cap(f.offer)}${on}, ${f.ends} tak`, `Aakhri din: ${f.offer}${on}`],
  }
  const title = pick(titles[tone], v)
  const head = pick({ festive: ['Tyohaar ki khushiyan', 'Festive special'], premium: ['Pyaar se banaya', 'Ek chhota sa thank-you'], value: ['Bachat hi bachat', cap(f.offer)], urgent: [`${f.ends} tak`, 'Aakhri kuch din'] }[tone], v)
  const sub = `${cap(f.offer)}${on}${cond}. ${f.ends} tak.`
  const wa = [`Namaste {{name}}! ${tone === 'festive' ? `${f.event} aa gaya hai.` : `${f.brand} se ek khabar.`}`, `Aapke liye ${f.offer}${on}${cond}.${codeLine}`, `Offer ${f.ends} tak hai.${tc}`, 'Messages band karne ke liye STOP likhein.'].join('\n\n')
  const sms = `${f.brand}: ${cap(f.offer)}${on}${cond}.${codeLine} ${f.ends} tak.${tc} STOP to opt out`
  const ig = `${head} ✨\n\n${cap(f.offer)}${on}${cond}.${codeLine}\nOffer ${f.ends} tak.${tc}\n\n#${f.brand.replace(/\s+/g, '')}`
  return { title, banner: `${head}\n${sub}`, wa, sms, ig }
}

function hindi(f: Facts, tone: Tone, v: number) {
  const on = f.what ? ` ${f.what} पर` : ''
  const codeLine = f.code ? ` कोड ${f.code} इस्तेमाल करें।` : ''
  const cond = f.condHi ? ` ${f.condHi}` : ''
  const tc = f.capped ? ' शर्तें लागू।' : ''
  const titles: Record<Tone, string[]> = {
    festive: [`इस ${f.event}${on} ${f.offerHi}`, `${f.brand} का त्योहारी ऑफ़र:${on} ${f.offerHi}`],
    premium: [`${f.brand} की ओर से:${on} ${f.offerHi}`, `कुछ ही दिनों के लिए:${on} ${f.offerHi}`],
    value: [`${f.offerHi}${on}${cond}`.trim(), `ज़्यादा बचत:${on} ${f.offerHi}`],
    urgent: [`${f.ends} तक:${on} ${f.offerHi}`, `आख़िरी दिन:${on} ${f.offerHi}`],
  }
  const title = pick(titles[tone], v)
  const head = pick({ festive: ['त्योहार की ख़ुशियाँ', 'त्योहारी ऑफ़र'], premium: ['प्यार से बनाया', 'एक छोटा-सा धन्यवाद'], value: ['बचत ही बचत', 'कम में ज़्यादा'], urgent: [`${f.ends} तक`, 'आख़िरी कुछ दिन'] }[tone], v)
  const sub = `${on.trim()} ${f.offerHi}${cond}। ${f.ends} तक।`.trim()
  const wa = [`नमस्ते {{name}}!`, `आपके लिए${on} ${f.offerHi}${cond}।${codeLine}`, `ऑफ़र ${f.ends} तक है।${tc}`, 'संदेश बंद करने के लिए STOP लिखें।'].join('\n\n')
  const sms = `${f.brand}:${on} ${f.offerHi}${cond}।${codeLine} ${f.ends} तक।${tc} STOP to opt out`
  const ig = `${head} ✨\n\n${on.trim()} ${f.offerHi}${cond}।${codeLine}\nऑफ़र ${f.ends} तक।${tc}\n\n#${f.brand.replace(/\s+/g, '')}`
  return { title, banner: `${head}\n${sub}`, wa, sms, ig }
}

const BANNED = /\b(lowest price ever|best price ever|guaranteed|cheapest|100% (safe|natural|cure)|today only|sabse sasta)\b/i

export function draft(c: Campaign, s: SellerDef, tone: Tone, lang: CopyLang, v = 0, creator = false): Draft[] {
  const f = facts(c, s)
  const t = lang === 'hi' ? hindi(f, tone, v) : lang === 'hinglish' ? hinglish(f, tone, v) : en(f, tone, v)
  const ig = creator ? `${t.ig}\n#ad #collab` : t.ig
  const rows: Omit<Draft, 'checks'>[] = [
    { id: 'title', format: 'Deal title', limit: 70, text: t.title },
    { id: 'banner', format: 'Banner (headline + line)', limit: 110, text: t.banner },
    { id: 'wa', format: 'WhatsApp broadcast', limit: 700, text: t.wa },
    { id: 'sms', format: 'SMS', limit: 160, text: t.sms },
    { id: 'ig', format: creator ? 'Creator caption' : 'Instagram caption', limit: 400, text: ig },
  ]
  return rows.map((r) => {
    const len = [...r.text].length
    const checks = [
      { ok: len <= r.limit, label: `${len}/${r.limit} characters` },
      { ok: !BANNED.test(r.text), label: 'No superlative or unprovable claims' },
      { ok: r.id === 'title' || r.text.includes(f.ends), label: 'States the real end date' },
      { ok: !f.capped || r.id === 'title' || r.id === 'banner' || /T&C|शर्तें/.test(r.text), label: 'Mentions limits (T&C) where they apply' },
    ]
    if (r.id === 'wa' || r.id === 'sms') checks.push({ ok: /STOP/.test(r.text), label: 'Has an opt-out' })
    if (r.id === 'ig' && creator) checks.push({ ok: /#ad\b/.test(r.text), label: 'Ad label for creator posts (ASCI)' })
    return { ...r, checks }
  })
}
