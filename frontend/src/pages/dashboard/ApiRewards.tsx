import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, KeyRound, Plus, Webhook as WebhookIcon } from 'lucide-react'
import { API_KEYS, REWARD_RULES, WEBHOOKS } from '@/data/dashboard'
import type { ApiKey } from '@/data/dashboard'
import {
  CopyButton,
  EASE,
  ExportJsonButton,
  Panel,
  PanelHeader,
  StatusPill,
  Toggle,
  ViewHeader,
  fmtDate,
  fmtNum,
} from '@/pages/dashboard/ui'

const TABS = ['api keys', 'webhooks', 'reward rules', 'estimator'] as const
type Tab = (typeof TABS)[number]

function CreateKeyForm({ onCreate }: { onCreate: (label: string) => void }) {
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')
  const [created, setCreated] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = label.trim()
    if (trimmed.length < 4) {
      setError('Label must be at least 4 characters.')
      setCreated('')
      return
    }
    if (!/^[a-z0-9 -]+$/i.test(trimmed)) {
      setError('Letters, numbers, spaces and hyphens only.')
      setCreated('')
      return
    }
    setError('')
    onCreate(trimmed)
    setCreated(`arc_ro_${Math.random().toString(16).slice(2, 6)}`)
    setLabel('')
  }

  return (
    <form onSubmit={submit} className="border-t border-hairline px-5 py-5">
      <p className="kicker mb-3">Create read-only key</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={label}
          onChange={(e) => { setLabel(e.target.value); setError(''); setCreated('') }}
          placeholder="Key label, e.g. audit exporter q1"
          aria-label="New API key label"
          className="h-11 w-full rounded-full border border-hairline bg-bg px-4 text-sm text-ink placeholder:text-faint transition-colors focus:border-accent/50 focus:outline-none sm:max-w-sm"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-bg transition-colors hover:bg-ink/85"
        >
          <Plus size={14} />
          Create key
        </button>
      </div>
      {error && <p className="mt-2.5 font-mono text-xs text-amber">{error}</p>}
      {created && (
        <p className="mt-2.5 flex flex-wrap items-center gap-2 font-mono text-xs text-accent">
          <Check size={13} aria-hidden /> Key created: {created}… (mock, shown once)
          <CopyButton text={`${created}_full_mock_secret`} label="secret" />
        </p>
      )}
    </form>
  )
}

function Estimator() {
  const [confirmations, setConfirmations] = useState('40')
  const [findings, setFindings] = useState('2')
  const [annotations, setAnnotations] = useState('5')
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState('')

  const parse = (v: string) => {
    const n = Number(v)
    return Number.isInteger(n) && n >= 0 && n <= 10_000 ? n : null
  }

  const estimate = (e: React.FormEvent) => {
    e.preventDefault()
    const c = parse(confirmations)
    const f = parse(findings)
    const a = parse(annotations)
    if (c === null || f === null || a === null) {
      setError('Enter whole numbers between 0 and 10,000.')
      setResult(null)
      return
    }
    setError('')
    // rule bases: confirmation 8, upheld finding 120, annotation 15, with caps applied
    const total = Math.min(c, 200) * 8 + Math.min(f, 12) * 120 + Math.min(a, 40) * 15
    setResult(total)
  }

  const field = (label: string, value: string, set: (v: string) => void) => (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => { set(e.target.value); setResult(null); setError('') }}
        className="tabular h-11 w-full rounded-full border border-hairline bg-bg px-4 font-mono text-sm text-ink transition-colors focus:border-accent/50 focus:outline-none"
      />
    </label>
  )

  return (
    <Panel>
      <PanelHeader title="Reward estimator" meta="Objective rules · subject to separate review" />
      <form onSubmit={estimate} className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-3">
        {field('Confirmations / epoch', confirmations, setConfirmations)}
        {field('Upheld findings / epoch', findings, setFindings)}
        {field('Accepted annotations / epoch', annotations, setAnnotations)}
        <div className="sm:col-span-3">
          <button
            type="submit"
            className="inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-bg transition-colors hover:bg-ink/85"
          >
            Estimate rewards
          </button>
          {error && <p className="mt-2.5 font-mono text-xs text-amber">{error}</p>}
          <AnimatePresence>
            {result !== null && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="mt-4 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 font-mono text-sm text-accent"
              >
                Estimated: {fmtNum(result)} ARC-CREDIT this epoch, before anti-collusion screening and separate review.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </form>
    </Panel>
  )
}

