import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { scrollToTarget } from '@/lib/lenis'

interface PillButtonProps {
  children: ReactNode
  to?: string
  variant?: 'solid' | 'outline'
  className?: string
  full?: boolean
  onClick?: () => void
}

/**
 * Pill button with rolling-label hover swap.
 * `to` supports router paths and in-page anchors (#pricing).
 */
export default function PillButton({ children, to, variant = 'solid', className, full, onClick }: PillButtonProps) {
  const classes = cn(
    'group relative inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-medium tracking-[0.01em] transition-colors duration-300',
    variant === 'solid'
      ? 'bg-ink text-bg hover:bg-ink/85'
      : 'border border-hairline-strong text-ink hover:border-ink/50 hover:bg-ink/5',
    full && 'w-full',
    className,
  )
  const label = (
    <span className="block h-6 overflow-hidden">
      <span className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-1/2">
        <span className="flex h-6 items-center justify-center whitespace-nowrap">{children}</span>
        <span className="flex h-6 items-center justify-center whitespace-nowrap" aria-hidden>
          {children}
        </span>
      </span>
    </span>
  )

  if (to?.startsWith('#')) {
    return (
      <a
        href={to}
        className={classes}
        onClick={(e) => {
          e.preventDefault()
          scrollToTarget(to)
          onClick?.()
        }}
      >
        {label}
      </a>
    )
  }
  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick}>
        {label}
      </Link>
    )
  }
  return (
    <button type="button" className={classes} onClick={onClick}>
      {label}
    </button>
  )
}
