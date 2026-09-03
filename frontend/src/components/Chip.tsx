import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

/** Mono chip / filter pill: rounded-full hairline border. */
export default function Chip({
  children,
  active = false,
  className,
}: {
  children: ReactNode
  active?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-9 items-center rounded-full border px-4 font-mono text-xs uppercase tracking-[0.12em] transition-colors duration-300',
        active ? 'border-ink bg-ink text-bg' : 'border-hairline text-ink-muted hover:border-hairline-strong hover:text-ink',
        className,
      )}
    >
      {children}
    </span>
  )
}
