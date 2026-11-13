/* Ask Tarazu: the copilot. A scripted, data-aware stand-in for a language model: it recognises
   what the seller is asking (English, Hindi or Hinglish), pulls the answer from the engine, and
   replies with numbers, a short explanation and a link to the screen that shows the full picture.
   It never invents a figure: every number below is computed from Ctx. */
import { bestMove, grossToNet, roi } from '@/engine/trade'
import { programEconomics } from '@/engine/loyalty'
import { simulate } from '@/engine/engine'
import { inrShort, pct, units } from '@/lib/format'
import { atRiskValue, bestPair, channelCompare, dependency, findSku, holds, recFor, risky, topActions, type Ctx } from './context'

export type Lang = 'en' | 'hi'
export interface AiRow { label: string; sub?: string; value: string; tone?: 'gain' | 'loss' | 'ink' | 'brass'; to?: string }
export interface AiAction { label: string; to: string; focus?: string }
export interface AiAnswer {
  intent: string
  lang: Lang
  text: string
  rows?: AiRow[]
  actions: AiAction[]
  followups: string[]
  /** What the engine did, shown as a short trace under the answer. */
  trace: string[]
}

const HINGLISH = /\b(kya|mein|kitna|kitni|kaise|kaun|kaunsa|kahan|hai|hain|karun|karu|karoon|daalun|dalun|chahiye|bata|batao|mera|meri|mere|pichli|pichhli|wala|wali|kab|nahi|nahin|accha|theek|kuch|sab|apna|apni)\b/i
export const detectLang = (q: string): Lang => (/[ऀ-ॿ]/.test(q) || HINGLISH.test(q) ? 'hi' : 'en')

const money = (n: number) => `${n < 0 ? '−' : n > 0 ? '+' : ''}${inrShort(Math.abs(n))}`

type Intent = 'plan' | 'risk' | 'truth' | 'channel' | 'sku' | 'holds' | 'leak' | 'bundle' | 'loyalty' | 'trade' | 'fatigue' | 'rival' | 'help'

