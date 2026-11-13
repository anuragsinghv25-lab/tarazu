import { describe, expect, it } from 'vitest'
import { SELLERS, controlsFor } from '@/data/sellers'
import { makeCtx } from '../context'
import { answer, suggestions, detectLang } from '../ask'
import { scan } from '../watch'
import { debrief } from '../debrief'
import { draft } from '../copy'
import { buildPlan, examples, parseBrief } from '../brief'

const bad = /NaN|undefined|Infinity|\[object/
const G = { maxMarkdown: 0.3, maxSpend: 15000, protectBestsellers: true }

describe('AI layer', () => {
  for (const s of SELLERS) {
    const x = makeCtx(s, controlsFor(s), s.campaigns)
    it(`${s.name}: every suggested question gets a specific, clean answer`, () => {
      for (const q of suggestions(x)) {
        const a = answer(q, x)
        const all = [a.text, ...(a.rows ?? []).flatMap((r) => [r.label, r.sub ?? '', r.value])].join(' ')
        expect(all, q).not.toMatch(bad)
        expect(a.intent, q).not.toBe('help')
      }
    })
    it(`${s.name}: watchtower, debrief, copy and brief are clean`, () => {
      const alerts = scan(x, G)
      expect(alerts.length).toBeGreaterThan(1)
      alerts.forEach((al) => expect(al.title + al.body).not.toMatch(bad))
      const d = debrief(s, controlsFor(s))
      expect([d.headline, d.summary, ...d.changes].join(' ')).not.toMatch(bad)
      for (const c of s.campaigns) for (const lang of ['en', 'hinglish', 'hi'] as const) {
        draft(c, s, 'festive', lang).forEach((dr) => expect(dr.text, `${c.id} ${lang}`).not.toMatch(bad))
      }
      for (const e of examples(s)) {
        const p = parseBrief(e, s)
        expect(p.chips.length, e).toBeGreaterThan(0)
        const plan = buildPlan(s, controlsFor(s), p)
        expect(plan.items.length, e).toBeGreaterThan(0)
      }
    })
  }
  it('detects Hinglish', () => {
    expect(detectLang('Big Billion Days mein kya daalun?')).toBe('hi')
    expect(detectLang('What should I run?')).toBe('en')
  })
})
