/* The Tarazu mark: a balance scale with a price tag in one pan and a bar chart in the other,
   a spark above the beam. One geometry, used by the React components and by the icon generator
   (scripts/brand-icons.ts), so the favicon, app icons and in-app logo never drift apart.
   viewBox 0 0 120 104. The beam pivots at (60, 29). */

export const VIEWBOX = '0 0 120 104'
export const PIVOT = { x: 60, y: 29 }

export const PALETTE = {
  primary: '#0b3d2e',
  amber: '#f59e0b',
  cream: '#fff7e9',
  surface: '#e7f3ec',
  white: '#ffffff',
} as const

export const GEOMETRY = {
  spark: 'M60 1.5 Q61.7 7.3 67.5 9 Q61.7 10.7 60 16.5 Q58.3 10.7 52.5 9 Q58.3 7.3 60 1.5Z',
  arcLeft: 'M21 23 Q33 12.5 49.5 10.2',
  arcRight: 'M70.5 10.2 Q87 12.5 99 23',
  finial: { cx: 60, cy: 25.5, r: 4.6 },
  beam: { x: 13, y: 26.5, w: 94, h: 6, rx: 3 },
  post: { x: 56.4, y: 28, w: 7.2, h: 58, rx: 2 },
  base: 'M37 97 Q37 84.5 60 84.5 Q83 84.5 83 97 Z',
  /* Each side hangs from a beam end: strings, pan and the glyph that sits in it. */
  leftStrings: 'M6 64 L22 31.5 L38 64',
  rightStrings: 'M82 64 L98 31.5 L114 64',
  leftPan: 'M3.5 63 H40.5 A18.5 13.5 0 0 1 3.5 63 Z',
  rightPan: 'M79.5 63 H116.5 A18.5 13.5 0 0 1 79.5 63 Z',
  /* A price tag, tilted, in the left pan: the discount being weighed. */
  tag: { d: 'M-8 -4.6 H3.2 L8.6 0 L3.2 4.6 H-8 Q-9.6 4.6 -9.6 3 V-3 Q-9.6 -4.6 -8 -4.6Z', hole: { cx: -5, cy: 0, r: 1.5 }, transform: 'translate(22 53.5) rotate(-38) scale(1.3)' },
  /* Rising bars in the right pan: what the discount truly earns. */
  bars: [{ x: 88.6, y: 54, w: 5, h: 7.4 }, { x: 95.5, y: 49.5, w: 5, h: 11.9 }, { x: 102.4, y: 44, w: 5, h: 17.4 }],
}

export type MarkTone = 'brand' | 'onDark' | 'solidOnDark' | 'solidOnLight'

/** Colours per tone: structure, pans, glyphs, the knockout behind the tag hole, spark/arc. */
export function toneColors(tone: MarkTone) {
  switch (tone) {
    case 'onDark': return { structure: PALETTE.white, pan: PALETTE.amber, glyph: PALETTE.amber, knock: PALETTE.primary, spark: PALETTE.amber }
    case 'solidOnDark': return { structure: PALETTE.white, pan: PALETTE.white, glyph: PALETTE.white, knock: PALETTE.primary, spark: PALETTE.white }
    case 'solidOnLight': return { structure: PALETTE.primary, pan: PALETTE.primary, glyph: PALETTE.primary, knock: PALETTE.cream, spark: PALETTE.primary }
    default: return { structure: PALETTE.primary, pan: PALETTE.amber, glyph: PALETTE.amber, knock: PALETTE.cream, spark: PALETTE.amber }
  }
}

/** The mark as an SVG string (no outer <svg>). `simple` drops the glyphs and arcs for 16–32 px sizes;
 *  `animated` adds the tz-* classes the boot splash uses to swing the beam. */
export function markMarkup(tone: MarkTone, simple = false, animated = false) {
  const c = toneColors(tone)
  const g = GEOMETRY
  const cls = (name: string) => (animated ? ` class="${name}"` : '')
  const stroke = (d: string, color: string, w: number) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
  const rect = (r: { x: number; y: number; w: number; h: number; rx?: number }, fill: string, extra = '') => `<rect${extra} x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${r.rx ?? 0.8}" fill="${fill}"/>`
  const sw = simple ? 3.6 : 2.4
  return [
    `<path${cls('tz-spark')} d="${g.spark}" fill="${c.spark}"/>`,
    simple ? '' : stroke(g.arcLeft, c.spark, 2.6) + stroke(g.arcRight, c.spark, 2.6),
    rect(g.post, c.structure),
    `<path d="${g.base}" fill="${c.structure}"/>`,
    `<g${cls('tz-pan-l')}>`, stroke(g.leftStrings, c.structure, sw), `<path d="${g.leftPan}" fill="${c.pan}"/>`,
    simple ? '' : `<g transform="${g.tag.transform}"><path d="${g.tag.d}" fill="${c.glyph}"/><circle cx="${g.tag.hole.cx}" cy="${g.tag.hole.cy}" r="${g.tag.hole.r}" fill="${c.knock}"/></g>`,
    '</g>',
    `<g${cls('tz-pan-r')}>`, stroke(g.rightStrings, c.structure, sw), `<path d="${g.rightPan}" fill="${c.pan}"/>`,
    simple ? '' : g.bars.map((b) => rect(b, c.glyph)).join(''),
    '</g>',
    rect(g.beam, c.structure, cls('tz-beam')),
    `<circle cx="${g.finial.cx}" cy="${g.finial.cy}" r="${g.finial.r}" fill="${c.structure}"/>`,
  ].join('')
}
