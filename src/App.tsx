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
import { StoryMode } from '@/features/case/StoryMode'

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
  Ask: () => import('@/features/mind/Ask'),
  Brief: () => import('@/features/mind/Brief'),
  Watchtower: () => import('@/features/mind/Watchtower'),
  Debrief: () => import('@/features/mind/Debrief'),
  CopyStudio: () => import('@/features/mind/CopyStudio'),
  CaseStudy: () => import('@/features/case/CaseStudy'),
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
const Ask = page('Ask')
const Brief = page('Brief')
const Watchtower = page('Watchtower')
const Debrief = page('Debrief')
const CopyStudio = page('CopyStudio')
const CaseStudy = page('CaseStudy')

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
          <Route path="/ask" element={<Ask />} />
          <Route path="/brief" element={<Brief />} />
          <Route path="/watchtower" element={<Watchtower />} />
          <Route path="/debrief" element={<Debrief />} />
          <Route path="/copy" element={<CopyStudio />} />
          <Route path="/case-study" element={<CaseStudy />} />
          <Route path="*" element={<Overview />} />
        </Routes>
      </Suspense>
      <ControlRoom />
      <CommandPalette />
      <SellerQuiz />
      <StoryMode />
      <Toaster position="bottom-left" toastOptions={{ style: { background: 'var(--color-toast)', color: 'var(--color-toast-ink)', border: '1px solid var(--color-rule)', fontFamily: 'var(--font-sans)' }, descriptionClassName: '!text-[var(--color-toast-sub)]' }} />
    </AppShell>
    <BootSplash preload={PRELOAD} />
    </>
  )
}
