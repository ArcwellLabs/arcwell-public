import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CORRECTIONS, seriesById } from '@/data/dashboard'
import type { CorrectionEvent } from '@/data/dashboard'
import {
  CopyButton,
  Drawer,
  EASE,
  EmptyState,
  ExportJsonButton,
  FieldRow,
  FilterChips,
  Panel,
  PanelHeader,
  SearchInput,
  StatusPill,
  ViewHeader,
  fmtDate,
  shortHash,
} from '@/pages/dashboard/ui'

const KIND_FILTERS = ['all', 'correction', 'dispute', 'annotation'] as const
type KindFilter = (typeof KIND_FILTERS)[number]

const STATUS_FILTERS = ['all', 'open', 'appended', 'rejected'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

export default function Corrections() {
  const [kind, setKind] = useState<KindFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<CorrectionEvent | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CORRECTIONS.filter((c) => {
      if (kind !== 'all' && c.kind !== kind) return false
      if (status !== 'all' && c.status !== status) return false
      if (!q) return true
      return [c.id, c.recordId, c.reason, c.requestedBy].join(' ').toLowerCase().includes(q)
    }).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  }, [kind, status, query])

  const appendedCount = CORRECTIONS.filter((c) => c.status === 'appended').length

  return (
    <div>
      <ViewHeader
        index="07"
        title="Corrections"
        blurb="Append-only dispute and correction trail. Original entries are never altered, every correction links forward from the record it supersedes."
        actions={<ExportJsonButton data={filtered} filename="arcwell-corrections.json" />}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ['Total entries', String(CORRECTIONS.length)],
          ['Appended to trail', String(appendedCount)],
          ['Currently open', String(CORRECTIONS.filter((c) => c.status === 'open').length)],
        ].map(([label, value], i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: i * 0.06 }}
            className="rounded-2xl border border-hairline bg-surface p-5"
          >
            <p className="tabular font-mono text-3xl text-ink">{value}</p>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">{label}</p>
          </motion.div>
        ))}
      </div>

      <Panel>
        <PanelHeader title="Correction trail" meta={`${filtered.length} entries`} />
        <div className="flex flex-col gap-3 border-b border-hairline px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput value={query} onChange={setQuery} placeholder="Search ID, record, reason…" className="w-full lg:max-w-sm" />
          <div className="flex flex-wrap items-center gap-3">
            <FilterChips options={KIND_FILTERS} value={kind} onChange={setKind} />
            <FilterChips options={STATUS_FILTERS} value={status} onChange={setStatus} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState onReset={() => { setKind('all'); setStatus('all'); setQuery('') }} />
        ) : (
          <ol className="relative px-5 py-6">
            <span aria-hidden className="absolute bottom-8 left-[29px] top-8 w-px bg-hairline" />
            {filtered.map((c, i) => (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: Math.min(i * 0.04, 0.4) }}
                className="relative mb-4 flex gap-4 last:mb-0"
              >
                <span
                  aria-hidden
                  className={`relative z-10 mt-1.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${
                    c.status === 'appended'
                      ? 'border-accent/50 bg-accent/15'
                      : c.status === 'open'
                        ? 'border-amber/50 bg-amber/15'
                        : 'border-hairline-strong bg-surface-2'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${c.status === 'appended' ? 'bg-accent' : c.status === 'open' ? 'bg-amber' : 'bg-ink-muted'}`} />
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(c)}
                  className="min-w-0 flex-1 rounded-xl border border-hairline bg-bg/40 px-4 py-3.5 text-left transition-colors duration-300 hover:border-hairline-strong hover:bg-surface-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs text-ink">
                      {c.id} <span className="text-faint">→</span> {c.recordId}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{c.kind}</span>
                      <StatusPill value={c.status} />
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">{c.reason}</p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                    {c.requestedBy} · {fmtDate(c.submittedAt)}
                    {c.supersedes && ` · supersedes ${c.supersedes}`}
                  </p>
                </button>
              </motion.li>
            ))}
          </ol>
        )}
      </Panel>

      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.id ?? ''}
        meta={selected ? `${selected.kind} · ${selected.requestedBy}` : undefined}
      >
        {selected && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusPill value={selected.status} />
              <CopyButton text={selected.hash} label="entry hash" />
              <ExportJsonButton data={selected} filename={`${selected.id}.json`} />
            </div>
            <dl>
              <FieldRow label="Record" mono>{selected.recordId}</FieldRow>
              <FieldRow label="Series" mono>{seriesById(selected.seriesId)?.code ?? selected.seriesId}</FieldRow>
              <FieldRow label="Kind">{selected.kind}</FieldRow>
              <FieldRow label="Requested by">{selected.requestedBy}</FieldRow>
              <FieldRow label="Submitted">{fmtDate(selected.submittedAt)}</FieldRow>
              <FieldRow label="Resolved">{selected.resolvedAt ? fmtDate(selected.resolvedAt) : ', open'}</FieldRow>
              <FieldRow label="Supersedes" mono>{selected.supersedes ?? ', '}</FieldRow>
              <FieldRow label="Entry hash" mono>{shortHash(selected.hash, 20)}</FieldRow>
              <FieldRow label="Reason">{selected.reason}</FieldRow>
            </dl>
            <p className="mt-6 rounded-xl border border-hairline bg-bg/50 p-4 text-xs leading-relaxed text-ink-muted">
              Corrections are append-only. The original entry, its evidence hash, and its anchor remain on ARC; the
              correction adds a new linked entry. Nothing is deleted or rewritten.
            </p>
          </div>
        )}
      </Drawer>
    </div>
  )
}
