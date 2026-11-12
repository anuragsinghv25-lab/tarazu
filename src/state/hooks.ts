import { useMemo } from 'react'
import { useStore } from './store'
import { portfolio, recommend, truthLens } from '@/engine/engine'
import { skus, getSku } from '@/data/meera'

export const useControls = () => useStore((s) => s.controls)
export function usePortfolio() {
  const c = useControls()
  return useMemo(() => portfolio(skus, c), [c])
}
export function useRec(id: string) {
  const c = useControls()
  return useMemo(() => { const s = getSku(id); return s ? recommend(s, c) : null }, [id, c])
}
export function useTruth() {
  const c = useControls()
  return useMemo(() => truthLens(skus, c), [c])
}
