import { useMemo } from 'react'
import { useStore } from './store'
import { portfolio, recommend, truthLens } from '@/engine/engine'
import { SELLER_BY_ID, skuOf } from '@/data/sellers'

export const useControls = () => useStore((s) => s.controls)
export const useSeller = () => SELLER_BY_ID[useStore((s) => s.sellerId)]
export const useCampaigns = () => useStore((s) => s.campaigns[s.sellerId])

export function usePortfolio() {
  const c = useControls()
  const s = useSeller()
  return useMemo(() => portfolio(s.skus, c), [s, c])
}
export function useRec(id: string) {
  const c = useControls()
  const s = useSeller()
  return useMemo(() => { const k = skuOf(s, id); return k ? recommend(k, c) : null }, [s, id, c])
}
export function useTruth() {
  const c = useControls()
  const s = useSeller()
  return useMemo(() => truthLens(s.skus, c, s.history), [s, c])
}
export function useSku(id: string) {
  const s = useSeller()
  return useMemo(() => skuOf(s, id), [s, id])
}
