/* Generates the favicon, app icons and web manifest from the single mark geometry.
   Run: node scripts/brand-icons.ts   (Node 22+, needs rsvg-convert and ImageMagick for the PNG/ICO files) */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { markMarkup, PALETTE, VIEWBOX, type MarkTone } from '../src/brand/mark.ts'

const out = join(import.meta.dirname, '..', 'public')
mkdirSync(out, { recursive: true })

/** A square icon: background, optional rounding, the mark centred at `scale` of the width. */
function icon({ size = 512, bg, radius, tone, scale, simple = false, border }: { size?: number; bg: string; radius: number; tone: MarkTone; scale: number; simple?: boolean; border?: string }) {
  const w = size * scale, h = (w * 104) / 120
  const x = (size - w) / 2, y = (size - h) / 2 + size * 0.01
  const frame = border
    ? `<rect x="${size * 0.03}" y="${size * 0.03}" width="${size * 0.94}" height="${size * 0.94}" rx="${radius * 0.94}" fill="${bg}" stroke="${border}" stroke-width="${size * 0.045}"/>`
    : `<rect width="${size}" height="${size}" rx="${radius}" fill="${bg}"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${frame}<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${VIEWBOX}">${markMarkup(tone, simple)}</svg></svg>\n`
}

const files: Record<string, string> = {
  /* Favicon (filled): dark square, white simplified mark — legible at 16 px. */
  'favicon.svg': icon({ size: 64, bg: PALETTE.primary, radius: 14, tone: 'solidOnDark', scale: 0.8, simple: true }),
  /* Favicon (outline): for light browser chrome that wants a lighter tab icon. */
  'favicon-outline.svg': icon({ size: 64, bg: PALETTE.cream, radius: 14, tone: 'solidOnLight', scale: 0.72, simple: true, border: PALETTE.primary }),
  /* App icons, full detail. */
  'icon-dark.svg': icon({ bg: PALETTE.primary, radius: 112, tone: 'onDark', scale: 0.74 }),
  'icon-light.svg': icon({ bg: PALETTE.cream, radius: 112, tone: 'brand', scale: 0.74 }),
}
for (const [name, svg] of Object.entries(files)) writeFileSync(join(out, name), svg)

/* PNGs for platforms that don't take SVG. Apple and maskable icons are full-bleed (the OS rounds them). */
const tmp = join(import.meta.dirname, '.icons-tmp'); mkdirSync(tmp, { recursive: true })
const png = (svg: string, size: number, name: string) => {
  const src = join(tmp, `${name}.svg`); writeFileSync(src, svg)
  execFileSync('rsvg-convert', ['-w', String(size), '-h', String(size), src, '-o', join(out, name)])
}
png(icon({ bg: PALETTE.primary, radius: 0, tone: 'onDark', scale: 0.7 }), 180, 'apple-touch-icon.png')
png(files['icon-dark.svg'], 192, 'icon-192.png')
png(files['icon-dark.svg'], 512, 'icon-512.png')
png(icon({ bg: PALETTE.primary, radius: 0, tone: 'onDark', scale: 0.56 }), 512, 'icon-maskable-512.png')
for (const s of [16, 32, 48]) png(icon({ size: 64, bg: PALETTE.primary, radius: 14, tone: 'solidOnDark', scale: 0.8, simple: true }), s, `fav-${s}.png`)
execFileSync('convert', [join(out, 'fav-16.png'), join(out, 'fav-32.png'), join(out, 'fav-48.png'), join(out, 'favicon.ico')])
execFileSync('rm', ['-rf', tmp, join(out, 'fav-16.png'), join(out, 'fav-48.png')])
execFileSync('mv', [join(out, 'fav-32.png'), join(out, 'favicon-32.png')])

writeFileSync(join(out, 'site.webmanifest'), JSON.stringify({
  name: 'Tarazu · Promotion intelligence for sellers',
  short_name: 'Tarazu',
  description: 'Weigh every discount: what a promotion costs against what it truly earns.',
  start_url: '/',
  display: 'standalone',
  background_color: PALETTE.cream,
  theme_color: PALETTE.primary,
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: '/icon-dark.svg', sizes: 'any', type: 'image/svg+xml' },
  ],
}, null, 2) + '\n')
console.log('icons written to public/')
