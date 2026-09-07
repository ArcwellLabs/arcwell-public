import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FINDINGS, VERIFIERS, verifierById } from '@/data/dashboard'
import type { Verifier, VerifierFinding } from '@/data/dashboard'
import {
  Drawer,
  EASE,
  EmptyState,
  ExportJsonButton,
  FieldRow,
  FilterChips,
  Panel,
  PanelHeader,
  SearchInput,
  SortHeader,
  StatusPill,
  ViewHeader,
  fmtDate,
  fmtNum,
  timeAgo,
} from '@/pages/dashboard/ui'

const TABS = ['leaderboard', 'findings queue', 'appeals'] as const
type Tab = (typeof TABS)[number]

const FINDING_FILTERS = ['all', 'open', 'upheld', 'dismissed', 'appealed'] as const
type FindingFilter = (typeof FINDING_FILTERS)[number]

type SortKey = 'reputation' | 'accuracy' | 'reviews'
type SortDir = 'asc' | 'desc'

function ReputationBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2" role="img" aria-label={`Reputation ${value} of 100`}>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: value / 100 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="h-full origin-left rounded-full bg-accent"
      />
    </div>
  )
}

export default function Verifiers() {
  const [tab, setTab] = useState<Tab>('leaderboard')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('reputation')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [findingFilter, setFindingFilter] = useState<FindingFilter>('all')
  const [selectedVerifier, setSelectedVerifier] = useState<Verifier | null>(null)
  const [selectedFinding, setSelectedFinding] = useState<VerifierFinding | null>(null)

  const verifiers = useMemo(() => {
    const q = query.trim().toLowerCase()
    const dir = sortDir === 'asc' ? 1 : -1
    return VERIFIERS.filter((v) => !q || v.handle.toLowerCase().includes(q) || v.tier.toLowerCase() === q).sort(
      (a, b) => (a[sortKey] - b[sortKey]) * dir,
    )
  }, [query, sortKey, sortDir])

  const findings = useMemo(
    () => FINDINGS.filter((f) => findingFilter === 'all' || f.status === findingFilter),
    [findingFilter],
  )

  const appeals = useMemo(() => FINDINGS.filter((f) => f.status === 'appealed'), [])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  return (
    <div>
      <ViewHeader
        index="06"
        title="Verifiers"
        blurb="Independent verifier workspace, review queue, structured findings, reputation, and challenge / appeal history."
        actions={<ExportJsonButton data={{ verifiers, findings }} filename="arcwell-verifiers.json" />}
      />

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-full border border-hairline bg-surface p-1" role="tablist" aria-label="Verifier views">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`h-9 flex-1 whitespace-nowrap rounded-full px-5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-300 ${
              tab === t ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE }}>
          {tab === 'leaderboard' && (
            <Panel>
              <PanelHeader
                title="Verifier reputation"
                meta={`${VERIFIERS.filter((v) => v.status === 'active').length} active of ${VERIFIERS.length}`}
                actions={<SearchInput value={query} onChange={setQuery} placeholder="Search handle / tier…" className="w-full sm:w-64" />}
              />
              {verifiers.length === 0 ? (
                <EmptyState onReset={() => setQuery('')} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px]">
                    <thead>
                      <tr className="border-b border-hairline">
                        <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Verifier</th>
                        <SortHeader label="Reputation" active={sortKey === 'reputation'} dir={sortDir} onClick={() => toggleSort('reputation')} />
                        <SortHeader label="Accuracy" active={sortKey === 'accuracy'} dir={sortDir} onClick={() => toggleSort('accuracy')} />
                        <SortHeader label="Reviews" active={sortKey === 'reviews'} dir={sortDir} onClick={() => toggleSort('reviews')} />
                        <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Challenges</th>
                        <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifiers.map((v) => (
                        <tr key={v.id} onClick={() => setSelectedVerifier(v)} className="cursor-pointer border-b border-hairline transition-colors hover:bg-surface-2/60">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline font-mono text-[9px] uppercase text-ink-muted">
                                {v.tier}
                              </span>
                              <span className="font-mono text-sm text-ink">{v.handle}</span>
                            </div>
                          </td>
                          <td className="w-40 px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <ReputationBar value={v.reputation} />
                              <span className="tabular font-mono text-xs text-ink">{v.reputation}</span>
                            </div>
                          </td>
                          <td className="tabular px-4 py-3.5 font-mono text-xs text-ink-muted">{v.accuracy.toFixed(1)}%</td>
                          <td className="tabular px-4 py-3.5 font-mono text-xs text-ink-muted">{fmtNum(v.reviews)}</td>
                          <td className="tabular px-4 py-3.5 font-mono text-xs text-ink-muted">
                            {v.openChallenges} open · {v.appealsWon}W/{v.appealsLost}L
                          </td>
                          <td className="px-4 py-3.5"><StatusPill value={v.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          )}

          {tab === 'findings queue' && (
            <Panel>
              <PanelHeader title="Structured findings" meta={`${findings.length} shown`} />
              <div className="border-b border-hairline px-5 py-3.5">
                <FilterChips options={FINDING_FILTERS} value={findingFilter} onChange={setFindingFilter} />
              </div>
              {findings.length === 0 ? (
                <EmptyState onReset={() => setFindingFilter('all')} />
              ) : (
                <ul className="divide-y divide-hairline">
                  {findings.map((f) => {
                    const v = verifierById(f.verifierId)
                    return (
                      <li key={f.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedFinding(f)}
                          className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-left transition-colors hover:bg-surface-2/60"
                        >
                          <span className={`h-2 w-2 shrink-0 rounded-full ${f.kind === 'discrepancy' ? 'bg-ink' : f.kind === 'confirmation' ? 'bg-accent' : 'bg-amber'}`} aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-ink">{f.summary}</span>
                            <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                              {f.id} · {v?.handle ?? f.verifierId} · {f.recordId} · {timeAgo(f.submittedAt)}
                            </span>
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{f.severity}</span>
                          <StatusPill value={f.status} />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Panel>
          )}

          {tab === 'appeals' && (
            <Panel>
              <PanelHeader title="Challenges & appeals" meta={`${appeals.length} under appeal`} />
              {appeals.length === 0 ? (
                <EmptyState />
              ) : (
                <ul className="divide-y divide-hairline">
                  {appeals.map((f) => {
                    const v = verifierById(f.verifierId)
                    return (
                      <li key={f.id} className="px-5 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-mono text-xs text-ink">{f.id}, {f.recordId}</p>
                          <StatusPill value={f.status} />
                        </div>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{f.summary}</p>
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                          filed by {v?.handle ?? f.verifierId} · {fmtDate(f.submittedAt)} · reviewer panel of 3 assigned
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
              <p className="border-t border-hairline px-5 py-4 text-xs leading-relaxed text-faint">
                Appeals are decided by an independent reviewer panel. Outcomes adjust verifier reputation and, where a
                discrepancy is upheld, open a correction entry on the record.
              </p>
            </Panel>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Verifier drawer */}
      <Drawer
        open={selectedVerifier !== null}
        onClose={() => setSelectedVerifier(null)}
        title={selectedVerifier ? `verifier:${selectedVerifier.handle}` : ''}
        meta={selectedVerifier ? `${selectedVerifier.tier} · joined ${fmtDate(selectedVerifier.joinedAt)}` : undefined}
      >
        {selectedVerifier && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusPill value={selectedVerifier.status} />
              <ExportJsonButton data={selectedVerifier} filename={`verifier-${selectedVerifier.handle}.json`} />
            </div>
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                <span>Reputation</span>
                <span className="text-ink">{selectedVerifier.reputation}/100</span>
              </div>
              <ReputationBar value={selectedVerifier.reputation} />
            </div>
            <dl>
              <FieldRow label="Tier" mono>{selectedVerifier.tier}</FieldRow>
              <FieldRow label="Accuracy" mono>{selectedVerifier.accuracy.toFixed(1)}%</FieldRow>
              <FieldRow label="Reviews completed" mono>{fmtNum(selectedVerifier.reviews)}</FieldRow>
              <FieldRow label="Open challenges" mono>{String(selectedVerifier.openChallenges)}</FieldRow>
              <FieldRow label="Appeals" mono>{selectedVerifier.appealsWon} won · {selectedVerifier.appealsLost} lost</FieldRow>
            </dl>
            <p className="kicker mb-3 mt-8">Recent findings</p>
            <ul className="space-y-2">
              {FINDINGS.filter((f) => f.verifierId === selectedVerifier.id).slice(0, 4).map((f) => (
                <li key={f.id} className="rounded-xl border border-hairline bg-bg/40 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{f.kind} · {f.recordId}</span>
                    <StatusPill value={f.status} />
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{f.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Drawer>

      {/* Finding drawer */}
      <Drawer
        open={selectedFinding !== null}
        onClose={() => setSelectedFinding(null)}
        title={selectedFinding?.id ?? ''}
        meta={selectedFinding ? `${selectedFinding.kind} · ${selectedFinding.severity} severity` : undefined}
      >
        {selectedFinding && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusPill value={selectedFinding.status} />
              <ExportJsonButton data={selectedFinding} filename={`${selectedFinding.id}.json`} />
            </div>
            <dl>
              <FieldRow label="Verifier" mono>{verifierById(selectedFinding.verifierId)?.handle ?? selectedFinding.verifierId}</FieldRow>
              <FieldRow label="Record" mono>{selectedFinding.recordId}</FieldRow>
              <FieldRow label="Kind">{selectedFinding.kind}</FieldRow>
              <FieldRow label="Severity">{selectedFinding.severity}</FieldRow>
              <FieldRow label="Submitted">{fmtDate(selectedFinding.submittedAt)}</FieldRow>
              <FieldRow label="Summary">{selectedFinding.summary}</FieldRow>
            </dl>
            <p className="mt-6 rounded-xl border border-hairline bg-bg/50 p-4 text-xs leading-relaxed text-ink-muted">
              Findings describe evidence quality only. They are not determinations about the legality or validity of
              any underlying transaction.
            </p>
          </div>
        )}
      </Drawer>
    </div>
  )
}
