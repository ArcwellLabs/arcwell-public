import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Database, FileLock, History, ShieldCheck } from 'lucide-react'
import { EVIDENCE_BUNDLES } from '@/data/dashboard'
import type { EvidenceBundle } from '@/data/dashboard'
import {
  CopyButton,
  Drawer,
  EASE,
  EmptyState,
  ExportJsonButton,
  FieldRow,
  Panel,
  PanelHeader,
  SearchInput,
  Select,
  StatusPill,
  ViewHeader,
  fmtBytes,
  fmtDate,
  shortHash,
} from '@/pages/dashboard/ui'

const TABS = ['bundles', 'access log', 'retention'] as const
type Tab = (typeof TABS)[number]

const ENC_OPTIONS = [
  { value: 'all', label: 'All encryption' },
  { value: 'org-held', label: 'Org-held keys' },
  { value: 'escrow', label: 'Threshold escrow' },
  { value: 'public', label: 'Public artifact' },
] as const

function encKey(b: EvidenceBundle): string {
  if (b.encryption.startsWith('AES-256-GCM, org')) return 'org-held'
  if (b.encryption.startsWith('AES-256-GCM, threshold')) return 'escrow'
  return 'public'
}

export default function Evidence() {
  const [tab, setTab] = useState<Tab>('bundles')
  const [query, setQuery] = useState('')
  const [enc, setEnc] = useState('all')
  const [selected, setSelected] = useState<EvidenceBundle | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return EVIDENCE_BUNDLES.filter((b) => {
      if (enc !== 'all' && encKey(b) !== enc) return false
      if (!q) return true
      return [b.id, b.storageUri, b.contentHash, b.transactionIds.join(' ')].join(' ').toLowerCase().includes(q)
    })
  }, [query, enc])

  const allAccess = useMemo(
    () =>
      EVIDENCE_BUNDLES.flatMap((b) => b.accessLog.map((a) => ({ ...a, bundle: b.id })))
        .sort((a, z) => z.at.localeCompare(a.at)),
    [],
  )

  return (
    <div>
      <ViewHeader
        index="05"
        title="Evidence"
        blurb="EvidenceBundle storage, content-addressed references, encryption posture, retention rules, and append-only access logs."
        actions={<ExportJsonButton data={filtered} filename="arcwell-evidence-bundles.json" />}
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-full border border-hairline bg-surface p-1" role="tablist" aria-label="Evidence views">
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
          {tab === 'bundles' && (
            <>
              <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <SearchInput value={query} onChange={setQuery} placeholder="Search bundle, URI, hash, transaction…" className="w-full lg:max-w-sm" />
                <Select label="Encryption" value={enc} onChange={setEnc} options={ENC_OPTIONS} />
              </div>
              {filtered.length === 0 ? (
                <Panel><EmptyState onReset={() => { setQuery(''); setEnc('all') }} /></Panel>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((b, i) => (
                    <motion.button
                      key={b.id}
                      type="button"
                      onClick={() => setSelected(b)}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, ease: EASE, delay: 0.03 * i }}
                      className="group flex flex-col rounded-2xl border border-hairline bg-surface p-5 text-left transition-colors duration-300 hover:border-hairline-strong hover:bg-surface-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-ink-muted transition-colors group-hover:border-accent/40 group-hover:text-accent">
                          <FileLock size={15} />
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{b.id}</span>
                      </div>
                      <p className="mt-4 break-all font-mono text-xs leading-relaxed text-ink">{b.storageUri}</p>
                      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-hairline pt-4">
                        <div>
                          <dd className="tabular font-mono text-base text-ink">{b.documentCount}</dd>
                          <dt className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">docs</dt>
                        </div>
                        <div>
                          <dd className="tabular font-mono text-base text-ink">{fmtBytes(b.sizeBytes)}</dd>
                          <dt className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">size</dt>
                        </div>
                        <div>
                          <dd className="tabular font-mono text-base text-ink">{b.transactionIds.length}</dd>
                          <dt className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">records</dt>
                        </div>
                      </dl>
                      <p className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                        <ShieldCheck size={12} className="text-accent" aria-hidden />
                        {encKey(b) === 'public' ? 'public artifact' : 'encrypted at rest'}
                      </p>
                    </motion.button>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'access log' && (
            <Panel>
              <PanelHeader title="Access log" meta="Append-only · storage layer" actions={<ExportJsonButton data={allAccess} filename="arcwell-evidence-access-log.json" />} />
              <ul className="divide-y divide-hairline">
                {allAccess.slice(0, 24).map((a, i) => (
                  <li key={`${a.bundle}-${i}`} className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-3.5 transition-colors hover:bg-surface-2/60">
                    <History size={14} className="shrink-0 text-faint" aria-hidden />
                    <span className="font-mono text-xs text-ink">{a.bundle}</span>
                    <span className="font-mono text-xs text-ink-muted">{a.actor}</span>
                    <StatusPill value={a.action === 'read' ? 'anchored' : a.action === 'attest' ? 'verified' : a.action === 'export' ? 'pending' : 'corrected'} className="normal-case" />
                    <span className="ml-auto tabular font-mono text-[10px] text-faint">{fmtDate(a.at)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {tab === 'retention' && (
            <Panel>
              <PanelHeader title="Retention schedule" meta="Per-bundle retention rules" />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-hairline">
                      {['Bundle', 'Encryption', 'Retain until', 'Size', 'Records'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {EVIDENCE_BUNDLES.map((b) => (
                      <tr key={b.id} onClick={() => setSelected(b)} className="cursor-pointer border-b border-hairline transition-colors hover:bg-surface-2/60">
                        <td className="px-4 py-3.5 font-mono text-xs text-ink">{b.id}</td>
                        <td className="px-4 py-3.5 text-sm text-ink-muted">{b.encryption}</td>
                        <td className="tabular px-4 py-3.5 font-mono text-xs text-ink-muted">{b.retentionUntil.slice(0, 10)}</td>
                        <td className="tabular px-4 py-3.5 font-mono text-xs text-ink-muted">{fmtBytes(b.sizeBytes)}</td>
                        <td className="tabular px-4 py-3.5 font-mono text-xs text-ink-muted">{b.transactionIds.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </motion.div>
      </AnimatePresence>

      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.id ?? ''}
        meta={selected ? `${selected.documentCount} documents · ${fmtBytes(selected.sizeBytes)}` : undefined}
      >
        {selected && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <CopyButton text={selected.contentHash} label="content hash" />
              <ExportJsonButton data={selected} filename={`${selected.id}.json`} />
            </div>
            <dl>
              <FieldRow label="Storage URI" mono>{selected.storageUri}</FieldRow>
              <FieldRow label="Content hash" mono>{shortHash(selected.contentHash, 20)}</FieldRow>
              <FieldRow label="Encryption">{selected.encryption}</FieldRow>
              <FieldRow label="Retention until" mono>{selected.retentionUntil.slice(0, 10)}</FieldRow>
              <FieldRow label="Linked records" mono>{selected.transactionIds.join(', ')}</FieldRow>
            </dl>
            <p className="kicker mb-3 mt-8">Access log</p>
            <ul className="space-y-2">
              {selected.accessLog.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-bg/40 px-4 py-3">
                  <span className="font-mono text-xs text-ink-muted">{a.actor} · {a.action}</span>
                  <span className="tabular font-mono text-[10px] text-faint">{fmtDate(a.at)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex items-start gap-2 rounded-xl border border-hairline bg-bg/50 p-4 text-xs leading-relaxed text-ink-muted">
              <Database size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              Evidence storage is content-addressed and permissioned. ARCWELL stores proofs and references; it does
              not custody underlying assets or certify document contents.
            </p>
          </div>
        )}
      </Drawer>
    </div>
  )
}
