import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'

/* Skeleton loaders. Primitives match the real components' boxes (Card radius, header and
   KPI heights), and each screen gets a skeleton laid out like the screen itself, so the
   page doesn't jump when the real content replaces it. */

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden className={cn('skeleton', className)} style={style} />
}

function Shell({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div aria-hidden className={cn('rounded-[var(--radius-card)] border border-rule-2 bg-card/70 p-5', className)}>{children}</div>
}

export function HeaderSkeleton({ aside }: { aside?: boolean }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="w-full max-w-2xl">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-3 h-9 w-[min(460px,90%)]" />
        <Skeleton className="mt-2 h-9 w-[min(340px,70%)]" />
        <Skeleton className="mt-4 h-3.5 w-full" />
        <Skeleton className="mt-2 h-3.5 w-4/5" />
      </div>
      {aside && <Skeleton className="hidden h-[72px] w-[200px] rounded-2xl md:block" />}
    </div>
  )
}

export function KpiSkeleton({ n = 4 }: { n?: number }) {
  return (
    <div className={cn('mb-6 grid grid-cols-2 gap-3', n === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4')}>
      {Array.from({ length: n }, (_, i) => <Shell key={i} className="p-4"><Skeleton className="h-2.5 w-20" /><Skeleton className="mt-3 h-7 w-28" /><Skeleton className="mt-2.5 h-2.5 w-32" /></Shell>)}
    </div>
  )
}

export function CardSkeleton({ lines = 3, className, title = true }: { lines?: number; className?: string; title?: boolean }) {
  return (
    <Shell className={className}>
      {title && <><Skeleton className="h-2.5 w-24" /><Skeleton className="mt-2.5 mb-4 h-5 w-3/5" /></>}
      <div className="space-y-2.5">{Array.from({ length: lines }, (_, i) => <Skeleton key={i} className="h-3" style={{ width: `${92 - ((i * 17) % 35)}%` }} />)}</div>
    </Shell>
  )
}

export function ChartSkeleton({ height = 240, className, bars = 12 }: { height?: number; className?: string; bars?: number }) {
  return (
    <Shell className={className}>
      <Skeleton className="h-2.5 w-28" /><Skeleton className="mt-2.5 h-5 w-1/2" />
      <div className="mt-5 flex items-end gap-2 border-b border-rule-2" style={{ height }}>
        {Array.from({ length: bars }, (_, i) => <Skeleton key={i} className="flex-1 rounded-b-none" style={{ height: `${30 + ((i * 37) % 60)}%` }} />)}
      </div>
    </Shell>
  )
}

export function TableSkeleton({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <Shell className={className}>
      <Skeleton className="h-2.5 w-24" /><Skeleton className="mt-2.5 mb-4 h-5 w-2/5" />
      <div className="divide-y divide-rule-2">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <div className="flex-1"><Skeleton className="h-3 w-1/2" /><Skeleton className="mt-1.5 h-2.5 w-1/3" /></div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </Shell>
  )
}

export function TileGridSkeleton({ n = 48 }: { n?: number }) {
  return (
    <Shell>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-8">
        {Array.from({ length: n }, (_, i) => <Skeleton key={i} className="aspect-[1/0.9] rounded-lg" />)}
      </div>
    </Shell>
  )
}

type Variant = 'overview' | 'grid' | 'scale' | 'truth' | 'compare' | 'builder' | 'sandbox' | 'plan' | 'split' | 'loyalty' | 'brand' | 'sellers'

const ROUTES: [string, Variant][] = [
  ['/pulse', 'grid'], ['/sku', 'scale'], ['/truth', 'truth'], ['/compare', 'compare'], ['/campaigns', 'builder'], ['/sandbox', 'sandbox'],
  ['/plan', 'plan'], ['/bundles', 'split'], ['/loyalty', 'loyalty'], ['/brand', 'brand'], ['/sellers', 'sellers'],
]

/** Suspense fallback for routes: picks the skeleton that matches the screen being opened. */
export function RouteSkeleton() {
  const { pathname } = useLocation()
  const v = ROUTES.find(([p]) => pathname.startsWith(p))?.[1] ?? 'overview'
  return (
    <div role="status" aria-busy="true" aria-label="Loading screen">
      <PageSkeleton variant={v} />
    </div>
  )
}

export function PageSkeleton({ variant }: { variant: Variant }) {
  switch (variant) {
    case 'grid': return <><HeaderSkeleton /><KpiSkeleton /><div className="grid gap-5 xl:grid-cols-[1fr_320px]"><TileGridSkeleton /><CardSkeleton lines={7} /></div></>
    case 'scale': return <><HeaderSkeleton /><div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]"><Shell className="h-[380px]"><Skeleton className="mx-auto mt-8 h-[260px] w-[80%] rounded-[40px]" /></Shell><CardSkeleton lines={8} /></div><ChartSkeleton className="mt-5" height={200} bars={20} /></>
    case 'truth': return <><HeaderSkeleton /><div className="mb-5 h-[150px] rounded-[var(--radius-card)] bg-primary/90" /><div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]"><ChartSkeleton height={260} /><CardSkeleton lines={7} /></div></>
    case 'compare': return <><HeaderSkeleton /><CardSkeleton lines={2} className="mb-5" title={false} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <CardSkeleton key={i} lines={7} />)}</div></>
    case 'builder': return <><HeaderSkeleton /><div className="grid gap-5 xl:grid-cols-[260px_1fr_300px]"><TableSkeleton rows={7} /><div className="space-y-3">{[0, 1, 2, 3].map((i) => <CardSkeleton key={i} lines={2} />)}</div><ChartSkeleton height={160} bars={10} /></div></>
    case 'sandbox': return <><HeaderSkeleton /><div className="grid gap-5 xl:grid-cols-[1fr_1fr_340px]"><TileGridSkeleton n={12} /><CardSkeleton lines={6} /><CardSkeleton lines={9} /></div><TableSkeleton className="mt-5" rows={5} /></>
    case 'plan': return <><HeaderSkeleton /><Shell><div className="space-y-2.5">{Array.from({ length: 10 }, (_, i) => <div key={i} className="flex items-center gap-3"><Skeleton className="h-3 w-40" /><Skeleton className="h-5 rounded-md" style={{ marginLeft: `${(i * 23) % 40}%`, width: `${18 + ((i * 13) % 30)}%` }} /></div>)}</div></Shell></>
    case 'split': return <><HeaderSkeleton /><div className="grid gap-5 xl:grid-cols-[1fr_380px]"><TableSkeleton rows={6} /><CardSkeleton lines={9} /></div></>
    case 'loyalty': return <><HeaderSkeleton /><KpiSkeleton /><div className="grid gap-5 xl:grid-cols-2"><ChartSkeleton height={180} /><CardSkeleton lines={6} /></div></>
    case 'brand': return <><HeaderSkeleton /><KpiSkeleton /><ChartSkeleton height={240} bars={11} /><div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]"><TableSkeleton rows={7} /><CardSkeleton lines={8} /></div></>
    case 'sellers': return <><HeaderSkeleton /><div className="grid gap-5 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <Shell key={i} className="h-[380px] p-0"><Skeleton className="h-[120px] rounded-b-none" /><div className="space-y-2.5 p-6"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" /></div></Shell>)}</div></>
    default: return <><HeaderSkeleton aside /><Shell className="mb-8 h-[190px]"><div className="grid h-full grid-cols-3 gap-6">{[0, 1, 2].map((i) => <div key={i}><Skeleton className="h-2.5 w-24" /><Skeleton className="mt-3 h-10 w-32" /><Skeleton className="mt-3 h-3 w-4/5" /><Skeleton className="mt-2 h-3 w-3/5" /></div>)}</div></Shell><div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]"><TableSkeleton rows={6} /><div className="space-y-5"><CardSkeleton lines={3} /><CardSkeleton lines={4} /></div></div></>
  }
}
