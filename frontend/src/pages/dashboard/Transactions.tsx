import { ArcReceiptInspector } from './ArcTools'
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { TRANSACTIONS, VALIDATIONS, orgById, seriesById } from '@/data/dashboard'
import type { TransactionRecord, VerificationStatus, VisibilityPolicy } from '@/data/dashboard'
import {
  CopyButton,
  Drawer,
  EASE,
  EmptyState,
  ExportJsonButton,
  FieldRow,
  FilterChips,
  Pager,
  Panel,
  PanelHeader,
  SearchInput,
  Select,
  SortHeader,
  StatusPill,
  ViewHeader,
  fmtDate,
  fmtNum,
  shortHash,
} from '@/pages/dashboard/ui'

const STATUS_FILTERS = ['all', 'verified', 'anchored', 'pending', 'flagged', 'corrected'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const VIS_OPTIONS = [
  { value: 'all', label: 'All visibility' },
  { value: 'public', label: 'Public' },
  { value: 'permissioned', label: 'Permissioned' },
  { value: 'sealed', label: 'Sealed' },
] as const

type SortKey = 'eventTimestamp' | 'eventType' | 'verificationStatus'
type SortDir = 'asc' | 'desc'

const PER_PAGE = 10

function TxExpanded({ tx, onOpenFull }: { tx: TransactionRecord; onOpenFull: (tx: TransactionRecord) => void }) {
  const series = seriesById(tx.seriesId)
  const org = orgById(tx.organizationId)
  const validations = VALIDATIONS.filter((v) => v.recordId === tx.id)
  return (
    <div className="grid grid-cols-1 gap-6 border-t border-hairline bg-bg/40 px-5 py-5 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <p className="kicker mb-3">Record detail</p>
        <dl className="space-y-2.5 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-faint">Evidence hash</dt>
            <dd className="flex items-center gap-2 font-mono text-xs text-ink">
              {shortHash(tx.evidenceHash, 12)}
              <CopyButton text={tx.evidenceHash} label="hash" />
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-faint">Chain anchor</dt>
            <dd className="flex items-center gap-2 font-mono text-xs text-ink">
              slot {fmtNum(tx.chainAnchor.slot)} · {shortHash(tx.chainAnchor.hash, 8)}
              <CopyButton text={tx.chainAnchor.hash} label="anchor" />
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2"><dt className="text-faint">Storage URI</dt><dd className="break-all font-mono text-xs text-ink-muted">{tx.storageUri}</dd></div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-faint">Submitter signature</dt>
            <dd className="flex items-center gap-2 font-mono text-xs text-ink">
              {shortHash(tx.submitterSignature, 10)}
              <CopyButton text={tx.submitterSignature} label="signature" />
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2"><dt className="text-faint">Series</dt><dd className="text-ink">{series?.code ?? ', '}, {series?.name ?? ''}</dd></div>
          <div className="flex flex-wrap justify-between gap-2"><dt className="text-faint">Organization</dt><dd className="text-ink">{org?.name ?? ', '}</dd></div>
        </dl>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpenFull(tx) }}
          className="mt-4 inline-flex h-9 items-center rounded-full border border-hairline-strong px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink/50 hover:bg-ink/5"
        >
          Open full record
        </button>
      </div>
      <div>
        <p className="kicker mb-3">Validation results</p>
        {validations.length === 0 ? (
          <p className="text-sm text-faint">No validation results recorded for this record yet.</p>
        ) : (
          <ul className="space-y-2">
            {validations.map((v) => (
              <li key={v.id} className="rounded-xl border border-hairline bg-surface px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">{v.source}</span>
                  <StatusPill value={v.outcome} />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-muted">{v.detail}</p>
                <p className="mt-1.5 font-mono text-[10px] text-faint">{v.ruleSet} · {fmtDate(v.checkedAt)}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-[11px] leading-relaxed text-faint">
          Validation results are informational checks with source and time, they are not legal certifications.
        </p>
      </div>
    </div>
  )
}

export default function Transactions() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [visibility, setVisibility] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('eventTimestamp')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [selected, setSelected] = useState<TransactionRecord | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = TRANSACTIONS.filter((t) => {
      if (status !== 'all' && t.verificationStatus !== (status as VerificationStatus)) return false
      if (visibility !== 'all' && t.visibilityPolicy !== (visibility as VisibilityPolicy)) return false
      if (!q) return true
      const series = seriesById(t.seriesId)
      return [t.id, t.externalRef, t.eventType, t.evidenceHash, t.sourceSystem, series?.name ?? '', series?.code ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
    const dir = sortDir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      if (sortKey === 'eventTimestamp') return a.eventTimestamp.localeCompare(b.eventTimestamp) * dir
      return String(a[sortKey]).localeCompare(String(b[sortKey])) * dir
    })
  }, [query, status, visibility, sortKey, sortDir])

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, pages - 1)
  const visible = filtered.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
    setPage(0)
  }

  return (
    <div>
      <ViewHeader
        index="04"
        title="Transactions"
        blurb="TransactionRecord ledger, evidence of externally completed transactions, with status, evidence hashes, timestamps, and ARC anchors."
        actions={<ExportJsonButton data={filtered} filename="arcwell-transactions.json" />}
      />

      <ArcReceiptInspector />

      <Panel>
        <PanelHeader title="Transaction records" meta={`${filtered.length} of ${TRANSACTIONS.length} records`} />
        <div className="flex flex-col gap-3 border-b border-hairline px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(0) }} placeholder="Search ID, ref, hash, series…" className="w-full xl:max-w-sm" />
          <div className="flex flex-wrap items-center gap-3">
            <FilterChips options={STATUS_FILTERS} value={status} onChange={(v) => { setStatus(v); setPage(0) }} />
            <Select label="Visibility" value={visibility} onChange={(v) => { setVisibility(v); setPage(0) }} options={VIS_OPTIONS} />
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState onReset={() => { setQuery(''); setStatus('all'); setVisibility('all'); setPage(0) }} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hairline">
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Record</th>
                    <SortHeader label="Event type" active={sortKey === 'eventType'} dir={sortDir} onClick={() => toggleSort('eventType')} />
                    <SortHeader label="Timestamp" active={sortKey === 'eventTimestamp'} dir={sortDir} onClick={() => toggleSort('eventTimestamp')} />
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Evidence hash</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Anchor slot</th>
                    <SortHeader label="Status" active={sortKey === 'verificationStatus'} dir={sortDir} onClick={() => toggleSort('verificationStatus')} />
                    <th className="px-4 py-3" aria-label="Expand" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((tx) => {
                    const isOpen = expanded === tx.id
                    return [
                      <tr
                        key={tx.id}
                        onClick={() => setExpanded(isOpen ? null : tx.id)}
                        className="cursor-pointer border-b border-hairline transition-colors hover:bg-surface-2/60"
                      >
                        <td className="px-4 py-3.5">
                          <p className="font-mono text-xs text-ink">{tx.id}</p>
                          <p className="mt-0.5 font-mono text-[10px] text-faint">{tx.externalRef}</p>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-ink-muted">{tx.eventType}</td>
                        <td className="tabular whitespace-nowrap px-4 py-3.5 font-mono text-xs text-ink-muted">{fmtDate(tx.eventTimestamp)}</td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted">
                            {shortHash(tx.evidenceHash, 6)}
                            <span onClick={(e) => e.stopPropagation()}>
                              <CopyButton text={tx.evidenceHash} label="hash" className="h-6 px-2 text-[9px]" />
                            </span>
                          </span>
                        </td>
                        <td className="tabular px-4 py-3.5 font-mono text-xs text-ink-muted">{fmtNum(tx.chainAnchor.slot)}</td>
                        <td className="px-4 py-3.5"><StatusPill value={tx.verificationStatus} /></td>
                        <td className="px-4 py-3.5">
                          <ChevronDown size={15} className={`text-faint transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                        </td>
                      </tr>,
                      <tr key={`${tx.id}-detail`} className="border-b border-hairline">
                        <td colSpan={7} className="p-0">
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.35, ease: EASE }}
                                className="overflow-hidden"
                              >
                                <TxExpanded tx={tx} onOpenFull={setSelected} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>,
                    ]
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-hairline lg:hidden">
              {visible.map((tx) => {
                const isOpen = expanded === tx.id
                return (
                  <li key={tx.id}>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : tx.id)}
                      aria-expanded={isOpen}
                      className="w-full px-5 py-4 text-left transition-colors hover:bg-surface-2/60"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-xs text-ink">{tx.id}</span>
                        <StatusPill value={tx.verificationStatus} />
                      </div>
                      <p className="mt-1.5 text-sm text-ink-muted">{tx.eventType} · {tx.externalRef}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="tabular font-mono text-[10px] text-faint">{fmtDate(tx.eventTimestamp)} · slot {fmtNum(tx.chainAnchor.slot)}</span>
                        <ChevronDown size={14} className={`shrink-0 text-faint transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: EASE }}
                          className="overflow-hidden"
                        >
                          <TxExpanded tx={tx} onOpenFull={setSelected} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                )
              })}
            </ul>
          </>
        )}
        <Pager page={safePage} pages={pages} onChange={setPage} total={filtered.length} perPage={PER_PAGE} />
      </Panel>

      {/* Full record drawer */}
      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.id ?? ''}
        meta={selected ? `${selected.eventType} · ${fmtDate(selected.eventTimestamp)}` : undefined}
      >
        {selected && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusPill value={selected.verificationStatus} />
              <ExportJsonButton data={selected} filename={`${selected.id}.json`} />
            </div>
            <dl>
              <FieldRow label="External ref" mono>{selected.externalRef}</FieldRow>
              <FieldRow label="Event type">{selected.eventType}</FieldRow>
              <FieldRow label="Event timestamp">{fmtDate(selected.eventTimestamp)}</FieldRow>
              <FieldRow label="Visibility">{selected.visibilityPolicy}</FieldRow>
              <FieldRow label="Source system">{selected.sourceSystem}</FieldRow>
              <FieldRow label="Corrections" mono>{String(selected.correctionCount)}</FieldRow>
            </dl>
          </div>
        )}
      </Drawer>
    </div>
  )
}
