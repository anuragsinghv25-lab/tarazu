import * as HoverCard from '@radix-ui/react-hover-card'
import type { ReactNode } from 'react'
import { GLOSSARY } from '@/content/glossary'

/** A jargon word with a dotted underline; hover for a plain-English definition. */
export function Term({ k, children }: { k: keyof typeof GLOSSARY | string; children?: ReactNode }) {
  const def = GLOSSARY[k]
  if (!def) return <>{children ?? k}</>
  return (
    <HoverCard.Root openDelay={120} closeDelay={60}>
      <HoverCard.Trigger asChild>
        <span tabIndex={0} className="cursor-help underline decoration-brass/60 decoration-dotted decoration-[1.5px] underline-offset-[3px]">{children ?? k}</span>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content sideOffset={6} collisionPadding={12} className="z-50 max-w-[280px] rounded-xl border border-rule bg-ink px-3 py-2.5 text-[12.5px] leading-snug text-paper shadow-[var(--shadow-lift)] data-[state=open]:animate-[fadeIn_.15s]">
          <div className="display mb-0.5 text-[14px] text-brass-2">{k}</div>{def}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}
