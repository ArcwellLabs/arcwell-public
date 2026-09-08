import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RecordSeries, VerificationStatus } from '@/data/projects'

const STATUS_STYLE: Record<VerificationStatus, string> = {
  Verified: 'text-accent',
  'Under review': 'text-ink-muted',
  Disputed: 'text-amber',
  Corrected: 'text-ink',
}

interface RecordCardProps {
  series: RecordSeries
  staggerIndex: number
  onOpen: (r: RecordSeries) => void
}

/**
 * RecordSeries grid card, abstract visual, [index] + status, H3 + category chip.
 * Layout spring on filter; staggered rise on first reveal; hover overlay.
 */
export default function RecordCard({ series, staggerIndex, onOpen }: RecordCardProps) {
  return (
    <motion.article
      className="will-change-transform"
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: (staggerIndex % 3) * 0.08 }}
      >
        <button
          type="button"
          onClick={() => onOpen(series)}
          data-cursor="View"
          aria-label={`Inspect record, ${series.title}`}
          className="group block w-full text-left"
        >
          <div className="relative overflow-hidden rounded-2xl border border-hairline transition-colors duration-500 group-hover:border-hairline-strong">
            <img
              src={series.image}
              alt={`Abstract visual for the ${series.title} RecordSeries`}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.215,0.61,0.355,1)] group-hover:scale-[1.06]"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 flex translate-y-full justify-center bg-gradient-to-t from-[rgba(10,10,11,0.85)] to-transparent pb-5 pt-14 transition-transform duration-500 ease-out group-hover:translate-y-0"
            >
              <span className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-bg">
                Inspect record
                <ArrowRight size={15} />
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-3 font-mono text-xs uppercase tracking-[0.18em] text-faint">
            <span className="transition-colors duration-300 group-hover:text-accent">[{series.index}]</span>
            <span className={cn('flex items-center gap-2', STATUS_STYLE[series.status])}>
              <span
                aria-hidden
                className={cn(
                  'inline-block h-1.5 w-1.5 rounded-full bg-current',
                  series.status === 'Disputed' && 'animate-pulse',
                )}
              />
              {series.status}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <h3 className="font-display text-[clamp(22px,2.2vw,32px)] font-semibold leading-[1.15] text-ink">
              {series.title}
            </h3>
            <span className="shrink-0 rounded-full border border-hairline px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
              {series.category}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">{series.summary}</p>
        </button>
      </motion.div>
    </motion.article>
  )
}