export default function ApiRewards() {
  const [tab, setTab] = useState<Tab>('api keys')
  const [keys, setKeys] = useState<ApiKey[]>(API_KEYS)
  const [hooks, setHooks] = useState(WEBHOOKS)

  const activeKeys = useMemo(() => keys.filter((k) => k.status === 'active').length, [keys])

  const createKey = (label: string) => {
    const id = `key-${String(keys.length + 1).padStart(2, '0')}`
    const prefix = `arc_ro_${Math.random().toString(16).slice(2, 6)}`
    setKeys((prev) => [
      {
        id,
        label,
        prefix,
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        scopes: ['records:read'],
        status: 'active',
        requests30d: 0,
      },
      ...prev,
    ])
  }

  const toggleKey = (id: string) =>
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: k.status === 'active' ? 'revoked' : 'active' } : k)))

  const toggleHook = (id: string) =>
    setHooks((prev) => prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)))

  return (
    <div>
      <ViewHeader
        index="08"
        title="API & Rewards"
        blurb="Read-only data services, API keys, webhooks, and the objective reward rules that compensate valid verification work."
        actions={<ExportJsonButton data={{ keys, hooks, rules: REWARD_RULES }} filename="arcwell-api-rewards.json" />}
      />

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-full border border-hairline bg-surface p-1" role="tablist" aria-label="API and rewards views">
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
          {tab === 'api keys' && (
            <Panel>
              <PanelHeader title="Read-only API keys" meta={`${activeKeys} active · ${keys.length} total`} />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-hairline">
                      {['Label', 'Key prefix', 'Scopes', 'Requests · 30d', 'Last used', 'Status', ''].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((k) => (
                      <tr key={k.id} className="border-b border-hairline transition-colors hover:bg-surface-2/60">
                        <td className="px-4 py-3.5">
                          <span className="flex items-center gap-2 text-sm text-ink">
                            <KeyRound size={13} className="text-faint" aria-hidden />
                            {k.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted">
                            {k.prefix}…
                            <CopyButton text={`${k.prefix}_mock_secret`} label="key" className="h-6 px-2 text-[9px]" />
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="flex flex-wrap gap-1">
                            {k.scopes.map((s) => (
                              <span key={s} className="rounded-full border border-hairline px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-muted">{s}</span>
                            ))}
                          </span>
                        </td>
                        <td className="tabular px-4 py-3.5 font-mono text-xs text-ink-muted">{fmtNum(k.requests30d)}</td>
                        <td className="tabular whitespace-nowrap px-4 py-3.5 font-mono text-xs text-ink-muted">{fmtDate(k.lastUsedAt)}</td>
                        <td className="px-4 py-3.5"><StatusPill value={k.status} /></td>
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => toggleKey(k.id)}
                            className={`inline-flex h-8 items-center rounded-full border px-3 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                              k.status === 'active'
                                ? 'border-ink/30 text-ink hover:border-ink/60'
                                : 'border-hairline text-ink-muted hover:border-hairline-strong hover:text-ink'
                            }`}
                          >
                            {k.status === 'active' ? 'Revoke' : 'Restore'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <CreateKeyForm onCreate={createKey} />
            </Panel>
          )}

          {tab === 'webhooks' && (
            <Panel>
              <PanelHeader title="Webhooks" meta="Event notifications · signed payloads" />
              <ul className="divide-y divide-hairline">
                {hooks.map((w) => (
                  <li key={w.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 transition-colors hover:bg-surface-2/60">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full border ${w.enabled ? 'border-accent/40 text-accent' : 'border-hairline text-faint'}`}>
                      <WebhookIcon size={15} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-sm text-ink">{w.event}</span>
                      <span className="mt-0.5 block break-all font-mono text-[11px] text-faint">{w.endpoint}</span>
                    </span>
                    <span className="tabular font-mono text-xs text-ink-muted">
                      {fmtNum(w.deliveries)} delivered{w.failures > 0 ? ` · ${w.failures} failed` : ''}
                    </span>
                    <Toggle checked={w.enabled} onChange={() => toggleHook(w.id)} label={`${w.enabled ? 'Disable' : 'Enable'} ${w.event} webhook`} />
                  </li>
                ))}
              </ul>
              <p className="border-t border-hairline px-5 py-4 text-xs leading-relaxed text-faint">
                Webhooks are outbound-only notifications about registry events. They carry record metadata and proofs , never underlying document contents.
              </p>
            </Panel>
          )}

          {tab === 'reward rules' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {REWARD_RULES.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: EASE, delay: i * 0.05 }}
                  className="rounded-2xl border border-hairline bg-surface p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-base font-semibold text-ink">{r.name}</h3>
                    <span className="whitespace-nowrap rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-accent">
                      {r.baseReward} {r.unit}
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{r.description}</p>
                  <dl className="mt-4 space-y-2.5 border-t border-hairline pt-4 text-xs leading-relaxed">
                    <div><dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Cap</dt><dd className="mt-0.5 text-ink-muted">{r.cap}</dd></div>
                    <div><dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Eligibility</dt><dd className="mt-0.5 text-ink-muted">{r.eligibility}</dd></div>
                    <div><dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Anti-collusion</dt><dd className="mt-0.5 text-ink-muted">{r.antiCollusion}</dd></div>
                  </dl>
                </motion.div>
              ))}
            </div>
          )}

          {tab === 'estimator' && <Estimator />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
