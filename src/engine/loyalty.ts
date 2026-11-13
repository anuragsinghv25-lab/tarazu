import type { LoyaltyData } from '@/data/sellers/types'

/** How much of the member/non-member gap the points rate explains (diminishing returns). */
const pull = (earn: number) => 1 - Math.exp(-earn / 0.035)

export function programEconomics(L: LoyaltyData, earn: number, eventMult: boolean) {
  const active = L.members * L.activeShare
  const gap = (L.ordersMember - L.ordersNonMember) * (pull(earn) / pull(L.earnPct))
  const ordersMember = L.ordersNonMember + Math.max(0, gap)
  const spend = active * ordersMember * L.aov
  const mult = eventMult ? 1.15 : 1 // a 2× month adds ~15% to the year's points
  const cost = spend * earn * mult * (1 - L.breakage)
  // Only part of the extra orders are caused by the program (the rest are loyal anyway).
  const incMargin = active * Math.max(0, gap) * L.aov * L.marginPct * 0.3 * (eventMult ? 1.06 : 1)
  return { active, ordersMember, cost, incMargin, net: incMargin - cost, roi: cost ? (incMargin - cost) / cost : 0 }
}

export function liabilityForecast(L: LoyaltyData, earn: number, eventMult: boolean, months = 6) {
  const active = L.members * L.activeShare
  const monthlySpend = (active * programEconomics(L, earn, eventMult).ordersMember * L.aov) / 12
  let out = L.pointsOutstanding
  return Array.from({ length: months + 1 }, (_, m) => {
    if (m > 0) {
      const accrue = monthlySpend * earn * (eventMult && m === 1 ? 2 : 1)
      const redeem = out * 0.09
      const expire = out * 0.025
      out = out + accrue - redeem - expire
    }
    return { m, points: Math.round(out), liability: Math.round(out * (1 - L.breakage)) }
  })
}

export function winBack(L: LoyaltyData, d: number) {
  const rate = 0.03 + 0.3 * (1 - Math.exp(-d / 0.1))
  const back = L.lapsed * rate
  const firstOrder = L.aov * (L.marginPct - d)
  const afterwards = L.aov * L.marginPct * 1.2 // repeat orders in the next year from those who stay
  const value = back * (firstOrder + afterwards * 0.5)
  return { rate, back, value, costOfDiscount: back * L.aov * d }
}
