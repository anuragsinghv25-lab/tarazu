import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from '@/layout/AppShell'
import { ControlRoom } from '@/layout/ControlRoom'
import { CommandPalette } from '@/layout/CommandPalette'
import { SellerQuiz } from '@/layout/SellerQuiz'
import { Overview } from '@/features/overview/Overview'
import { BootSplash } from '@/layout/BootSplash'
import { RouteSkeleton } from '@/components/Skeleton'

/* Each screen is its own chunk. The loaders are kept so the boot splash can fetch them all up front. */
const loaders = {
  StockPulse: () => import('@/features/pulse/StockPulse'),
  SkuDetail: () => import('@/features/sku/SkuDetail'),
  TruthLens: () => import('@/features/truth/TruthLens'),
  PlatformCompare: () => import('@/features/compare/PlatformCompare'),
  CampaignBuilder: () => import('@/features/campaigns/CampaignBuilder'),
  CartSandbox: () => import('@/features/sandbox/CartSandbox'),
  SeasonPlan: () => import('@/features/plan/SeasonPlan'),
  Bundles: () => import('@/features/bundles/Bundles'),
  Loyalty: () => import('@/features/loyalty/Loyalty'),
  BrandMode: () => import('@/features/brand/BrandMode'),
  Sellers: () => import('@/features/sellers/Sellers'),
}
const PRELOAD = Object.values(loaders) as (() => Promise<unknown>)[]
const page = <K extends keyof typeof loaders>(name: K) =>
  lazy(() => loaders[name]().then((m) => ({ default: (m as Record<string, unknown>)[name] as React.ComponentType })))

const StockPulse = page('StockPulse')
const SkuDetail = page('SkuDetail')
const TruthLens = page('TruthLens')
const PlatformCompare = page('PlatformCompare')
const CampaignBuilder = page('CampaignBuilder')
const CartSandbox = page('CartSandbox')
const SeasonPlan = page('SeasonPlan')
const Bundles = page('Bundles')
const Loyalty = page('Loyalty')
const BrandMode = page('BrandMode')
const Sellers = page('Sellers')

export default function App() {
  return (
    <>
    <AppShell>
      <Suspense fallback={<RouteSkeleton />}>
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
      <Toaster position="bottom-left" toastOptions={{ style: { background: '#0b3d2e', color: '#fff7e9', border: '1px solid #164b3a', fontFamily: 'var(--font-sans)' }, descriptionClassName: '!text-[#c9d8d0]' }} />
    </AppShell>
    <BootSplash preload={PRELOAD} />
    </>
  )
}
