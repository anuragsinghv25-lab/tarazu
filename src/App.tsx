import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from '@/layout/AppShell'
import { ControlRoom } from '@/layout/ControlRoom'
import { CommandPalette } from '@/layout/CommandPalette'
import { Overview } from '@/features/overview/Overview'
const StockPulse = lazy(() => import('@/features/pulse/StockPulse').then((m) => ({ default: m.StockPulse })))
const SkuDetail = lazy(() => import('@/features/sku/SkuDetail').then((m) => ({ default: m.SkuDetail })))
const TruthLens = lazy(() => import('@/features/truth/TruthLens').then((m) => ({ default: m.TruthLens })))
const PlatformCompare = lazy(() => import('@/features/compare/PlatformCompare').then((m) => ({ default: m.PlatformCompare })))

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={<div className="h-[60vh]" />}>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/pulse" element={<StockPulse />} />
        <Route path="/sku/:id" element={<SkuDetail />} />
        <Route path="/truth" element={<TruthLens />} />
        <Route path="/compare" element={<PlatformCompare />} />
        <Route path="*" element={<Overview />} />
      </Routes>
      </Suspense>
      <ControlRoom />
      <CommandPalette />
      <Toaster position="bottom-left" toastOptions={{ style: { background: '#1c1a17', color: '#f5efe3', border: '1px solid #2e2a24', fontFamily: 'var(--font-sans)' }, descriptionClassName: '!text-[#cfc6b4]' }} />
    </AppShell>
  )
}
