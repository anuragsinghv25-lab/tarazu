import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from '@/layout/AppShell'
import { ControlRoom } from '@/layout/ControlRoom'
import { CommandPalette } from '@/layout/CommandPalette'
import { SellerQuiz } from '@/layout/SellerQuiz'
import { Overview } from '@/features/overview/Overview'

const page = <T extends Record<string, unknown>>(load: () => Promise<T>, name: keyof T) =>
  lazy(() => load().then((m) => ({ default: m[name] as React.ComponentType })))

const StockPulse = page(() => import('@/features/pulse/StockPulse'), 'StockPulse')
const SkuDetail = page(() => import('@/features/sku/SkuDetail'), 'SkuDetail')
const TruthLens = page(() => import('@/features/truth/TruthLens'), 'TruthLens')
const PlatformCompare = page(() => import('@/features/compare/PlatformCompare'), 'PlatformCompare')
const CampaignBuilder = page(() => import('@/features/campaigns/CampaignBuilder'), 'CampaignBuilder')
const CartSandbox = page(() => import('@/features/sandbox/CartSandbox'), 'CartSandbox')
const SeasonPlan = page(() => import('@/features/plan/SeasonPlan'), 'SeasonPlan')
const Bundles = page(() => import('@/features/bundles/Bundles'), 'Bundles')
const Loyalty = page(() => import('@/features/loyalty/Loyalty'), 'Loyalty')
const BrandMode = page(() => import('@/features/brand/BrandMode'), 'BrandMode')
const Sellers = page(() => import('@/features/sellers/Sellers'), 'Sellers')

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
          <Route path="/campaigns" element={<CampaignBuilder />} />
          <Route path="/sandbox" element={<CartSandbox />} />
          <Route path="/plan" element={<SeasonPlan />} />
          <Route path="/bundles" element={<Bundles />} />
          <Route path="/loyalty" element={<Loyalty />} />
          <Route path="/brand" element={<BrandMode />} />
          <Route path="/sellers" element={<Sellers />} />
          <Route path="*" element={<Overview />} />
        </Routes>
      </Suspense>
      <ControlRoom />
      <CommandPalette />
      <SellerQuiz />
      <Toaster position="bottom-left" toastOptions={{ style: { background: '#1c1a17', color: '#f5efe3', border: '1px solid #2e2a24', fontFamily: 'var(--font-sans)' }, descriptionClassName: '!text-[#cfc6b4]' }} />
    </AppShell>
  )
}
