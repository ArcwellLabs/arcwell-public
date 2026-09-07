import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { ORGANIZATIONS, RECORD_SERIES, TRANSACTIONS } from '@/data/dashboard'
import type { OrganizationProfile } from '@/data/dashboard'
import {
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
  StatusPill,
  ViewHeader,
  fmtDate,
  fmtNum,
  timeAgo,
} from '@/pages/dashboard/ui'

const STATUS_FILTERS = ['all', 'active', 'probation', 'suspended'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const PER_PAGE = 6

export default function Organizations() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [selected, setSelected] = useState<OrganizationProfile | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ORGANIZATIONS.filter((o) => {
      if (status !== 'all' && o.status !== status) return false
      if (!q) return true
      return [o.name, o.code, o.jurisdiction, o.role].join(' ').toLowerCase().includes(q)
    })
  }, [query, status])

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, pages - 1)
  const visible = filtered.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE)

  const reset = () => { setQuery(''); setStatus('all'); setPage(0) }

  return (
    <div>
      <ViewHeader
        index="02"
        title="Organizations"
        blurb="Submitting organizations and record originators authorized on ARCWELL, with authorization metadata and submission status."
        actions={<ExportJsonButton data={filtered} filename="arcwell-organizations.json" />}
      />

      <Panel>
        <PanelHeader title="Organization profiles" meta={`${filtered.length} of ${ORGANIZATIONS.length} shown`} />
        <div className="flex flex-col gap-3 border-b border-hairline px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(0) }} placeholder="Search name, code, jurisdiction…" className="w-full lg:max-w-sm" />
          <FilterChips options={STATUS_FILTERS} value={status} onChange={(v) => { setStatus(v); setPage(0) }} />
        </div>

        {visible.length === 0 ? (
          <EmptyState onReset={reset} />
        ) : (
          <ul className="divide-y divide-hairline">
            {visible.map((org) => {
              const isOpen = expanded === org.id
              const series = RECORD_SERIES.filter((s) => s.organizationId === org.id)
              const txCount = TRANSACTIONS.filter((t) => t.organizationId === org.id).length
              return (
                <li key={org.id}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : org.id)}
                    aria-expanded={isOpen}
                    className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 text-left transition-colors hover:bg-surface-2/60"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
                      {org.code.slice(4)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{org.name}</span>
                      <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                        {org.code} · {org.jurisdiction} · {org.authorization}
                      </span>
                    </span>
                    <span className="hidden tabular font-mono text-xs text-ink-muted md:block">{fmtNum(org.recordsSubmitted)} records</span>
                    <StatusPill value={org.status} />
                    <ChevronDown size={15} className={`shrink-0 text-faint transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 gap-6 border-t border-hairline bg-bg/40 px-5 py-5 md:grid-cols-3">
                          <div>
                            <p className="kicker mb-3">Authorization</p>
                            <dl className="space-y-2 text-sm">
                              <div className="flex justify-between gap-4"><dt className="text-faint">Scope</dt><dd className="text-ink">{org.authorization}</dd></div>
                              <div className="flex justify-between gap-4"><dt className="text-faint">Default visibility</dt><dd className="text-ink">{org.visibilityDefault}</dd></div>
                              <div className="flex justify-between gap-4"><dt className="text-faint">Role</dt><dd className="text-ink">{org.role}</dd></div>
                            </dl>
                          </div>
                          <div>
                            <p className="kicker mb-3">Activity</p>
                            <dl className="space-y-2 text-sm">
                              <div className="flex justify-between gap-4"><dt className="text-faint">Anchors</dt><dd className="tabular font-mono text-ink">{fmtNum(org.anchorsSubmitted)}</dd></div>
                              <div className="flex justify-between gap-4"><dt className="text-faint">Records</dt><dd className="tabular font-mono text-ink">{fmtNum(org.recordsSubmitted)}</dd></div>
                              <div className="flex justify-between gap-4"><dt className="text-faint">Open flags</dt><dd className={`tabular font-mono ${org.openFlags > 0 ? 'text-amber' : 'text-ink'}`}>{org.openFlags}</dd></div>
                            </dl>
                          </div>
                          <div>
                            <p className="kicker mb-3">Series on ARCWELL</p>
                            {series.length === 0 ? (
                              <p className="text-sm text-faint">No series linked.</p>
                            ) : (
                              <ul className="space-y-1.5">
                                {series.slice(0, 3).map((s) => (
                                  <li key={s.id} className="truncate font-mono text-xs text-ink-muted">{s.code}, {s.recordCount} records</li>
                                ))}
                              </ul>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelected(org)}
                              className="mt-4 inline-flex h-9 items-center rounded-full border border-hairline-strong px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink/50 hover:bg-ink/5"
                            >
                              Full profile ({txCount} records)
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>
        )}
        <Pager page={safePage} pages={pages} onChange={setPage} total={filtered.length} perPage={PER_PAGE} />
      </Panel>

      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        meta={selected ? `${selected.code} · joined ${fmtDate(selected.joinedAt)}` : undefined}
      >
        {selected && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <StatusPill value={selected.status} />
              <ExportJsonButton data={selected} filename={`${selected.code.toLowerCase()}-profile.json`} />
            </div>
            <dl>
              <FieldRow label="Organization ID" mono>{selected.id}</FieldRow>
              <FieldRow label="Role">{selected.role}</FieldRow>
              <FieldRow label="Jurisdiction" mono>{selected.jurisdiction}</FieldRow>
              <FieldRow label="Authorization">{selected.authorization}</FieldRow>
              <FieldRow label="Default visibility">{selected.visibilityDefault}</FieldRow>
              <FieldRow label="Records submitted" mono>{fmtNum(selected.recordsSubmitted)}</FieldRow>
              <FieldRow label="Anchors submitted" mono>{fmtNum(selected.anchorsSubmitted)}</FieldRow>
              <FieldRow label="Open flags" mono>{String(selected.openFlags)}</FieldRow>
              <FieldRow label="Last activity">{timeAgo(selected.lastActiveAt)}</FieldRow>
            </dl>
            <p className="mt-6 rounded-xl border border-hairline bg-bg/50 p-4 text-xs leading-relaxed text-ink-muted">
              Authorization metadata is descriptive only. ARCWELL does not certify an organization&apos;s legal
              status, licensing, or compliance position.
            </p>
          </div>
        )}
      </Drawer>
    </div>
  )
}
