import { cn } from '@/lib/utils'

/** 8px accent dot with an infinite 2s pulse ring. */
export default function AvailabilityDot({ className }: { className?: string }) {
  return (
    <span className={cn('relative inline-flex h-2 w-2', className)}>
      <span className="absolute inset-0 rounded-full bg-accent animate-pulse-ring" aria-hidden />
      <span className="relative h-2 w-2 rounded-full bg-accent" />
    </span>
  )
}
