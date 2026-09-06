import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { gsap, prefersReducedMotion } from '@/lib/anim'
import { cn } from '@/lib/utils'
import MaskLines from '@/components/MaskLines'
import Reveal from '@/components/Reveal'
import SectionKicker from '@/components/SectionKicker'
import ArticleCard from '@/pages/articles/ArticleCard'
import { ARTICLES, CATEGORIES } from '@/data/articles'
import type { Category } from '@/data/articles'

type Filter = 'All' | Category
const FILTERS: Filter[] = ['All', ...CATEGORIES]
const TOTAL = String(ARTICLES.length).padStart(2, '0')

/* ------------------------------------------------------------------ */
/* §2, Sticky controls bar: search + category chips + count           */
/* ------------------------------------------------------------------ */

function ControlsBar({
  query,
  onQuery,
  filter,
  onFilter,
  shown,
}: {
  query: string
  onQuery: (v: string) => void
  filter: Filter
  onFilter: (f: Filter) => void
  shown: number
}) {
  return (
    <div className="sticky top-[72px] z-40 border-y border-hairline bg-bg/85 backdrop-blur-xl">
      <div className="container-infini flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
        <label className="group flex min-w-[220px] flex-1 items-center gap-3 md:flex-none md:basis-72">
          <Search size={16} className="shrink-0 text-faint transition-colors group-focus-within:text-ink" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search field notes…"
            aria-label="Search field notes"
            className="h-9 w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
          />
        </label>

        <div className="flex flex-1 flex-wrap items-center gap-2 md:justify-end">
          {FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => onFilter(f)} aria-pressed={filter === f}>
              <span
                className={cn(
                  'inline-flex h-9 items-center rounded-full border px-4 font-mono text-xs uppercase tracking-[0.12em] transition-colors duration-300',
                  filter === f
                    ? 'border-ink bg-ink text-bg'
                    : 'border-hairline text-ink-muted hover:border-hairline-strong hover:text-ink',
                )}
              >
                {f}
              </span>
            </button>
          ))}
        </div>

        <p className="ml-auto hidden font-mono text-xs uppercase tracking-[0.18em] text-faint tabular sm:block md:ml-0">
          [ {String(shown).padStart(2, '0')} / {TOTAL} ]
        </p>
      </div>
    </div>
  )
}


/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Articles() {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [filter, setFilter] = useState<Filter>('All')
  const ruleRef = useRef<HTMLDivElement>(null)

  // 150ms debounce on the search field
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim().toLowerCase()), 150)
    return () => window.clearTimeout(id)
  }, [query])

  // Header hairline draw: scaleX 0 -> 1
  useEffect(() => {
    const el = ruleRef.current
    if (!el) return
    if (prefersReducedMotion()) {
      gsap.set(el, { scaleX: 1 })
      return
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power3.out', delay: 0.3 })
    }, el)
    return () => ctx.revert()
  }, [])

  const filtered = useMemo(() => {
    return ARTICLES.filter((a) => {
      if (filter !== 'All' && a.category !== filter) return false
      if (!debounced) return true
      const hay = `${a.title} ${a.excerpt} ${a.category}`.toLowerCase()
      return hay.includes(debounced)
    })
  }, [filter, debounced])

  return (
    <>
      {/* §1, Header [01] */}
      <section className="container-infini pt-[128px]">
        <SectionKicker index="01" label="ARCWELL on ARC" />
        <div className="mt-10 flex flex-wrap items-end justify-between gap-x-16 gap-y-10">
          <MaskLines
            lines={['Field', 'notes.']}
            className="font-display text-[clamp(48px,7.5vw,120px)] font-bold leading-[0.95] tracking-[-0.03em] text-ink"
            start="top 95%"
          />
          <Reveal delay={0.4} y={24} className="max-w-md md:pb-4 md:text-right">
            <p className="text-lg leading-[1.6] text-ink-muted">
              Original notes on proof-only infrastructure, evidence integrity, and independent
              verification, from the team building ARCWELL on ARC.
            </p>
          </Reveal>
        </div>
        <div ref={ruleRef} className="mt-16 h-px w-full origin-left bg-hairline-strong" aria-hidden />
      </section>

      {/* §2, Controls bar */}
      <div className="mt-10">
        <ControlsBar query={query} onQuery={setQuery} filter={filter} onFilter={setFilter} shown={filtered.length} />
      </div>

      {/* §3, Article grid [02] */}
      <section className="container-infini py-16 md:py-20">
        <SectionKicker index="02" label="The notebook" />
        <motion.div layout className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((article, i) => (
              <motion.div
                key={article.slug}
                layout
                initial={{ opacity: 0, y: 60 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { type: 'spring', stiffness: 260, damping: 30, delay: i * 0.08 },
                }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
              >
                <ArticleCard article={article} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {filtered.length === 0 && (
          <div className="border border-dashed border-hairline py-20 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-faint">
              Nothing matches, try another search
            </p>
          </div>
        )}
      </section>

    </>
  )
}
