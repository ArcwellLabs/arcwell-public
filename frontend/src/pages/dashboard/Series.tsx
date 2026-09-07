import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { ORGANIZATIONS, RECORD_SERIES, TRANSACTIONS, orgById } from '@/data/dashboard'
import type { RecordSeries, SeriesCategory, VisibilityPolicy } from '@/data/dashboard'
import {
  Drawer,
  EASE,
  EmptyState,
  ExportJsonButton,
  FieldRow,
  FilterChips,
  Panel,
  SearchInput,
  Select,
  StatusPill,
  ViewHeader,
  fmtDate,
  fmtNum,
  timeAgo,
} from '@/pages/dashboard/ui'

const CATEGORY_FILTERS = ['all', 'Registry', 'Evidence', 'Explorer', 'Verifier', 'API', 'Corrections'] as const
type CategoryFilter = (typeof CATEGORY_FILTERS)[number]

const VIS_OPTIONS = [
  { value: 'all', label: 'All visibility' },
  { value: 'public', label: 'Public' },
  { value: 'permissioned', label: 'Permissioned' },
  { value: 'sealed', label: 'Sealed' },
] as const

function SeriesCard({ series, onOpen, index }: { series: RecordSeries; onOpen: () => void; index: number }) {
  const org = orgById(series.organizationId)
  const records = TRANSACTIONS.filter((t) => t.seriesId === series.id)
  const verified = records.filter((t) => t.verificationStatus === 'verified').length
  const pct = records.length ? Math.round((verified / records.length) * 100) : 0

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.04 * index }}
      className="group flex h-full flex-col rounded-2xl border border-hairline bg-surface p-5 text-left transition-colors duration-300 hover:border-hairline-strong hover:bg-surface-2"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{series.code}</span>
        <StatusPill value={series.status} />
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-ink">{series.name}</h3>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
        {series.category} · {org?.code ?? 'unlinked'} · {series.visibilityPolicy}
      </p>

      {/* abstract barcode visual */}
      <div className="mt-4 flex h-8 items-end gap-[3px]" aria-hidden>
        {Array.from({ length: 24 }, (_, i) => (
          <span
            key={i}
            className="w-[3px] rounded-sm bg-hairline-strong transition-colors duration-300 group-hover:bg-accent/60"
            style={{ height: `${18 + ((i * 37 + series.recordCount) % 14)}px`, transitionDelay: `${i * 12}ms` }}
          />
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-hairline pt-4">
        <div>
          <dd className="tabular font-mono text-base text-ink">{fmtNum(series.recordCount)}</dd>
          <dt className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">records</dt>
        </div>
        <div>
          <dd className="tabular font-mono text-base text-ink">{fmtNum(series.anchorCount)}</dd>
          <dt className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">anchors</dt>
        </div>
        <div>
          <dd className={`tabular font-mono text-base ${series.openFlags > 0 ? 'text-amber' : 'text-ink'}`}>{series.openFlags}</dd>
          <dt className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">open flags</dt>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-hairline pt-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
          {records.length ? `${pct}% verified in sample` : 'no sampled records'}
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline text-ink-muted transition-all duration-300 group-hover:border-accent/50 group-hover:text-accent">
          <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </motion.button>
  )
}

export default function Series() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [visibility, setVisibility] = useState<string>('all')
  const [selected, setSelected] = useState<RecordSeries | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return RECORD_SERIES.filter((s) => {
      if (category !== 'all' && s.category !== (category as SeriesCategory)) return false
      if (visibility !== 'all' && s.visibilityPolicy !== (visibility as VisibilityPolicy)) return false
      if (!q) return true
      const org = orgById(s.organizationId)
      return [s.name, s.code, s.category, org?.name ?? ''].join(' ').toLowerCase().includes(q)
    })
  }, [query, category, visibility])

  return (
    <div>
      <ViewHeader
        index="03"
        title="RecordSeries"
        blurb="Datasets and case files grouping related transaction records and disclosure packages, with visibility policy and record counts."
        actions={<ExportJsonButton data={filtered} filename="arcwell-record-series.json" />}
      />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput value={query} onChange={setQuery} placeholder="Search series or organization…" className="w-full lg:max-w-sm" />
        <div className="flex flex-wrap items-center gap-3">
          <FilterChips options={CATEGORY_FILTERS} value={category} onChange={setCategory} />
          <Select label="Visibility" value={visibility} onChange={setVisibility} options={VIS_OPTIONS} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel>
          <EmptyState onReset={() => { setQuery(''); setCategory('all'); setVisibility('all') }} />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s, i) => (
            <SeriesCard key={s.id} series={s} index={i} onOpen={() => setSelected(s)} />
          ))}
        </div>
      )}

      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        meta={selected ? `${selected.code} · ${selected.category}` : undefined}
      >
        {selected && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusPill value={selected.status} />
              <ExportJsonButton data={selected} filename={`${selected.code.toLowerCase()}-series.json`} />
            </div>
            <dl>
              <FieldRow label="Series ID" mono>{selected.id}</FieldRow>
              <FieldRow label="Organization">{orgById(selected.organizationId)?.name ?? ', '}</FieldRow>
              <FieldRow label="Category">{selected.category}</FieldRow>
              <FieldRow label="Visibility policy">{selected.visibilityPolicy}</FieldRow>
              <FieldRow label="Record count" mono>{fmtNum(selected.recordCount)}</FieldRow>
              <FieldRow label="Anchors" mono>{fmtNum(selected.anchorCount)}</FieldRow>
              <FieldRow label="Open flags" mono>{String(selected.openFlags)}</FieldRow>
              <FieldRow label="Last anchor">{timeAgo(selected.lastAnchorAt)} · {fmtDate(selected.lastAnchorAt)}</FieldRow>
            </dl>

            <p className="kicker mb-3 mt-8">Sampled records in this series</p>
            <ul className="space-y-2">
              {TRANSACTIONS.filter((t) => t.seriesId === selected.id).slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-bg/40 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-ink">{t.id}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">{t.eventType}</p>
                  </div>
                  <StatusPill value={t.verificationStatus} />
                </li>
              ))}
              {TRANSACTIONS.filter((t) => t.seriesId === selected.id).length === 0 && (
                <li className="text-sm text-faint">No sampled records linked to this series.</li>
              )}
            </ul>
            <p className="mt-6 text-xs leading-relaxed text-faint">
              Organizations: {ORGANIZATIONS.length} authorized. Visibility is enforced at the storage layer; sealed
              series expose metadata only.
            </p>
          </div>
        )}
      </Drawer>
    </div>
  )
}
