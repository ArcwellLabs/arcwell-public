import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import Magnetic from '@/components/Magnetic'
import PillButton from '@/components/PillButton'
import SectionKicker from '@/components/SectionKicker'
import ControlsBar from '@/pages/projects/ControlsBar'
import RecordCard from '@/pages/projects/RecordCard'
import RecordModal from '@/pages/projects/RecordModal'
import { RECORD_SERIES } from '@/data/projects'
import type { Filter, RecordSeries } from '@/data/projects'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

/** §1, header: kicker, masked H1, right-aligned intro, drawn hairline. */
function ExplorerHeader() {
  return (
    <section className="container-infini pt-[120px] md:pt-[200px]">
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
        className="kicker"
      >
        [01] Record explorer, Public metadata only
      </motion.p>

      <h1 className="mt-6 font-display text-[clamp(48px,7.5vw,120px)] font-bold leading-[0.95] tracking-[-0.03em] text-ink">
        <span className="block overflow-hidden">
          <motion.span
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.15 }}
            className="block will-change-transform"
          >
            Every record, checkable.
          </motion.span>
        </span>
      </h1>

      <div className="mt-10 flex justify-end">
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.5 }}
          className="max-w-md text-base leading-[1.65] text-ink-muted md:text-lg"
        >
          Search RecordSeries anchored on ARC, event counts, evidence bundles, and verification status, with the source
          labeled on every field. Nothing here is an offer, a recommendation, or a certification.
        </motion.p>
      </div>

      <motion.div
        aria-hidden
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, ease: EASE, delay: 0.4 }}
        className="mt-12 h-px w-full origin-left bg-hairline-strong"
      />
    </section>
  )
}

/** §3, centered empty state with filter reset. */
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-col items-center py-24 text-center"
    >
      <p className="kicker">( No matching records )</p>
      <h3 className="mt-4 font-display text-[clamp(22px,2.2vw,32px)] font-semibold leading-[1.15] text-ink">
        No RecordSeries matches that query.
      </h3>
      <div className="mt-8">
        <PillButton variant="outline" onClick={onReset}>
          Reset filters
        </PillButton>
      </div>
    </motion.div>
  )
}

/** §4, CTA band with ghost parallax watermark and magnetic button. */
function CtaBand() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const ghostY = useTransform(scrollYProgress, [0, 1], [90, -90])

  return (
    <section ref={ref} className="relative overflow-hidden border-t border-hairline">
      <motion.span
        aria-hidden
        style={reduce ? undefined : { y: ghostY }}
        className="pointer-events-none absolute -right-6 top-1/2 hidden -translate-y-1/2 select-none font-mono text-[200px] font-medium leading-none md:block"
      >
        <span style={{ WebkitTextStroke: '1px rgba(237,237,234,0.12)', color: 'transparent' }}>[ARC]</span>
      </motion.span>

      <div className="container-infini relative py-[120px] text-center">
        <SectionKicker index="03" label="Next" align="center" className="justify-center" />

        <h2 className="mx-auto mt-8 font-display text-[clamp(36px,5vw,72px)] font-semibold leading-none tracking-[-0.02em] text-ink">
          <span className="block overflow-hidden">
            <motion.span
              initial={{ y: '110%' }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, margin: '0px 0px -15% 0px' }}
              transition={{ duration: 1, ease: EASE }}
              className="block will-change-transform"
            >
              Anchor your records on ARC.
            </motion.span>
          </span>
        </h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
          className="mx-auto mt-6 max-w-lg text-base leading-[1.65] text-ink-muted"
        >
          Start a verification pilot: submit records, package evidence, and let independent verifiers check what was
          submitted.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Magnetic>
            <PillButton to="/contact">Start a verification pilot</PillButton>
          </Magnetic>
          <Magnetic>
            <PillButton to="/studio" variant="outline">
              Read the operating model
            </PillButton>
          </Magnetic>
        </motion.div>
      </div>
    </section>
  )
}

/** /projects, searchable, filterable public explorer of RecordSeries on ARC. */
export default function Projects() {
  const [filter, setFilter] = useState<Filter>('All')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selected, setSelected] = useState<RecordSeries | null>(null)

  // 150ms debounce on search input
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 150)
    return () => window.clearTimeout(t)
  }, [query])

  const visible = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    return RECORD_SERIES.filter((r) => {
      const inCategory = filter === 'All' || r.category === filter
      const inQuery =
        !q ||
        `${r.title} ${r.category} ${r.status} ${r.summary} ${r.record.submittingOrganization}`.toLowerCase().includes(q)
      return inCategory && inQuery
    })
  }, [filter, debouncedQuery])

  const resetFilters = () => {
    setQuery('')
    setFilter('All')
  }

  return (
    <>
      <ExplorerHeader />

      <div className="mt-14">
        <ControlsBar
          query={query}
          onQueryChange={setQuery}
          filter={filter}
          onFilterChange={setFilter}
          shown={visible.length}
          total={RECORD_SERIES.length}
        />
      </div>

      <section className="container-infini py-16">
        <div className="mb-10">
          <SectionKicker index="02" label="Anchored series" />
        </div>

        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((r, i) => (
              <RecordCard key={r.id} series={r} staggerIndex={i} onOpen={setSelected} />
            ))}
          </div>
        ) : (
          <EmptyState onReset={resetFilters} />
        )}
      </section>

      <CtaBand />

      <RecordModal series={selected} onClose={() => setSelected(null)} />
    </>
  )
}
