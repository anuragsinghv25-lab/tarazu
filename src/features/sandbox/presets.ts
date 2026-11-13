import type { Cart, CartLine, Controls } from '@/engine/types'
import type { SellerDef, SellerId } from '@/data/sellers'
import type { CartCtx } from '@/engine/cart'
import { feeFor } from '@/engine/engine'

/* Preset carts per seller and the checkout context, shared by the Cart Sandbox and the Watchtower. */
export const MAX_ORDER: Record<SellerId, number> = { meera: 0.25, farhan: 0.35, kabir: 0.22, anaya: 0.2 }

export type Preset = { label: string; cart: Partial<Cart> & { lines: CartLine[] } }
export const PRESETS: Record<SellerId, Preset[]> = {
  meera: [
    { label: 'Regular regimen', cart: { channel: 'website', segment: 'regular', payment: 'upi', code: '', lines: [{ skuId: 'kumkumadi-glow-serum-30-ml', qty: 1 }, { skuId: 'rose-toner-200-ml', qty: 1 }, { skuId: 'ubtan-face-wash-100-ml', qty: 2 }] } },
    { label: 'Influencer code leak', cart: { channel: 'website', segment: 'regular', payment: 'upi', code: 'GLOW15', lines: [{ skuId: 'kumkumadi-glow-serum-30-ml', qty: 1 }, { skuId: 'rose-toner-200-ml', qty: 1 }, { skuId: 'ubtan-face-wash-100-ml', qty: 2 }] } },
    { label: 'Lapsed buyer returns', cart: { channel: 'website', segment: 'lapsed', payment: 'credit-card', code: '', lines: [{ skuId: 'kumkumadi-glow-serum-30-ml', qty: 1 }, { skuId: 'aloe-day-moisturiser-50-g', qty: 1 }] } },
    { label: 'New buyer, small cart', cart: { channel: 'website', segment: 'new', payment: 'upi', code: '', lines: [{ skuId: 'beetroot-lip-balm-regular', qty: 1 }, { skuId: 'rose-toner-200-ml', qty: 1 }] } },
    { label: 'Gold member stocks up', cart: { channel: 'website', segment: 'gold', payment: 'upi', code: '', lines: [{ skuId: 'kumkumadi-glow-serum-30-ml', qty: 2 }, { skuId: 'neem-soap-single', qty: 3 }, { skuId: 'bhringraj-hair-oil-100-ml', qty: 1 }] } },
  ],
  farhan: [
    { label: 'Flash deal on Flipkart', cart: { channel: 'flipkart', segment: 'regular', payment: 'upi', code: '', lines: [{ skuId: 'bandhani-georgette-saree-rani', qty: 1 }, { skuId: 'readymade-cotton-blouse-m', qty: 1 }] } },
    { label: 'Dupattas, buy 2 get 1', cart: { channel: 'meesho', segment: 'new', payment: 'cod', code: '', lines: [{ skuId: 'bandhani-dupatta-red', qty: 3 }] } },
    { label: 'Sitewide habit on Meesho', cart: { channel: 'meesho', segment: 'regular', payment: 'cod', code: '', lines: [{ skuId: 'bandhani-georgette-saree-rani', qty: 1 }, { skuId: 'anarkali-kurti-m', qty: 1 }, { skuId: 'bandhani-dupatta-red', qty: 3 }] } },
  ],
  kabir: [
    { label: 'Charger + cable bundle', cart: { channel: 'amazon', segment: 'regular', payment: 'upi', code: '', lines: [{ skuId: 'chargemax-33w-charger', qty: 1 }, { skuId: 'braided-type-c-cable-1-m', qty: 1 }] } },
    { label: 'Leaked VOLT20 + bank card', cart: { channel: 'website', segment: 'new', payment: 'credit-card', code: 'VOLT20', lines: [{ skuId: 'chargemax-33w-charger', qty: 1 }, { skuId: 'braided-type-c-cable-1-m', qty: 1 }, { skuId: 'airpulse-tws-black', qty: 1 }] } },
    { label: 'Case + screen guard', cart: { channel: 'website', segment: 'regular', payment: 'upi', code: '', lines: [{ skuId: 'clear-armour-case-iphone-16', qty: 1 }, { skuId: 'tempered-glass-iphone-16', qty: 1 }] } },
    { label: 'Big order on EMI', cart: { channel: 'website', segment: 'regular', payment: 'emi', code: '', lines: [{ skuId: 'airpulse-tws-black', qty: 1 }, { skuId: 'chargemax-45w-charger', qty: 1 }, { skuId: 'powercube-10000-mah', qty: 1 }] } },
  ],
  anaya: [
    { label: 'Bazaar Mart: 2 sev packs', cart: { channel: 'modern', segment: 'regular', payment: 'upi', code: '', lines: [{ skuId: 'indori-sev-400-g', qty: 2 }, { skuId: 'masala-chai-250-g', qty: 1 }] } },
    { label: 'Quick-commerce snack basket', cart: { channel: 'quick', segment: 'regular', payment: 'upi', code: '', lines: [{ skuId: 'indori-sev-200-g', qty: 2 }, { skuId: 'ratlami-sev-200-g', qty: 1 }, { skuId: 'pudina-makhana-80-g', qty: 1 }] } },
    { label: 'Makhana on Amazon', cart: { channel: 'amazon', segment: 'new', payment: 'upi', code: '', lines: [{ skuId: 'pudina-makhana-80-g', qty: 3 }] } },
  ],
}

/** The checkout context a cart is evaluated in (fees, shipping, floors) for a seller's channel. */
export function cartContext(seller: SellerDef, c: Controls, cart: Pick<Cart, 'channel' | 'lines'>, preview?: string): CartCtx {
  const f = feeFor(cart.channel, c)
  const own = cart.channel === 'website'
  const units = cart.lines.reduce((a, l) => a + l.qty, 0)
  return {
    skus: seller.skus, commission: f.commission, payment: f.payment,
    shippingFee: own ? seller.shippingFee : 0, courier: own ? seller.courierCost : f.shipSubsidy * units,
    marginFloor: c.marginFloor, maxOrderDiscount: MAX_ORDER[seller.id], preview,
  }
}

/** A full cart from a preset, with sensible defaults. */
export const presetCart = (seller: SellerDef, p: Preset): Cart => ({ segment: 'regular', code: '', payment: 'upi', channel: Object.keys(seller.market.channels)[0], ...p.cart })
