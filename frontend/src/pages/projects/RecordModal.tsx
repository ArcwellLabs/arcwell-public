import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Copy, X } from 'lucide-react'
import PillButton from '@/components/PillButton'
import { getLenis } from '@/lib/lenis'
import type { RecordSeries } from '@/data/projects'

interface RecordModalProps {
  series: RecordSeries | null
  onClose: () => void
}

function FieldRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-t border-hairline py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{label}</span>
      <span className={(mono ? 'break-all font-mono text-[13px] ' : 'text-sm ') + 'leading-relaxed text-ink'}>{value}</span>
    </div>
  )
}

/** Record-detail modal, TransactionRecord fields + EvidenceBundle summary. Esc/backdrop close. */
export default function RecordModal({ series, onClose }: RecordModalProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!series) return
    setCopied(false)
    const lenis = getLenis()
    lenis?.stop()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      lenis?.start()
      window.removeEventListener('keydown', onKey)
    }
  }, [series, onClose])

  const copyHash = async () => {
    if (!series) return
    try {
      await navigator.clipboard.writeText(series.record.evidenceHash)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  if (!series) return null

  return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 md:p-8">
          <motion.button
            type="button"
            aria-label="Close record details"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${series.title} record details`}
            data-lenis-prevent
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative max-h-[90dvh] w-full max-w-3xl overflow-y-auto overflow-x-hidden rounded-[20px] border border-hairline-strong bg-surface shadow-card"
          >
            <div className="relative">
              <img
                src={series.image}
                alt={`Abstract visual for the ${series.title} RecordSeries`}
                className="aspect-[16/10] w-full object-cover"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-hairline-strong bg-bg/60 text-ink backdrop-blur-md transition-colors duration-300 hover:border-ink/60"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 md:p-10">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-faint">
                [{series.index}], {series.category} · {series.record.visibilityPolicy} · {series.record.verificationStatus}
              </p>
              <h3 className="mt-3 font-display text-[clamp(28px,3.5vw,44px)] font-semibold leading-[1.05] tracking-[-0.02em] text-ink">
                {series.title}, RecordSeries
              </h3>
              <p className="mt-4 max-w-xl text-base leading-[1.65] text-ink-muted">{series.summary}</p>

              {/* Series stats */}
              <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-3">
                {series.stats.map((s) => (
                  <div key={s.label} className="bg-surface-2 p-5">
                    <p className="font-mono text-2xl font-medium text-ink tabular">{s.value}</p>
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Representative TransactionRecord */}
              <div className="mt-10">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
                    TransactionRecord, representative entry
                  </h4>
                  <button
                    type="button"
                    onClick={copyHash}
                    className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-hairline px-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted transition-colors duration-300 hover:border-hairline-strong hover:text-ink"
                  >
                    {copied ? <Check size={12} className="text-accent" /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy hash'}
                  </button>
                </div>
                <div className="mt-4 border-b border-hairline">
                  <FieldRow label="Submitting organization" value={series.record.submittingOrganization} mono={false} />
                  <FieldRow label="External transaction ref" value={series.record.externalTransactionReference} />
                  <FieldRow label="Event type" value={series.record.eventType} mono={false} />
                  <FieldRow label="Event timestamp" value={series.record.eventTimestamp} />
                  <FieldRow label="Evidence hash" value={series.record.evidenceHash} />
                  <FieldRow label="Storage URI" value={series.record.storageUri} />
                  <FieldRow label="Submitter signature" value={series.record.submitterSignature} />
                  <FieldRow label="Chain anchor" value={series.record.chainAnchor} />
                  <FieldRow label="Visibility policy" value={series.record.visibilityPolicy} mono={false} />
                  <FieldRow label="Verification status" value={series.record.verificationStatus} mono={false} />
                  <FieldRow label="Source-system identifier" value={series.record.sourceSystemId} />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-faint">
                  An ARC entry proves this data was submitted at the stated time and has not been altered. It does not by
                  itself prove the underlying transaction was lawful, valid, authorized, complete, or correctly
                  classified.
                </p>
              </div>

              {/* EvidenceBundle summary */}
              <div className="mt-10">
                <h4 className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
                  EvidenceBundle, summary
                </h4>
                <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-5">
                  {[
                    { value: series.bundle.transactionIds, label: 'Transaction IDs' },
                    { value: series.bundle.signatures, label: 'Signatures' },
                    { value: series.bundle.timestamps, label: 'Timestamps' },
                    { value: series.bundle.documents, label: 'Documents' },
                  ].map((b) => (
                    <div key={b.label} className="bg-surface-2 p-4">
                      <p className="font-mono text-xl font-medium text-ink tabular">{b.value.toLocaleString('en-US')}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{b.label}</p>
                    </div>
                  ))}
                  <div className="col-span-2 bg-surface-2 p-4 sm:col-span-1">
                    <p className="font-mono text-sm font-medium leading-6 text-ink">{series.bundle.retention}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">Retention</p>
                  </div>
                </div>
              </div>

              {/* Correction history */}
              <div className="mt-10">
                <h4 className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
                  Correction history, append-only
                </h4>
                {series.record.correctionHistory.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {series.record.correctionHistory.map((c) => (
                      <li
                        key={c}
                        className="rounded-lg border border-hairline bg-surface-2 px-4 py-3 text-sm leading-relaxed text-ink-muted"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 rounded-lg border border-hairline bg-surface-2 px-4 py-3 text-sm leading-relaxed text-ink-muted">
                    No corrections filed. The original anchored entry stands unmodified.
                  </p>
                )}
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <PillButton to="/contact" onClick={onClose}>
                  Start a verification pilot
                </PillButton>
                <PillButton variant="outline" onClick={onClose}>
                  Back to explorer
                </PillButton>
              </div>
            </div>
          </motion.div>
        </div>
  )
}
