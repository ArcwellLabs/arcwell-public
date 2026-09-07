import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Copy, Download, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

/* ---------------- formatting helpers ---------------- */

export const fmtNum = (n: number) => n.toLocaleString('en-US')
export const shortHash = (h: string, keep = 8) => (h.length <= keep * 2 ? h : `${h.slice(0, keep)}…${h.slice(-keep)}`)

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  if (Number.isNaN(diff)) return iso
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function fmtBytes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MB`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} KB`
  return `${n} B`
}

export function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  // Force UTC so the server and browser render identical text (no hydration mismatch).
  return d.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })
}


/* ---------------- Panel ---------------- */

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-hairline bg-surface', className)}>
      {children}
    </div>
  )
}

export function PanelHeader({ title, meta, actions }: { title: string; meta?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4">
      <div>
        <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
        {meta && <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{meta}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ---------------- Status pill / dot ---------------- */

const STATUS_TONE: Record<string, string> = {
  verified: 'text-accent border-accent/30 bg-accent/10',
  anchored: 'text-ink border-hairline-strong bg-surface-2',
  active: 'text-accent border-accent/30 bg-accent/10',
  operational: 'text-accent border-accent/30 bg-accent/10',
  pass: 'text-accent border-accent/30 bg-accent/10',
  appended: 'text-accent border-accent/30 bg-accent/10',
  upheld: 'text-accent border-accent/30 bg-accent/10',
  steady: 'text-accent border-accent/30 bg-accent/10',
  pending: 'text-amber border-amber/30 bg-amber/10',
  warn: 'text-amber border-amber/30 bg-amber/10',
  anchoring: 'text-amber border-amber/30 bg-amber/10',
  probation: 'text-amber border-amber/30 bg-amber/10',
  paused: 'text-amber border-amber/30 bg-amber/10',
  appealed: 'text-amber border-amber/30 bg-amber/10',
  flagged: 'text-ink border-ink/30 bg-ink/10',
  fail: 'text-ink border-ink/30 bg-ink/10',
  suspended: 'text-ink border-ink/30 bg-ink/10',
  rejected: 'text-ink border-ink/30 bg-ink/10',
  dismissed: 'text-ink-muted border-hairline bg-transparent',
  open: 'text-amber border-amber/30 bg-amber/10',
  review: 'text-amber border-amber/30 bg-amber/10',
  'under-review': 'text-amber border-amber/30 bg-amber/10',
  corrected: 'text-ink border-hairline-strong bg-surface-2',
  revoked: 'text-ink-muted border-hairline bg-transparent line-through',
}

export function StatusPill({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em]',
        STATUS_TONE[value] ?? 'border-hairline text-ink-muted',
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {value}
    </span>
  )
}

/* ---------------- Search input ---------------- */

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" aria-hidden />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-full border border-hairline bg-surface pl-9 pr-9 text-sm text-ink placeholder:text-faint transition-colors focus:border-accent/50 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-faint hover:text-ink"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}

/* ---------------- Filter chips ---------------- */

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="group" aria-label="Filters">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          aria-pressed={value === opt}
          className={cn(
            'inline-flex h-9 items-center rounded-full border px-4 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-300',
            value === opt
              ? 'border-ink bg-ink text-bg'
              : 'border-hairline text-ink-muted hover:border-hairline-strong hover:text-ink',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

/* ---------------- Select ---------------- */

export function Select({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: string
  onChange: (v: string) => void
  options: ReadonlyArray<{ value: string; label: string }>
  label: string
  className?: string
}) {
  return (
    <label className={cn('flex items-center gap-2', className)}>
      <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 cursor-pointer rounded-full border border-hairline bg-surface px-3.5 text-xs text-ink transition-colors focus:border-accent/50 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface text-ink">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/* ---------------- Copy button ---------------- */

export function CopyButton({ text, label, className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label ? `Copy ${label}` : 'Copy to clipboard'}
      title={copied ? 'Copied' : 'Copy'}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors duration-300',
        copied ? 'border-accent/50 text-accent' : 'border-hairline text-ink-muted hover:border-hairline-strong hover:text-ink',
        className,
      )}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : label ?? 'Copy'}
    </button>
  )
}

/* ---------------- Export JSON ---------------- */

export function ExportJsonButton({ data, filename, className }: { data: unknown; filename: string; className?: string }) {
  const [done, setDone] = useState(false)
  const timer = useRef<number | null>(null)
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])

  const download = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDone(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDone(false), 1800)
  }

  return (
    <button
      type="button"
      onClick={download}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full border px-4 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-300',
        done ? 'border-accent/50 text-accent' : 'border-hairline text-ink-muted hover:border-hairline-strong hover:text-ink',
        className,
      )}
    >
      {done ? <Check size={13} /> : <Download size={13} />}
      {done ? 'Exported' : 'Export JSON'}
    </button>
  )
}

