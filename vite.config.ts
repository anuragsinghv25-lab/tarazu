import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { markMarkup, VIEWBOX } from './src/brand/mark'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      /* Inlines the Tarazu mark into the boot splash so it paints before any JS runs. */
      name: 'tarazu-boot-mark',
      transformIndexHtml: (html) => html.replace('<!--tz:mark-->', `<svg viewBox="${VIEWBOX}" aria-hidden="true">${markMarkup('brand', false, true)}</svg>`),
    },
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
