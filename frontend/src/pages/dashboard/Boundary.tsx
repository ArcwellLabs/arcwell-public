import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, CircleSlash, ShieldAlert } from 'lucide-react'
import { BOUNDARY_MEMO, DISCLAIMER } from '@/data/dashboard'
import {
  CopyButton,
  EASE,
  ExportJsonButton,
  Panel,
  PanelHeader,
  Toggle,
  ViewHeader,
} from '@/pages/dashboard/ui'

interface SettingDef {
  id: string
  label: string
  description: string
  default: boolean
}

const SETTINGS: SettingDef[] = [
  { id: 'digest', label: 'Weekly audit digest', description: 'Email summary of anchors, flags, and corrections across your series.', default: true },
  { id: 'flag-alerts', label: 'Flag alerts', description: 'Notify immediately when a verifier flags a record in your series.', default: true },
  { id: 'anchor-receipts', label: 'Anchor receipts', description: 'Attach ARC slot proofs to every export you download.', default: false },
  { id: 'public-index', label: 'Public explorer indexing', description: 'Allow metadata of public-visibility series to appear in the record explorer.', default: true },
  { id: 'strict-terminology', label: 'Terminology lint in portal', description: 'Warn when drafts use off-boundary language (e.g. securities terminology).', default: true },
]

export default function Boundary() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(SETTINGS.map((s) => [s.id, s.default])),
  )
  const [saved, setSaved] = useState(false)

  const save = () => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <ViewHeader
        index="09"
        title="Settings / Boundary"
        blurb="Workspace preferences, the product-boundary memo, and the terminology discipline every ARCWELL surface follows."
        actions={<ExportJsonButton data={{ disclaimer: DISCLAIMER, boundary: BOUNDARY_MEMO, settings: toggles }} filename="arcwell-boundary.json" />}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left column: memo + disclaimer */}
        <div className="space-y-6 xl:col-span-7">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
            <Panel>
              <PanelHeader
                title={BOUNDARY_MEMO.title}
                meta="Canonical statement"
                actions={<ShieldAlert size={15} className="text-amber" aria-hidden />}
              />
              <div className="px-5 py-5">
                <p className="text-base leading-[1.65] text-ink">{BOUNDARY_MEMO.summary}</p>
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <p className="kicker mb-3 flex items-center gap-2">
                      <Check size={13} className="text-accent" aria-hidden /> ARCWELL does
                    </p>
                    <ul className="space-y-2">
                      {BOUNDARY_MEMO.does.map((d) => (
                        <li key={d} className="flex gap-2.5 text-sm leading-relaxed text-ink-muted">
                          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="kicker mb-3 flex items-center gap-2">
                      <CircleSlash size={13} className="text-ink" aria-hidden /> ARCWELL does not
                    </p>
                    <ul className="space-y-2">
                      {BOUNDARY_MEMO.doesNot.map((d) => (
                        <li key={d} className="flex gap-2.5 text-sm leading-relaxed text-ink-muted">
                          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink/70" aria-hidden />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Panel>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.08 }}>
            <Panel>
              <PanelHeader
                title="Disclaimer"
                meta="Shown on every ARCWELL surface"
                actions={<CopyButton text={DISCLAIMER} label="disclaimer" />}
              />
              <p className="px-5 py-5 text-sm leading-[1.7] text-ink-muted">{DISCLAIMER}</p>
            </Panel>
          </motion.div>
        </div>

        {/* Right column: terminology + settings */}
        <div className="space-y-6 xl:col-span-5">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}>
            <Panel>
              <PanelHeader title="Terminology rules" meta="Use / never use" />
              <ul className="divide-y divide-hairline">
                {BOUNDARY_MEMO.terminology.map(([use, not]) => (
                  <li key={use} className="px-5 py-3">
                    <p className="text-sm text-ink">{use}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-faint line-through decoration-ink/50">
                      {not}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}>
            <Panel>
              <PanelHeader title="Workspace settings" meta="Stored locally (mock)" />
              <ul className="divide-y divide-hairline">
                {SETTINGS.map((s) => (
                  <li key={s.id} className="flex items-start justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <p className="text-sm text-ink">{s.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{s.description}</p>
                    </div>
                    <Toggle
                      checked={toggles[s.id]}
                      onChange={(v) => { setToggles((prev) => ({ ...prev, [s.id]: v })); setSaved(false) }}
                      label={`Toggle ${s.label}`}
                    />
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-3 border-t border-hairline px-5 py-4">
                <button
                  type="button"
                  onClick={save}
                  className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-medium text-bg transition-colors hover:bg-ink/85"
                >
                  Save preferences
                </button>
                {saved && (
                  <span className="flex items-center gap-1.5 font-mono text-xs text-accent">
                    <Check size={13} aria-hidden /> Preferences saved
                  </span>
                )}
              </div>
            </Panel>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
