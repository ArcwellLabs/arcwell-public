import { ArcNetworkCheck } from './ArcTools'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Anchor, ArrowUpRight, ShieldCheck, Timer, Users } from 'lucide-react'
import {
  ANCHOR_FEED,
  CORRECTIONS,
  DASHBOARD_KPIS,
  FINDINGS,
  NETWORK_STATUS,
  RECORD_SERIES,
  TRANSACTIONS,
  VERIFIERS,
} from '@/data/dashboard'
import type { AnchorFeedItem } from '@/data/dashboard'
import {
  CopyButton,
  EASE,
  ExportJsonButton,
  FilterChips,
  Panel,
  PanelHeader,
  Sparkline,
  StatusPill,
  ViewHeader,
  fmtNum,
  shortHash,
  timeAgo,
} from '@/pages/dashboard/ui'

const FEED_FILTERS = ['all', 'anchor', 'verification', 'correction', 'flag'] as const
type FeedFilter = (typeof FEED_FILTERS)[number]

function KpiCard({
  index,
  icon: Icon,
  label,
  value,
  suffix,
  delta,
  spark,
}: {
  index: string
  icon: typeof Anchor
  label: string
  value: string
  suffix?: string
  delta: string
  spark: number[]
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE, delay: 0.05 * Number(index) }}
    >
      <Panel className="group h-full p-5 transition-colors duration-300 hover:border-hairline-strong">
        <div className="flex items-start justify-between">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-ink-muted transition-colors group-hover:border-accent/40 group-hover:text-accent">
            <Icon size={15} />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">[{index}]</span>
        </div>
        <p className="tabular mt-5 font-mono text-3xl font-medium text-ink md:text-4xl">
          {value}
          {suffix && <span className="ml-1 text-base text-ink-muted">{suffix}</span>}
        </p>
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">{label}</p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <Sparkline points={spark} className="max-w-[110px]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent">{delta}</span>
        </div>
      </Panel>
    </motion.div>
  )
}

function FeedRow({ item }: { item: AnchorFeedItem }) {
  return (
    <li className="flex items-start gap-4 px-5 py-3.5 transition-colors hover:bg-surface-2/60">
      <span className="mt-1.5 flex h-2 w-2 shrink-0">
        <span
          className={
            item.kind === 'anchor'
              ? 'h-2 w-2 rounded-full bg-accent'
              : item.kind === 'verification'
                ? 'h-2 w-2 rounded-full bg-ink'
                : item.kind === 'correction'
                  ? 'h-2 w-2 rounded-full bg-amber'
                  : 'h-2 w-2 rounded-full bg-ink'
          }
          aria-hidden
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink">{item.detail}</p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
          {item.ref} · slot {fmtNum(item.slot)}
        </p>
      </div>
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">{timeAgo(item.at)}</span>
    </li>
  )
}

