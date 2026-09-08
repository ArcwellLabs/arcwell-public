import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import Chip from '@/components/Chip'
import { FILTERS } from '@/data/projects'
import type { Filter } from '@/data/projects'

interface ControlsBarProps {
  query: string
  onQueryChange: (q: string) => void
  filter: Filter
  onFilterChange: (f: Filter) => void
  shown: number
  total: number
}

/** §2, sticky controls bar: hairline search, category chips, live count. */
export default function ControlsBar({ query, onQueryChange, filter, onFilterChange, shown, total }: ControlsBarProps) {
  return (
    <motion.div
      initial={{ y: '-100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="sticky top-[72px] z-40 border-y border-hairline bg-bg/80 backdrop-blur-xl"
    >
      <div className="container-infini flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative w-[280px] max-w-full shrink-0">
          <Search size={16} className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-faint" aria-hidden />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search records…"
            aria-label="Search record series"
            className="h-10 w-full border-b border-hairline bg-transparent pl-7 pr-7 font-mono text-sm text-ink transition-colors duration-300 placeholder:text-faint focus:border-ink/60 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Clear search"
              className="absolute right-0 top-1/2 -translate-y-1/2 text-faint transition-colors duration-300 hover:text-ink"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* On phones the chips get their own full-width scroll rail so the
            live count can never clip them. */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          {/* Category chips, scrollable on mobile */}
          <div className="touch-scroll flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onFilterChange(f)}
                aria-pressed={filter === f}
                className="shrink-0"
              >
                <Chip active={filter === f}>{f}</Chip>
              </button>
            ))}
          </div>

          {/* Live count */}
          <span className="shrink-0 whitespace-nowrap font-mono text-xs uppercase tracking-[0.18em] text-faint tabular">
            [ {String(shown).padStart(2, '0')} / {String(total).padStart(2, '0')} ]
          </span>
        </div>

      </div>
    </motion.div>
  )
}
