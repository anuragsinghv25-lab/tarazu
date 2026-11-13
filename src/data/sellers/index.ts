import type { Controls } from '@/engine/types'
import type { SellerDef, SellerId } from './types'
import { meera } from './meera'
import { farhan } from './farhan'
import { kabir } from './kabir'
import { anaya } from './anaya'

export type { SellerDef, SellerId } from './types'

export const SELLERS: SellerDef[] = [meera, farhan, kabir, anaya]
export const SELLER_BY_ID = Object.fromEntries(SELLERS.map((s) => [s.id, s])) as Record<SellerId, SellerDef>
export const isSellerId = (v: unknown): v is SellerId => typeof v === 'string' && v in SELLER_BY_ID

export const controlsFor = (s: SellerDef): Controls => ({ ...s.knobs, market: s.market })
export const skuOf = (s: SellerDef, id: string) => s.skus.find((k) => k.id === id)
