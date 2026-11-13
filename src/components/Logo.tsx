import { TarazuLogo, TarazuMark } from '@/brand/TarazuLogo'

/** Kept for existing imports; the brand components live in src/brand. */
export function Mark({ size = 28 }: { size?: number }) {
  return <TarazuMark size={size} />
}

export function Logo({ compact }: { compact?: boolean }) {
  return <TarazuLogo compact={compact} />
}