export default function Overview() {
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all')

  const feed = useMemo(
    () => (feedFilter === 'all' ? ANCHOR_FEED : ANCHOR_FEED.filter((f) => f.kind === feedFilter)),
    [feedFilter],
  )

  const health = useMemo(() => {
    const total = TRANSACTIONS.length
    const verified = TRANSACTIONS.filter((t) => t.verificationStatus === 'verified').length
    const anchored = TRANSACTIONS.filter((t) => t.verificationStatus === 'anchored').length
    const flagged = TRANSACTIONS.filter((t) => t.verificationStatus === 'flagged').length
    const corrected = TRANSACTIONS.filter((t) => t.verificationStatus === 'corrected').length
    const pending = total - verified - anchored - flagged - corrected
    return { total, verified, anchored, flagged, corrected, pending }
  }, [])

  const segments = [
    { label: 'verified', count: health.verified, color: 'var(--lime)' },
    { label: 'anchored', count: health.anchored, color: '#EDEDEA' },
    { label: 'pending', count: health.pending, color: '#8B8B93' },
    { label: 'corrected', count: health.corrected, color: '#9A9AA2' },
    { label: 'flagged', count: health.flagged, color: '#F87171' },
  ]

  return (
    <div>
      <ViewHeader
        index="01"
        title="Overview"
        blurb="Live state of the ARCWELL registry on ARC, anchors, verification health, and network conditions. All figures are mock telemetry for this control-room preview."
        actions={<ExportJsonButton data={{ kpis: DASHBOARD_KPIS, network: NETWORK_STATUS, feed: ANCHOR_FEED }} filename="arcwell-overview.json" />

      <ArcNetworkCheck />}
      />

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index="1" icon={Anchor} label="Anchors submitted" value={fmtNum(DASHBOARD_KPIS.anchorsSubmitted)} delta="+4.2% / 7d" spark={NETWORK_STATUS.slotHistory.slice(0, 16)} />
        <KpiCard index="2" icon={ShieldCheck} label="Records verified" value={fmtNum(DASHBOARD_KPIS.recordsVerified)} delta="+2.8% / 7d" spark={NETWORK_STATUS.slotHistory.slice(8, 24)} />
        <KpiCard index="3" icon={Timer} label="Avg confirmation" value={String(DASHBOARD_KPIS.avgConfirmationMs)} suffix="ms" delta="-38ms / 24h" spark={NETWORK_STATUS.slotHistory.slice(4, 20)} />
        <KpiCard index="4" icon={Users} label="Verifier accuracy" value={`${DASHBOARD_KPIS.verifierAccuracy}%`} delta="+0.3pt / 30d" spark={NETWORK_STATUS.slotHistory.slice(12, 28)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Verification health */}
        <Panel className="xl:col-span-7">
          <PanelHeader title="Verification health" meta="Record status distribution" />
          <div className="p-5">
            <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Record status distribution">
              {segments.map((s) => (
                <motion.span
                  key={s.label}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, ease: EASE }}
                  className="h-full origin-left rounded-full"
                  style={{ width: `${(s.count / health.total) * 100}%`, background: s.color }}
                />
              ))}
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {segments.map((s) => (
                <li key={s.label} className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden />
                  <div>
                    <p className="tabular font-mono text-sm text-ink">{s.count}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{s.label}</p>
                  </div>
                </li>
              ))}
              <li className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full border border-hairline-strong" aria-hidden />
                <div>
                  <p className="tabular font-mono text-sm text-ink">{health.total}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">total records</p>
                </div>
              </li>
            </ul>

            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-hairline pt-6 sm:grid-cols-4">
              <div>
                <p className="tabular font-mono text-xl text-ink">{RECORD_SERIES.length}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">record series</p>
              </div>
              <div>
                <p className="tabular font-mono text-xl text-ink">{VERIFIERS.filter((v) => v.status === 'active').length}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">active verifiers</p>
              </div>
              <div>
                <p className="tabular font-mono text-xl text-amber">{FINDINGS.filter((f) => f.status === 'open').length}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">open findings</p>
              </div>
              <div>
                <p className="tabular font-mono text-xl text-amber">{CORRECTIONS.filter((c) => c.status === 'open').length}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">open corrections</p>
              </div>
            </div>
          </div>
        </Panel>

        {/* Network status */}
        <Panel className="xl:col-span-5">
          <PanelHeader
            title="ARC network status"
            meta={NETWORK_STATUS.network}
            actions={<StatusPill value={NETWORK_STATUS.state} />}
          />
          <div className="p-5">
            {/* abstract grid visual */}
            <div className="relative overflow-hidden rounded-xl border border-hairline bg-bg p-4">
              <svg viewBox="0 0 300 96" className="w-full" aria-hidden>
                {Array.from({ length: 25 }, (_, i) => (
                  <line key={`v${i}`} x1={i * 12.5} y1="0" x2={i * 12.5} y2="96" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                ))}
                {Array.from({ length: 8 }, (_, i) => (
                  <line key={`h${i}`} x1="0" y1={i * 12} x2="300" y2={i * 12} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                ))}
                <polyline
                  points={NETWORK_STATUS.slotHistory
                    .map((v, i) => `${(i / (NETWORK_STATUS.slotHistory.length - 1)) * 300},${96 - ((v - 300) / 300) * 90}`)
                    .join(' ')}
                  fill="none"
                  stroke="var(--lime)"
                  strokeWidth="1.5"
                />
              </svg>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                confirmation latency, last 32 checkpoints
              </p>
            </div>
            <dl className="mt-5 space-y-0">
              {[
                ['Current slot', fmtNum(NETWORK_STATUS.currentSlot)],
                ['Anchors · 24h', fmtNum(NETWORK_STATUS.anchors24h)],
                ['Records · 24h', fmtNum(NETWORK_STATUS.records24h)],
                ['Avg confirmation', `${NETWORK_STATUS.avgConfirmationMs} ms`],
                ['Uptime · 30d', `${NETWORK_STATUS.uptime30d}%`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-hairline py-2.5 last:border-b-0">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{k}</dt>
                  <dd className="tabular font-mono text-sm text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Panel>
      </div>

      {/* Anchor feed */}
      <Panel className="mt-6">
        <PanelHeader
          title="Anchor feed"
          meta="Latest registry activity on ARC"
          actions={
            <div className="flex items-center gap-2">
              <CopyButton text={ANCHOR_FEED[0] ? shortHash(ANCHOR_FEED[0].ref, 64) : ''} label="Latest ref" />
              <ArrowUpRight size={15} className="text-faint" aria-hidden />
            </div>
          }
        />
        <div className="border-b border-hairline px-5 py-3">
          <FilterChips options={FEED_FILTERS} value={feedFilter} onChange={setFeedFilter} />
        </div>
        {feed.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-muted">No {feedFilter} events in the current window.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {feed.slice(0, 10).map((item) => (
              <FeedRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