const RULES: [Intent, RegExp][] = [
  ['trade', /\b(trade|distributor|retailer|deduction|gross.?to.?net|gtn|scheme|kirana|modern trade)\b/i],
  ['leak', /\b(coupon|code|leak|leaking|misuse|abuse)\b/i],
  ['rival', /\b(rival|competitor|match|undercut|price war|sasta)\b/i],
  ['fatigue', /\b(sitewide|habit|every week|har hafte|fatigue|trained|always on sale|30%)\b/i],
  ['truth', /\b(last|pichli|pichhli|diwali|navratri|festival|did .* (work|make)|worth it|loss|profit hua|kamaya)\b/i],
  ['channel', /\b(amazon|flipkart|nykaa|meesho|website|channel|platform|kahan|where)\b/i],
  ['bundle', /\b(bundle|combo|pair|together)\b/i],
  ['loyalty', /\b(loyalty|points|member|referral|win.?back|lapsed)\b/i],
  ['holds', /\b(full price|leave|don'?t discount|no discount|mat (do|karo)|chhod)\b/i],
  ['risk', /\b(stuck|risk|risky|expir|old stock|dead stock|purana|phansa|ageing|aging|overstock|clear)\b/i],
  ['plan', /\b(plan|run|sale|event|kya daal|kya karun|what should|recommend|suggest|big billion|wedding|launch|q4|season)\b/i],
]

export function suggestions(x: Ctx): string[] {
  const s = x.seller
  const hero = s.skus.find((k) => k.id === s.heroSkuId)!
  const story = s.story.map((k) => s.skus.find((z) => z.id === k.id)).filter(Boolean)
  const base: Record<string, string[]> = {
    meera: [`${s.event} mein kya daalun?`, `How much discount on ${story[0]?.line ?? hero.line}?`, 'Which products should I leave at full price?', `Did ${s.history.label.split(' · ')[0]} make money?`, 'Is any coupon leaking?', `Amazon or Flipkart for ${hero.line}?`],
    farhan: ['Wedding sale ke liye kya plan karun?', 'Is my 30% sitewide offer worth it?', 'Which sarees are stuck?', `Meesho or Flipkart for ${hero.line}?`, 'Bundle ideas for slow movers?', `Did ${s.history.label.split(' · ')[0]} make money?`],
    kabir: [`Should I match the rival's price on ${hero.line}?`, `${s.event} se pehle kya clear karun?`, 'Is VOLT20 leaking?', 'Which products should I leave at full price?', 'Amazon or my website for the old charger?', 'Is my loyalty programme paying back?'],
    anaya: ['Which trade deal should I cut?', 'Kitna paisa deductions mein phansa hai?', `How much discount on ${hero.line}?`, 'Quick commerce or modern trade for makhana?', `Did ${s.history.label.split(' · ')[0]} make money?`, 'Q4 ke liye kya plan karun?'],
  }
  return base[s.id]
}

function classify(q: string, x: Ctx): { intent: Intent; sku?: ReturnType<typeof findSku> } {
  const sku = findSku(x.seller.skus, q)
  const hit = RULES.find(([, re]) => re.test(q))?.[0]
  if (sku && (!hit || hit === 'plan' || hit === 'risk' || hit === 'holds' || /discount|kitna|how much|depth|price/i.test(q))) {
    if (hit === 'channel' || hit === 'rival' || hit === 'bundle') return { intent: hit, sku }
    return { intent: 'sku', sku }
  }
  return { intent: hit ?? 'help', sku }
}

export function answer(q: string, x: Ctx): AiAnswer {
  const lang = detectLang(q)
  const L = (en: string, hi: string) => (lang === 'hi' ? hi : en)
  const { intent, sku } = classify(q, x)
  const s = x.seller, c = x.c
  const n = s.skus.length
  const trace = [`Read ${n} products and ${x.campaigns.length} campaigns`, `Controls: ${c.goal} goal, ${pct(c.marginFloor)} margin floor, ${c.strategy} pricing`]
  const follow = suggestions(x).filter((f) => f !== q).slice(0, 3)

  switch (intent) {
    case 'plan': {
      const top = topActions(x)
      const total = top.reduce((a, r) => a + r.result.net, 0)
      return {
        intent, lang, trace: [...trace, `Ran the Scale on all ${n} products; kept ${x.p.promos.length} offers, held ${x.p.holds} at full price`],
        text: L(
          `For the **${s.event}**, run **${x.p.promos.length} targeted offers** and leave **${x.p.holds} products at full price**. The five below are worth the most: together about **${money(total)}** after fees, cannibalisation and pulled-forward sales. Everything else either sells anyway or loses money on discount.`,
          `**${s.event}** ke liye **${x.p.promos.length} targeted offers** chalao aur **${x.p.holds} products full price** pe rakho. Neeche ke paanch sabse zyada kamate hain: fees, cannibalisation aur pull-forward ke baad milake lagbhag **${money(total)}**. Baaki products ya toh waise hi bikte hain, ya discount pe ghaata dete hain.`,
        ),
        rows: top.map((r) => ({ label: r.sku.name, sub: `${r.mechanic} · ${pct(r.discount)} for ${r.weeks} wk`, value: money(r.result.net), tone: r.result.net >= 0 ? 'gain' : 'loss', to: `/sku/${r.sku.id}` })),
        actions: [{ label: L('Open the season plan', 'Season plan kholo'), to: '/plan', focus: 'calendar' }, { label: L('See all actions', 'Saare actions dekho'), to: '/', focus: 'actions' }],
        followups: follow,
      }
    }
    case 'risk': {
      const top = risky(x)
      return {
        intent, lang, trace: [...trace, 'Compared weeks of stock against weeks left to sell for every product'],
        text: L(
          `**${inrShort(x.p.stuck)}** of stock won't sell in time at today's pace, across **${x.p.counts['at-risk'] + x.p.counts.slow} products**. These five hold the most money. Clearing them early frees about **${inrShort(x.p.freed)}** for new stock.`,
          `Aaj ki speed pe **${inrShort(x.p.stuck)}** ka stock time pe nahi bikega, **${x.p.counts['at-risk'] + x.p.counts.slow} products** mein. In paanch mein sabse zyada paisa phansa hai. Jaldi clear karoge toh lagbhag **${inrShort(x.p.freed)}** naye stock ke liye free hoga.`,
        ),
        rows: top.map((r) => ({ label: r.sku.name, sub: `${r.sku.ageWeeks} wks old · ${r.mechanic}${r.discount ? ` ${pct(r.discount)}` : ''}`, value: inrShort(atRiskValue(r, c)), tone: 'loss', to: `/sku/${r.sku.id}` })),
        actions: [{ label: L('Open Stock Pulse', 'Stock Pulse kholo'), to: '/pulse', focus: 'pulse-grid' }, { label: L('Plan a clearance ladder', 'Clearance ladder banao'), to: '/plan?tab=clearance', focus: 'ladder' }],
        followups: follow,
      }
    }
    case 'truth': {
      const t = x.truth
      const up = t.promoUnits / Math.max(1, t.baseUnits) - 1
      return {
        intent, lang, trace: [...trace, `Peeled ${t.label}: baseline, subsidy, cannibalisation, pull-forward`],
        text: L(
          `**${t.label}**: units were up **${pct(up)}**, which looked great. But only **${units(t.incremental)}** of the **${units(t.promoUnits)}** units were truly new sales. The rest were buyers who would have paid full price, sales taken from your other products, or next month's sales pulled forward. After all of that it made **${money(t.net)}**. Tarazu's targeted plan on the same event would have made **${money(t.planNet)}**.`,
          `**${t.label}**: units **${pct(up)}** badhe, dikhne mein badhiya. Lekin **${units(t.promoUnits)}** mein se sirf **${units(t.incremental)}** sach mein nayi sales thi. Baaki woh log the jo full price pe bhi lete, aapke doosre products ki sales, ya agle mahine ki sales jo pehle aa gayi. Sab ke baad: **${money(t.net)}**. Usi event pe Tarazu ka targeted plan **${money(t.planNet)}** banata.`,
        ),
        rows: t.steps.map((st) => ({ label: st.label, value: money(st.value), tone: st.value >= 0 ? 'gain' : 'loss' })),
        actions: [{ label: L('Open the sale debrief', 'Sale debrief kholo'), to: '/debrief' }, { label: L('Peel it in Truth Lens', 'Truth Lens mein dekho'), to: '/truth', focus: 'truth-peel' }],
        followups: follow,
      }
    }
    case 'channel': {
      const target = sku ?? s.skus.find((k) => k.id === s.heroSkuId)!
      const rec = recFor(x, target)
      const d = rec.discount || 0.15
      const rows = channelCompare(x, target, d)
      const best = rows[0], worst = rows[rows.length - 1]
      return {
        intent, lang, trace: [...trace, `Priced ${pct(d)} off ${target.line} on ${rows.length} channels with each one's commission, deal fee and shipping`],
        text: L(
          `At **${pct(d)} off**, **${target.name}** earns most on **${best.label}** (**${money(best.r.net)}** over two weeks) and least on **${worst.label}** (**${money(worst.r.net)}**). The difference is fees and how many of that channel's buyers need a discount at all.`,
          `**${pct(d)} off** pe **${target.name}** sabse zyada **${best.label}** pe kamata hai (do hafte mein **${money(best.r.net)}**), aur sabse kam **${worst.label}** pe (**${money(worst.r.net)}**). Farak fees ka hai, aur us channel ke kitne buyers ko discount chahiye hi nahi.`,
        ),
        rows: rows.map((r) => ({ label: r.label, sub: `${units(r.r.promoUnits)} units · fees ${inrShort(r.r.dealFees)}`, value: money(r.r.net), tone: r.r.net >= 0 ? 'gain' : 'loss' })),
        actions: [{ label: L('Open Platform compare', 'Platform compare kholo'), to: '/compare', focus: 'compare-cards' }],
        followups: follow,
      }
    }
    case 'sku': {
      const r = recFor(x, sku!)
      const hold = r.discount === 0
      return {
        intent, lang, trace: [...trace, `Ran the Scale on ${sku!.name} from 0% to 60%`, r.cliff ? `Profit cliff at ${pct(r.cliff)}` : 'No profit cliff within the margin floor'],
        text: hold
          ? L(`**Leave ${sku!.name} at full price.** ${r.why}`, `**${sku!.name} ko full price pe rakho.** ${r.why}`)
          : L(
            `**${r.mechanic} at ${pct(r.discount)} for ${r.weeks} weeks** on **${sku!.name}**: about **${money(r.result.net)}** after everything. ${r.cliff ? `Don't go past **${pct(r.cliff)}**: that's where it starts losing money.` : ''}`,
            `**${sku!.name}** pe **${pct(r.discount)} ka ${r.mechanic.toLowerCase()}, ${r.weeks} hafte**: sab ke baad lagbhag **${money(r.result.net)}**. ${r.cliff ? `**${pct(r.cliff)}** se aage mat jaana, wahan se ghaata shuru hota hai.` : ''}`,
          ),
        rows: hold
          ? (() => {
            const at = simulate(sku!, c, { discount: 0.15, weeks: 2, channel: 'blended' })
            return [
              { label: L('At full price', 'Full price pe'), sub: L(`${units(at.baseUnits)} units in 2 weeks`, `2 hafte mein ${units(at.baseUnits)} units`), value: inrShort(at.baseUnits * sku!.price), tone: 'ink' as const },
              { label: L('If you gave 15% off', 'Agar 15% off diya'), sub: L(`${units(at.baseUnits)} of the ${units(at.promoUnits)} buyers would have paid full price`, `${units(at.promoUnits)} mein se ${units(at.baseUnits)} waise bhi full price dete`), value: money(at.net), tone: at.net >= 0 ? 'gain' as const : 'loss' as const },
              { label: L('Confidence', 'Bharosa'), sub: r.confidenceWhy, value: r.confidence, tone: 'ink' as const },
            ]
          })()
          : [
            { label: L('Given away', 'Diya'), sub: L('discount, cannibalisation, pull-forward, fees', 'discount, cannibalisation, pull-forward, fees'), value: inrShort(r.result.given), tone: 'loss' },
            { label: L('Earned', 'Kamaya'), sub: L('extra units, halo, write-off saved', 'extra units, halo, write-off bachaya'), value: inrShort(r.result.earned), tone: 'gain' },
            { label: L('Confidence', 'Bharosa'), sub: r.confidenceWhy, value: r.confidence, tone: 'ink' },
          ],
        actions: [{ label: L('Weigh it on the Scale', 'Scale pe tolo'), to: `/sku/${sku!.id}`, focus: 'scale' }],
        followups: follow,
      }
    }
    case 'holds': {
      const h = holds(x)
      return {
        intent, lang, trace: [...trace, 'Found products where any discount mostly goes to buyers who pay full price anyway'],
        text: L(
          `Leave **${x.p.holds} products** at full price. They sell well on their own, so a discount would mostly go to buyers who'd pay full price anyway. These are the biggest:`,
          `**${x.p.holds} products** full price pe rakho. Yeh khud bikte hain, discount ka zyada hissa unhi buyers ko jayega jo full price dete. Sabse bade yeh hain:`,
        ),
        rows: h.map((r) => ({ label: r.sku.name, sub: `${units(r.result.baseUnits)} units in ${r.weeks} wk at full price`, value: inrShort(r.result.baseUnits * r.sku.price), tone: 'ink', to: `/sku/${r.sku.id}` })),
        actions: [{ label: L('See them in Stock Pulse', 'Stock Pulse mein dekho'), to: '/pulse', focus: 'pulse-grid' }],
        followups: follow,
      }
    }
    case 'leak': {
      const coded = x.campaigns.filter((k) => k.conditions.some((cc) => cc.kind === 'code') && k.status === 'live')
      const leaky = coded.filter((k) => k.stacking !== 'exclusive' || k.perCustomer === undefined || /mistake|leak|shared/i.test(k.note ?? ''))
      return {
        intent, lang, trace: [...trace, `Checked ${coded.length} live code offers for stacking, per-customer limits and spread`],
        text: leaky.length
          ? L(`**${leaky.length === 1 ? `${leaky[0].name} is` : `${leaky.length} codes are`} at risk of leaking.** ${leaky[0].note ?? 'It stacks with other offers and has no per-customer limit.'} Test it in the Cart Sandbox: the fix is one click.`, `**${leaky.length === 1 ? `${leaky[0].name} leak` : `${leaky.length} codes leak`} ho sakte hain.** ${leaky[0].note ?? 'Yeh doosre offers ke saath stack hota hai aur per-customer limit nahi hai.'} Cart Sandbox mein test karo, fix ek click ka hai.`)
          : L('No live code looks leaky: every code is exclusive or limited per customer.', 'Koi live code leak nahi ho raha: har code exclusive hai ya per-customer limited.'),
        rows: coded.map((k) => ({ label: k.name, sub: `${k.stacking}${k.perCustomer ? `, ${k.perCustomer} per customer` : ', no per-customer limit'}`, value: `${units(k.redeemed)} used`, tone: leaky.includes(k) ? 'loss' : 'ink', to: `/campaigns?id=${k.id}` })),
        actions: [{ label: L('Test it in the Cart Sandbox', 'Cart Sandbox mein test karo'), to: '/sandbox', focus: 'leak' }],
        followups: follow,
      }
    }
    case 'bundle': {
      const b = bestPair(x)
      if (!b) return { intent, lang, trace, text: L('No slow mover has a natural partner right now.', 'Abhi kisi slow mover ka natural partner nahi hai.'), actions: [{ label: 'Bundles', to: '/bundles' }], followups: follow }
      return {
        intent, lang, trace: [...trace, 'Matched slow movers with bestsellers bought by the same customers'],
        text: L(
          `Best pair: **${b.p.slow.line} + ${b.p.anchor.line}** at **${pct(b.d)} off** the pair. ${Math.round(b.p.attach * 100)}% of buyers already pair them. It clears **${units(b.sim.cleared)}** stuck units in four weeks for **${money(b.sim.net)}**.`,
          `Sabse accha pair: **${b.p.slow.line} + ${b.p.anchor.line}**, pair pe **${pct(b.d)} off**. ${Math.round(b.p.attach * 100)}% buyers pehle se dono lete hain. Chaar hafte mein **${units(b.sim.cleared)}** phanse units clear, **${money(b.sim.net)}**.`,
        ),
        actions: [{ label: L('Open Bundles', 'Bundles kholo'), to: '/bundles', focus: 'bundles' }],
        followups: follow,
      }
    }
    case 'loyalty': {
      if (!s.loyalty) return { intent, lang, trace, text: L(`${s.name} doesn't run a points programme, and Tarazu advises against one: ${s.ownChannel ? 'repeat buying is too low to pay for points.' : 'there is no direct relationship with shoppers.'}`, `${s.name} points programme nahi chalate, aur Tarazu bhi mana karta hai: ${s.ownChannel ? 'repeat buying itni kam hai ki points ka kharcha nahi nikalta.' : 'shoppers se seedha rishta nahi hai.'}`), actions: [{ label: 'Loyalty', to: '/loyalty' }], followups: follow }
      const e = programEconomics(s.loyalty, s.loyalty.earnPct, false)
      return {
        intent, lang, trace: [...trace, 'Credited only 30% of members\' extra orders to the programme'],
        text: L(
          `The **${s.loyalty.program}** programme ${e.net >= 0 ? 'pays back' : 'loses money'}: points cost about **${inrShort(e.cost)}** a year, and the extra margin it truly causes is about **${inrShort(e.incMargin)}**, so **${money(e.net)}**. Most members would buy anyway, so only part of their spend counts.`,
          `**${s.loyalty.program}** programme ${e.net >= 0 ? 'paisa wapas laata hai' : 'ghaate mein hai'}: points ka saal ka kharcha lagbhag **${inrShort(e.cost)}**, aur jo extra margin sach mein programme se aata hai woh **${inrShort(e.incMargin)}**, yaani **${money(e.net)}**.`,
        ),
        actions: [{ label: L('Open Loyalty', 'Loyalty kholo'), to: '/loyalty', focus: 'loyalty-economics' }],
        followups: follow,
      }
    }
    case 'trade': {
      if (!s.trade) return { intent, lang, trace, text: L(`${s.name} sells straight to shoppers, so there's no trade spend. Switch to Anaya to see Brand mode.`, `${s.name} seedha shoppers ko bechte hain, trade spend nahi hai. Brand mode dekhne ke liye Anaya pe switch karo.`), actions: [{ label: 'Brand mode', to: '/brand' }], followups: follow }
      const g = grossToNet(s.trade)
      const sorted = [...s.trade.lines].sort((a, b) => roi(a) - roi(b))
      const worst = sorted[0], best = sorted[sorted.length - 1]
      const mv = bestMove(worst, best)
      return {
        intent, lang, trace: [...trace, `Scored ${s.trade.lines.length} trade deals by ROI; searched for the best reallocation`],
        text: L(
          `Cut **${worst.label}** (ROI **${Math.round(roi(worst) * 100)}%**) and move **${inrShort(mv.amount)}** to **${best.label}** (ROI **${Math.round(roi(best) * 100)}%**): **${money(mv.gain)}** more profit on the same budget. Also, **${inrShort(g.disputed)}** of retailer deductions have no agreement behind them.`,
          `**${worst.label}** kaato (ROI **${Math.round(roi(worst) * 100)}%**) aur **${inrShort(mv.amount)}** **${best.label}** mein daalo (ROI **${Math.round(roi(best) * 100)}%**): usi budget mein **${money(mv.gain)}** zyada profit. Aur **${inrShort(g.disputed)}** ke deductions ke peeche koi agreement nahi hai.`,
        ),
        rows: sorted.slice(0, 5).map((l) => ({ label: l.label, sub: l.mechanism, value: `${Math.round(roi(l) * 100)}%`, tone: roi(l) >= 0 ? 'gain' : 'loss' })),
        actions: [{ label: L('Open Brand mode', 'Brand mode kholo'), to: '/brand', focus: 'tpo' }],
        followups: follow,
      }
    }
    case 'fatigue': {
      const dep = dependency(x)
      const habit = x.campaigns.find((k) => /sitewide|habit|everything/i.test(k.name))
      return {
        intent, lang, trace: [...trace, 'Measured the share of units sold on discount over the last 8 weeks'],
        text: L(
          `**${pct(dep)} of units** now sell only on discount${dep >= 0.4 ? ': buyers have learned to wait for the next sale' : ''}. ${habit ? `**${habit.name}** has spent **${inrShort(habit.spent)}** of **${inrShort(habit.budget)}**. ` : ''}Tarazu's plan puts only the products that need it on offer, which lowers the share and keeps full-price buyers paying full price.`,
          `Ab **${pct(dep)} units** sirf discount pe bikte hain${dep >= 0.4 ? ': buyers agli sale ka intezaar karna seekh gaye hain' : ''}. ${habit ? `**${habit.name}** ne **${inrShort(habit.budget)}** mein se **${inrShort(habit.spent)}** kharch kar diya. ` : ''}Tarazu ka plan sirf zaroori products pe offer lagata hai.`,
        ),
        actions: [{ label: L('See the fatigue gauge', 'Fatigue gauge dekho'), to: '/', focus: 'fatigue' }, { label: L('Compare Hi-Lo vs EDLP', 'Hi-Lo vs EDLP dekho'), to: '/plan?tab=duel', focus: 'duel' }],
        followups: follow,
      }
    }
    case 'rival': {
      const target = sku ?? s.skus.find((k) => k.id === s.heroSkuId)!
      const rec = recFor(x, target)
      const cut = Math.max(0.1, x.c.competitorPrice || 0.12)
      const rivalC = { ...x.c, competitorPrice: cut }
      const hold = simulate(target, rivalC, { discount: 0, weeks: 2, channel: 'blended' })
      const match = simulate(target, rivalC, { discount: cut, weeks: 2, channel: 'blended' })
      const tz = simulate(target, rivalC, { discount: Math.min(rec.floorMaxDiscount, Math.round((cut / 2) * 100) / 100), weeks: 2, channel: 'blended' })
      const options = [{ k: L('Hold your price', 'Price hold karo'), r: hold, d: 0 }, { k: L(`Match the ${pct(cut)} cut`, `${pct(cut)} match karo`), r: match, d: cut }, { k: L(`Partial match (${pct(tz.discount)})`, `Aadha match (${pct(tz.discount)})`), r: tz, d: tz.discount }]
      const bestO = [...options].sort((a, b) => b.r.net - a.r.net)[0]
      return {
        intent, lang, trace: [...trace, `Simulated a rival ${pct(cut)} cheaper on ${target.line}: hold, match and partial match`],
        text: L(
          `If a rival is **${pct(cut)} cheaper** on **${target.line}**, the best move over two weeks is **${bestO.k.toLowerCase()}** (**${money(bestO.r.net)}** vs doing nothing). Matching fully pays the discount to every loyal buyer too.`,
          `Agar rival **${target.line}** pe **${pct(cut)} sasta** hai, do hafte ke liye sabse accha: **${bestO.k.toLowerCase()}** (kuch na karne ke muqable **${money(bestO.r.net)}**). Poora match karoge toh har loyal buyer ko bhi discount dena padega.`,
        ),
        rows: options.map((o) => ({ label: o.k, sub: `${pct(o.d)} off · ${units(o.r.promoUnits)} units`, value: money(o.r.net), tone: o.r.net >= 0 ? 'gain' : 'loss' })),
        actions: [{ label: L('Open the Scale', 'Scale kholo'), to: `/sku/${target.id}`, focus: 'scale' }],
        followups: follow,
      }
    }
    default:
      return {
        intent: 'help', lang, trace,
        text: L(
          `I can answer from ${s.name}'s numbers: what to run for the ${s.event}, how deep to discount a product, which channel earns most, what's stuck, whether a past sale made money, leaking coupons, bundles${s.loyalty ? ', loyalty' : ''}${s.trade ? ', trade spend' : ''}. Try one of these:`,
          `Main ${s.name} ke numbers se jawab de sakta hoon: ${s.event} ke liye kya chalayein, kitna discount, kaunsa channel, kya phansa hai, pichli sale ka profit, coupon leak, bundles. Inme se poocho:`,
        ),
        actions: [],
        followups: suggestions(x).slice(0, 4),
      }
  }
}
