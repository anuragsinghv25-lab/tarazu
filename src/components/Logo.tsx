export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="15" fill="#1c1a17" />
      <g fill="none" stroke="#d9a441" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 13v37M21 50h22M13 22.5l38-1" />
        <path d="M13 22.5l-6 13.5h12zM51 21.5l-6 13.5h12z" />
      </g>
      <circle cx="32" cy="13" r="2.6" fill="#d9a441" />
    </svg>
  )
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <Mark />
      <div className="leading-none">
        <div className="display text-[22px] font-[460] tracking-[-0.03em] text-ink">Tarazu</div>
        <div className="mt-0.5 text-[10.5px] text-ink-3">तराज़ू · weigh every discount</div>
      </div>
    </div>
  )
}
