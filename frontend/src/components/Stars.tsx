import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Row of amber rating stars. */
export default function Stars({ count = 5, size = 14, className }: { count?: number; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)} aria-label={`${count} star rating`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={size} className="fill-amber text-amber" strokeWidth={1} />
      ))}
    </span>
  )
}
