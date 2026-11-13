import { useEffect } from 'react'
import { motion, useSpring, useTransform, AnimatePresence, type MotionValue } from 'motion/react'

/* The Scale — Tarazu's signature. A real balance: what a discount gives away
   sits on the left pan, what it earns on the right, and the beam settles with weight. */

const W = 600, H = 330, CX = 300, CY = 104, L = 196

export function ScaleVisual({ given, earned }: { given: number; earned: number }) {
  const total = Math.max(1, Math.abs(given) + Math.abs(earned))
  // tanh keeps small differences visible and big ones from flipping the beam
  const target = Math.tanh(((earned - given) / total) * 3) * 14
  const angle = useSpring(0, { stiffness: 60, damping: 7.5, mass: 1.4 })
  useEffect(() => { angle.set(target) }, [target, angle])

  const rad = useTransform(angle, (a) => (a * Math.PI) / 180)
  const lx = useTransform(rad, (r) => CX - L * Math.cos(r))
  const ly = useTransform(rad, (r) => CY - L * Math.sin(r))
  const rx = useTransform(rad, (r) => CX + L * Math.cos(r))
  const ry = useTransform(rad, (r) => CY + L * Math.sin(r))
  const nx = useTransform(rad, (r) => CX + 58 * Math.sin(r))
  const ny = useTransform(rad, (r) => CY - 58 * Math.cos(r))

  const unit = Math.max(Math.abs(given), Math.abs(earned), 1) / 7
  const coins = (v: number) => Math.min(7, Math.max(v > 0 ? 1 : 0, Math.round(Math.max(0, v) / unit)))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Scale: given away ${Math.round(given)}, earned ${Math.round(earned)}`}>
      <defs>
        <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbbf4d" /><stop offset="0.55" stopColor="var(--color-brass)" /><stop offset="1" stopColor="var(--color-brass-ink)" />
        </linearGradient>
        <linearGradient id="bowl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-card)" /><stop offset="1" stopColor="#eee6d3" />
        </linearGradient>
        <radialGradient id="shadow"><stop offset="0" stopColor="var(--color-primary)" stopOpacity=".18" /><stop offset="1" stopColor="var(--color-primary)" stopOpacity="0" /></radialGradient>
      </defs>

      {/* dial behind the needle */}
      <g opacity="0.9">
        <path d={`M ${CX - 62} ${CY - 12} A 64 64 0 0 1 ${CX + 62} ${CY - 12}`} fill="none" stroke="var(--color-rule)" strokeWidth="1.2" />
        {[-24, -12, 0, 12, 24].map((a) => {
          const r = (a * Math.PI) / 180
          return <line key={a} x1={CX + 60 * Math.sin(r)} y1={CY - 60 * Math.cos(r)} x2={CX + 68 * Math.sin(r)} y2={CY - 68 * Math.cos(r)} stroke={a === 0 ? 'var(--color-primary)' : 'var(--color-ink-4)'} strokeWidth={a === 0 ? 1.6 : 1} />
        })}
        <text x={CX - 70} y={CY - 26} fontSize="10" fill="var(--color-loss)" textAnchor="end" fontFamily="var(--font-sans)">loss</text>
        <text x={CX + 70} y={CY - 26} fontSize="10" fill="var(--color-gain)" fontFamily="var(--font-sans)">profit</text>
      </g>

      {/* stand */}
      <ellipse cx={CX} cy={H - 16} rx="150" ry="10" fill="url(#shadow)" />
      <path d={`M ${CX - 84} ${H - 18} L ${CX + 84} ${H - 18} L ${CX + 64} ${H - 38} L ${CX - 64} ${H - 38} Z`} fill="var(--color-primary)" />
      <rect x={CX - 64} y={H - 42} width="128" height="5" rx="2" fill="url(#brass)" />
      <rect x={CX - 5} y={CY} width="10" height={H - 42 - CY} rx="3" fill="var(--color-primary)" />
      <rect x={CX - 2} y={CY + 6} width="2" height={H - 56 - CY} fill="var(--color-ink-2)" />

      {/* needle */}
      <motion.line x1={CX} y1={CY} x2={nx} y2={ny} stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />

      {/* beam */}
      <motion.line x1={lx} y1={ly} x2={rx} y2={ry} stroke="url(#brass)" strokeWidth="9" strokeLinecap="round" />
      <motion.line x1={lx} y1={ly} x2={rx} y2={ry} stroke="#fff1d2" strokeOpacity=".5" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={CX} cy={CY} r="13" fill="var(--color-primary)" />
      <circle cx={CX} cy={CY} r="7" fill="url(#brass)" />
      <path d={`M ${CX} ${CY - 34} l 6 10 h -12 Z`} fill="url(#brass)" />

      <Pan x={lx} y={ly} label="GIVEN AWAY" color="var(--color-loss)" coinFill="#e7a487" coins={coins(given)} side="l" />
      <Pan x={rx} y={ry} label="EARNED" color="var(--color-gain)" coinFill="#fbc56b" coins={coins(earned)} side="r" />
    </svg>
  )
}

function Pan({ x, y, label, color, coinFill, coins, side }: { x: MotionValue<number>; y: MotionValue<number>; label: string; color: string; coinFill: string; coins: number; side: 'l' | 'r' }) {
  return (
    <motion.g style={{ x, y }}>
      <circle r="4.5" fill="var(--color-primary)" />
      <line x1="0" y1="0" x2="-62" y2="96" stroke="var(--color-ink-2)" strokeWidth="1.1" />
      <line x1="0" y1="0" x2="62" y2="96" stroke="var(--color-ink-2)" strokeWidth="1.1" />
      <line x1="0" y1="0" x2="0" y2="99" stroke="var(--color-ink-2)" strokeWidth="0.8" strokeOpacity=".55" />
      <g>
        <AnimatePresence>
          {Array.from({ length: coins }).map((_, i) => (
            <motion.g key={i} initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ type: 'spring', stiffness: 300, damping: 18, delay: i * 0.03 }}>
              <ellipse cx={(i % 2 ? 6 : -5) * (side === 'l' ? 1 : -1)} cy={92 - i * 6.5} rx="22" ry="5.5" fill={coinFill} stroke={color} strokeOpacity=".55" strokeWidth="1" />
            </motion.g>
          ))}
        </AnimatePresence>
      </g>
      <path d="M -76 96 Q 0 146 76 96 Z" fill="url(#bowl)" stroke="var(--color-primary)" strokeWidth="1.4" />
      <path d="M -76 96 L 76 96" stroke="url(#brass)" strokeWidth="3" strokeLinecap="round" />
      <text y="111" textAnchor="middle" fontSize="9" letterSpacing="1.5" fontWeight="600" fill={color} fontFamily="var(--font-sans)">{label}</text>
    </motion.g>
  )
}