/* ---------------- Pagination ---------------- */

export function Pager({
  page,
  pages,
  onChange,
  total,
  perPage,
}: {
  page: number
  pages: number
  onChange: (p: number) => void
  total: number
  perPage: number
}) {
  if (pages <= 1 && total <= perPage) return null
  const from = total === 0 ? 0 : page * perPage + 1
  const to = Math.min(total, (page + 1) * perPage)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-5 py-3.5">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
        {from}-{to} of {fmtNum(total)}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: pages }, (_, i) => i)
          .filter((i) => i === 0 || i === pages - 1 || Math.abs(i - page) <= 1)
          .reduce<Array<number | 'gap'>>((acc, i, idx, arr) => {
            if (idx > 0 && i - (arr[idx - 1] as number) > 1) acc.push('gap')
            acc.push(i)
            return acc
          }, [])
          .map((it, idx) =>
            it === 'gap' ? (
              <span key={`gap-${idx}`} className="px-1 font-mono text-xs text-faint">
                …
              </span>
            ) : (
              <button
                key={it}
                type="button"
                onClick={() => onChange(it)}
                aria-current={it === page ? 'page' : undefined}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border font-mono text-xs transition-colors',
                  it === page
                    ? 'border-accent/50 text-accent'
                    : 'border-hairline text-ink-muted hover:border-hairline-strong hover:text-ink',
                )}
              >
                {it + 1}
              </button>
            ),
          )}
        <button
          type="button"
          disabled={page >= pages - 1}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

/* ---------------- Sortable header ---------------- */

export function SortHeader({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string
  active: boolean
  dir: 'asc' | 'desc'
  onClick: () => void
  className?: string
}) {
  return (
    <th className={cn('px-4 py-3 text-left', className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors',
          active ? 'text-accent' : 'text-faint hover:text-ink-muted',
        )}
      >
        {label}
        <span aria-hidden className="text-[9px]">{active ? (dir === 'asc' ? '▲' : '▼') : '△'}</span>
      </button>
    </th>
  )
}

/* ---------------- Drawer ---------------- */

export function Drawer({
  open,
  onClose,
  title,
  meta,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  meta?: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-bg/70 backdrop-blur-sm"
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            data-lenis-prevent
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: EASE }}
            className="fixed inset-y-0 right-0 z-[90] flex w-full max-w-xl flex-col border-l border-hairline bg-surface"
          >
            <div className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-5">
              <div className="min-w-0">
                <h3 className="break-words font-display text-lg font-semibold leading-tight text-ink">{title}</h3>
                {meta && <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{meta}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close details"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hairline text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink"
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

/* ---------------- Detail rows ---------------- */

export function FieldRow({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-hairline py-3 sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{label}</dt>
      <dd className={cn('min-w-0 break-words text-sm leading-relaxed text-ink', mono && 'break-all font-mono text-xs')}>
        {children}
      </dd>
    </div>
  )
}

/* ---------------- Toggle ---------------- */

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-300',
        checked ? 'border-accent/60 bg-accent/20' : 'border-hairline-strong bg-surface-2',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all duration-300',
          checked ? 'left-[22px] bg-accent' : 'left-1 bg-ink-muted',
        )}
      />
    </button>
  )
}

/* ---------------- Sparkline ---------------- */

export function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const w = 120
  const h = 32
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const path = points
    .map((p, i) => `${((i / (points.length - 1)) * w).toFixed(1)},${(h - ((p - min) / range) * (h - 4) - 2).toFixed(1)}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('h-8 w-full', className)} preserveAspectRatio="none" aria-hidden>
      <polyline points={path} fill="none" stroke="var(--lime)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
    </svg>
  )
}

/* ---------------- Empty state ---------------- */

export function EmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <p className="kicker">( No results )</p>
      <p className="mt-3 max-w-xs text-sm text-ink-muted">Nothing matches the current search and filters.</p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-6 inline-flex h-10 items-center rounded-full border border-hairline-strong px-5 text-sm text-ink transition-colors hover:border-ink/50 hover:bg-ink/5"
        >
          Reset filters
        </button>
      )}
    </div>
  )
}

/* ---------------- Section header for each category ---------------- */

export function ViewHeader({ index, title, blurb, actions }: { index: string; title: string; blurb: string; actions?: ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">[{index}] ARCWELL control room</p>
          <h1 className="mt-3 font-display text-[clamp(28px,4vw,48px)] font-semibold leading-none tracking-[-0.02em] text-ink">
            {title}
          </h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">{blurb}</p>
      <div aria-hidden className="mt-6 h-px w-full bg-hairline" />
    </div>
  )
}
