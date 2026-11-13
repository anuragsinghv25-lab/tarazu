import type { SellerDef } from '@/data/sellers'

/** Where each annotated element lives, so the Case Study and story mode can open it. */
export function routeOf(id: string, s: SellerDef): string | null {
  const hero = `/sku/${s.heroSkuId}`
  const map: Record<string, string> = {
    'seller-switcher': '/', 'event-chip': '/', opportunity: '/', actions: '/', 'health-bar': '/', fatigue: '/',
    'pulse-grid': '/pulse', scale: hero, curve: hero, why: hero, 'discount-slider': hero,
    'truth-headline': '/truth', 'truth-peel': '/truth', 'truth-money': '/truth', 'compare-cards': '/compare',
    'campaign-list': '/campaigns', 'campaign-header': '/campaigns', 'block-who': '/campaigns', 'block-if': '/campaigns', 'block-then': '/campaigns',
    'block-limits': '/campaigns', 'block-stack': '/campaigns', 'campaign-sentence': '/campaigns', 'burn-down': '/campaigns', conflicts: '/campaigns',
    leak: '/sandbox', receipt: '/sandbox', pipeline: '/sandbox',
    calendar: '/plan', ladder: '/plan?tab=clearance', duel: '/plan?tab=duel', bundles: '/bundles', 'bundle-detail': '/bundles',
    'loyalty-economics': '/loyalty', winback: '/loyalty', referral: '/loyalty', 'loyalty-locked': '/loyalty',
    gtn: '/brand', 'trade-lines': '/brand', tpo: '/brand', 'forward-buy': '/brand', deductions: '/brand', coverage: '/sellers',
    'ask-chat': '/ask', 'brief-input': '/brief', 'brief-read': '/brief', 'brief-plan': '/brief',
    alerts: '/watchtower', autonomy: '/watchtower', guardrails: '/watchtower',
    'debrief-headline': '/debrief', 'debrief-made': '/debrief', 'debrief-looked': '/debrief', 'debrief-categories': '/debrief', 'debrief-next': '/debrief',
    'copy-controls': '/copy', 'copy-drafts': '/copy', 'copy-preview': '/copy',
    'launch-goal': '/launch', 'launch-audience': '/launch', 'launch-codes': '/launch', 'launch-channels': '/launch', 'launch-preflight': '/launch', 'launch-scale': '/launch',
    'lifecycle-board': '/lifecycle', approvals: '/lifecycle?tab=approvals', 'guardrails-live': '/lifecycle?tab=guardrails',
    'code-generate': '/codes', 'code-table': '/codes', storefront: '/storefront', 'edge-catalogue': '/edge-cases', 'edge-run': '/edge-cases',
    'creator-split': '/creators', 'creator-roster': '/creators', 'creator-deal': '/creators', 'creator-disclosure': '/creators', 'creator-calendar': '/creators',
    'affiliate-commission': '/affiliates', 'affiliate-attribution': '/affiliates', 'affiliate-ledger': '/affiliates', 'referral-design': '/affiliates?tab=referrals', 'referral-fraud': '/affiliates?tab=referrals', resellers: '/affiliates?tab=resellers',
    'community-drop': '/community', 'community-group': '/community', 'community-reviews': '/community',
  }
  return map[id] ?? null
}

/** Elements that only exist for some sellers. */
export function needsSeller(id: string): 'anaya' | 'own' | null {
  if (['gtn', 'trade-lines', 'tpo', 'forward-buy', 'deductions'].includes(id)) return 'anaya'
  if (['loyalty-economics', 'winback', 'referral'].includes(id)) return 'own'
  return null
}

export const SCREEN_NAME: Record<string, string> = {
  '/': 'Overview', '/pulse': 'Stock Pulse', '/sku': 'The Scale', '/truth': 'Truth Lens', '/compare': 'Platform compare', '/campaigns': 'Campaign builder',
  '/sandbox': 'Cart Sandbox', '/plan': 'Season plan', '/bundles': 'Bundles', '/loyalty': 'Loyalty', '/brand': 'Brand mode', '/sellers': 'Demo sellers',
  '/launch': 'Launch flow', '/lifecycle': 'Lifecycle', '/codes': 'Code studio', '/storefront': 'Shopper preview', '/edge-cases': 'Edge-case lab',
  '/creators': 'Creator hub', '/affiliates': 'Affiliates and referrals', '/community': 'Community',
  '/ask': 'Ask Tarazu', '/brief': 'Brief to plan', '/watchtower': 'Watchtower', '/debrief': 'Sale debrief', '/copy': 'Offer copy',
}
export const screenName = (route: string) => SCREEN_NAME[route.startsWith('/sku') ? '/sku' : route.split('?')[0]] ?? route
