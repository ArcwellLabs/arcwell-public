import { Fingerprint } from 'lucide-react'
import { AUTHOR } from '@/data/articles'
import { cn } from '@/lib/utils'

/**
 * Field-notes attribution card: abstract seal (no human portrait) +
 * team name + mono role + proof tag. The seal is a decorative monogram
 * tile, ARCWELL notes are written by the protocol team, not a person.
 */
export default function AuthorCard({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 rounded-[20px] border border-hairline bg-surface p-5', className)}>
      {/* Abstract seal, layered monogram tile, no photography */}
      <span
        aria-hidden
        className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline-strong bg-surface-2"
      >
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(214,255,75,0.18),transparent_60%)]" />
        <span className="font-display text-sm font-bold tracking-tight text-ink">AW</span>
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{AUTHOR.name}</p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">{AUTHOR.role}</p>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <span className="inline-flex h-9 items-center gap-2 rounded-full border border-hairline px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
          <Fingerprint size={13} aria-hidden className="text-accent" />
          Proof-only
        </span>
      </div>
    </div>
  )
}
